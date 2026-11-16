// 2026 수현중 소프트웨어의 날 온라인 작품 전시회 웹 앱 API.
// 공개 저장소에 있는 파일이므로 접속 코드, 교사 이메일, 시트 ID 같은 비밀 값을 쓰지 않는다.

const SHEETS = {
  works: ['id', 'work_no', 'title', 'artist_name', 'genre_id', 'description', 'link_url', 'is_ai', 'thumb', 'status', 'created_at', 'updated_at', 'work_type', 'html_ref'],
  work_edits: ['id', 'work_id', 'edited_at', 'before_json', 'after_json'],
  consents: ['id', 'work_id', 'consent_version', 'agreed_at', 'agreed_public'],
  genres: ['id', 'code', 'label', 'sort_order'],
  html_files: ['work_id', 'part', 'content'],
}

const DEFAULT_GENRES = [
  [1, 'game', '게임', 1],
  [2, 'anim', '애니메이션', 2],
  [3, 'sim', '시뮬레이션', 3],
  [4, 'agent', 'AI 에이전트 도구(바이브코딩)', 4],
  [6, 'study', '학습 지원', 5],
  [5, 'etc', '기타', 6],
]

const PUBLIC_CACHE_KEY = 'public-data-v1'
const PUBLIC_CACHE_SECONDS = 300
const CACHE_VALUE_LIMIT = 100000
const THUMB_PATTERN = /^(data:image\/(png|jpeg|webp);base64,|https:\/\/)/
const UPLOAD_THUMB_PATTERN = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/
const THUMB_MAX_CHARS = 45000
const HTML_MAX_CHARS = 5 * 1024 * 1024
// 시트 한 칸은 5만 자까지라 HTML은 나눠서 html_files 탭에 저장한다.
const HTML_CHUNK_CHARS = 45000
const HTML_REF_PATTERN = /^(\d+):(\d+)$/
const STATUSES = ['대기', '공개', '숨김', '삭제요청']

const LOGIN_FAIL_KEY = 'login-failures'
const LOGIN_FAIL_LIMIT = 20
const LOGIN_FAIL_WINDOW_SECONDS = 600
const SESSION_SECONDS = 3 * 60 * 60
const SESSION_TOKEN_PATTERN = /^[0-9a-f]{64}$/
const ACCESS_CODE_MIN_LENGTH = 4
const ACCESS_CODE_MAX_LENGTH = 50

// 세션 토큰이 있어야 하는 요청
const SESSION_ACTIONS = {
  list: listWorks_,
  create: createWork_,
  update: updateWork_,
  requestDelete: requestDelete_,
}

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {}
  try {
    if (params.action === 'public') return json_(getPublicData_())
    if (params.action === 'html') return json_(getWorkHtml_(params.id))
    return json_({ ok: false })
  } catch (error) {
    console.error('조회 요청을 처리하지 못했습니다.', error)
    return json_({ ok: false })
  }
}

// 쓰기 요청은 POST 본문(JSON 문자열)으로 받는다. 브라우저가 사전 요청 없이 보내도록 text/plain으로 보낸다.
function doPost(e) {
  let request
  try {
    request = JSON.parse(e.postData.contents)
  } catch (error) {
    return json_({ ok: false })
  }
  if (typeof request !== 'object' || request === null) {
    return json_({ ok: false })
  }
  try {
    if (request.action === 'login') return json_(login_(request.code))
    if (request.action === 'session') return json_({ ok: isValidSession_(request.token) })
    if (typeof request.action === 'string' && Object.prototype.hasOwnProperty.call(SESSION_ACTIONS, request.action)) {
      if (!isValidSession_(request.token)) return json_({ ok: false, error: 'session' })
      return json_(SESSION_ACTIONS[request.action](request))
    }
    return json_({ ok: false })
  } catch (error) {
    console.error('요청을 처리하지 못했습니다.', error)
    return json_({ ok: false })
  }
}

// --- 접속 코드와 세션 ---

// 접속 코드를 확인하고 세션 토큰을 발급한다. 실패 사유와 상관없이 같은 오류를 돌려준다.
function login_(code) {
  const cache = CacheService.getScriptCache()
  const lock = LockService.getScriptLock()
  lock.waitLock(5000)
  try {
    const failures = Number(cache.get(LOGIN_FAIL_KEY)) || 0
    if (failures >= LOGIN_FAIL_LIMIT) {
      return { ok: false, error: 'invalid' }
    }
    if (!isAccessCode_(code)) {
      cache.put(LOGIN_FAIL_KEY, String(failures + 1), LOGIN_FAIL_WINDOW_SECONDS)
      return { ok: false, error: 'invalid' }
    }
  } finally {
    lock.releaseLock()
  }

  const token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '')
  const version = PropertiesService.getScriptProperties().getProperty('SESSION_VERSION')
  cache.put('session:' + token, version, SESSION_SECONDS)
  return { ok: true, token: token, expires_at: new Date(Date.now() + SESSION_SECONDS * 1000).toISOString() }
}

function isAccessCode_(code) {
  if (typeof code !== 'string') return false
  const properties = PropertiesService.getScriptProperties()
  const hash = properties.getProperty('ACCESS_CODE_HASH')
  const salt = properties.getProperty('ACCESS_CODE_SALT')
  if (!hash || !salt) return false
  return hashAccessCode_(salt, code.trim()) === hash
}

// 접속 코드를 바꾸면 세션 버전도 바뀌어 기존 세션이 모두 무효가 된다.
function isValidSession_(token) {
  if (typeof token !== 'string' || !SESSION_TOKEN_PATTERN.test(token)) return false
  const version = CacheService.getScriptCache().get('session:' + token)
  return version !== null && version === PropertiesService.getScriptProperties().getProperty('SESSION_VERSION')
}

function hashAccessCode_(salt, code) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + code, Utilities.Charset.UTF_8)
  return Utilities.base64Encode(bytes)
}

function setAccessCode_(code) {
  const salt = Utilities.getUuid()
  PropertiesService.getScriptProperties().setProperties({
    ACCESS_CODE_SALT: salt,
    ACCESS_CODE_HASH: hashAccessCode_(salt, code),
    ACCESS_CODE_CHANGED_AT: new Date().toISOString(),
    SESSION_VERSION: Utilities.getUuid(),
  })
}

// --- 공개 조회 ---

// 공개 작품과 장르를 돌려준다. 공개 상태가 아닌 작품과 공개하지 않는 열은 포함하지 않는다.
function getPublicData_() {
  const cache = CacheService.getScriptCache()
  const cached = cache.get(PUBLIC_CACHE_KEY)
  if (cached) {
    return JSON.parse(cached)
  }

  const genres = readRows_('genres')
    .map(toPublicGenre_)
    .filter(Boolean)
    .sort((a, b) => a.sort_order - b.sort_order)
  const works = readRows_('works')
    .filter((row) => String(row.status).trim() === '공개')
    .map(toWork_)
    .filter(Boolean)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  const data = { ok: true, works: works, genres: genres }

  const text = JSON.stringify(data)
  if (text.length < CACHE_VALUE_LIMIT) {
    cache.put(PUBLIC_CACHE_KEY, text, PUBLIC_CACHE_SECONDS)
  }
  return data
}

// 공개된 HTML 작품의 내용을 돌려준다.
function getWorkHtml_(idParam) {
  const id = toInteger_(idParam)
  if (id === null) return { ok: false }
  const cache = CacheService.getScriptCache()
  const cached = cache.get('html:' + id)
  if (cached) return { ok: true, html: cached }

  const row = readRows_('works').find((item) => toInteger_(item.id) === id)
  if (!row || String(row.status).trim() !== '공개') return { ok: false }
  const work = toWork_(row)
  if (!work || work.work_type !== 'html') return { ok: false }
  const html = readHtml_(String(row.html_ref).trim(), id)
  if (html === null) return { ok: false }
  if (html.length < CACHE_VALUE_LIMIT) cache.put('html:' + id, html, PUBLIC_CACHE_SECONDS)
  return { ok: true, html: html }
}

// 시트 한 행을 작품으로 바꾼다. 필수 값이 빠졌거나 링크가 http(s)가 아니면 null.
function toWork_(row) {
  const id = toInteger_(row.id)
  const workNo = toInteger_(row.work_no)
  const genreId = toInteger_(row.genre_id)
  const title = String(row.title).trim()
  const artistName = String(row.artist_name).trim()
  const workType = String(row.work_type).trim() === 'html' ? 'html' : 'link'
  const linkUrl = String(row.link_url).trim()
  if (id === null || workNo === null || genreId === null || !title || !artistName) return null
  if (workType === 'link' && !/^https?:\/\//i.test(linkUrl)) return null
  if (workType === 'html' && !HTML_REF_PATTERN.test(String(row.html_ref).trim())) return null

  const thumb = String(row.thumb).trim()
  return {
    id: id,
    work_no: workNo,
    title: title,
    artist_name: artistName,
    genre_id: genreId,
    description: String(row.description),
    work_type: workType,
    link_url: workType === 'link' ? linkUrl : '',
    is_ai: row.is_ai === true || String(row.is_ai).toUpperCase() === 'TRUE',
    thumb_path: THUMB_PATTERN.test(thumb) ? thumb : null,
    created_at: toIsoString_(row.created_at),
    updated_at: toIsoString_(row.updated_at),
  }
}

function toPublicGenre_(row) {
  const id = toInteger_(row.id)
  const code = String(row.code).trim()
  const label = String(row.label).trim()
  if (id === null || !code || !label) return null
  return { id: id, code: code, label: label, sort_order: toInteger_(row.sort_order) || 0 }
}

// --- 학생 업로드 ---

// 업로드 화면의 전체 작품 목록. 상태를 함께 보내고 동의 기록과 수정 이력은 보내지 않는다.
function listWorks_() {
  const works = readRows_('works')
    .map((row) => {
      const work = toWork_(row)
      const status = String(row.status).trim()
      if (!work || STATUSES.indexOf(status) === -1) return null
      work.status = status
      return work
    })
    .filter(Boolean)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  return { ok: true, works: works }
}

function createWork_(request) {
  const work = cleanWork_(request.work, null)
  const version = request.consent_version
  if (!work || typeof version !== 'string' || !version.trim() || version.length > 50) {
    return { ok: false, error: 'invalid' }
  }
  return withLock_(() => {
    const works = openTable_('works')
    const rows = readTable_(works)
    const id = nextNumber_('NEXT_WORK_ID', rows, 'id')
    const workNo = nextNumber_('NEXT_WORK_NO', rows, 'work_no')
    const now = new Date().toISOString()
    writeRow_(works, works.sheet.getLastRow() + 1, {
      id: id,
      work_no: workNo,
      title: work.title,
      artist_name: work.artist_name,
      genre_id: work.genre_id,
      description: work.description,
      work_type: work.work_type,
      link_url: work.link_url,
      html_ref: work.work_type === 'html' ? saveHtml_(id, work.html) : '',
      is_ai: work.is_ai,
      thumb: work.thumb || '',
      status: '공개',
      created_at: now,
      updated_at: now,
    })

    const consents = openTable_('consents')
    writeRow_(consents, consents.sheet.getLastRow() + 1, {
      id: nextNumber_('NEXT_CONSENT_ID', readTable_(consents), 'id'),
      work_id: id,
      consent_version: version.trim(),
      agreed_at: now,
      agreed_public: true,
    })
    clearPublicCache()
    return { ok: true, id: id }
  })
}

// 수정은 공개 상태를 바꾸지 않는다. 수정 전후 내용은 work_edits 탭에 남긴다 (썸네일과 HTML 본문은 바뀌었는지만 기록).
function updateWork_(request) {
  const id = toInteger_(request.id)
  if (id === null) return { ok: false, error: 'invalid' }
  return withLock_(() => {
    const works = openTable_('works')
    const row = readTable_(works).find((item) => toInteger_(item.id) === id)
    if (!row || String(row.status).trim() === '삭제요청') return { ok: false, error: 'invalid' }
    const existingType = String(row.work_type).trim() === 'html' ? 'html' : 'link'
    const existingRef = String(row.html_ref).trim()
    const work = cleanWork_(request.work, { work_type: existingType, html_ref: existingRef })
    if (!work) return { ok: false, error: 'invalid' }

    let htmlRef = existingRef
    if (work.work_type === 'html' && work.html !== undefined) {
      clearHtml_(existingRef)
      htmlRef = saveHtml_(id, work.html)
    } else if (work.work_type === 'link') {
      clearHtml_(existingRef)
      htmlRef = ''
    }

    const now = new Date().toISOString()
    const before = editSnapshot_(row, existingType)
    const changes = {
      title: work.title,
      artist_name: work.artist_name,
      genre_id: work.genre_id,
      description: work.description,
      work_type: work.work_type,
      link_url: work.link_url,
      html_ref: htmlRef,
      is_ai: work.is_ai,
      updated_at: now,
    }
    if (work.thumb !== undefined) changes.thumb = work.thumb || ''
    writeRow_(works, row.__row, changes, row)

    const after = editSnapshot_(changes, work.work_type)
    after.thumb_changed = work.thumb !== undefined
    after.html_changed = work.html !== undefined
    const edits = openTable_('work_edits')
    writeRow_(edits, edits.sheet.getLastRow() + 1, {
      id: nextNumber_('NEXT_EDIT_ID', readTable_(edits), 'id'),
      work_id: id,
      edited_at: now,
      before_json: JSON.stringify(before),
      after_json: JSON.stringify(after),
    })
    clearWorkCaches_(id)
    return { ok: true }
  })
}

function requestDelete_(request) {
  const id = toInteger_(request.id)
  if (id === null) return { ok: false, error: 'invalid' }
  return withLock_(() => {
    const works = openTable_('works')
    const row = readTable_(works).find((item) => toInteger_(item.id) === id)
    if (!row) return { ok: false, error: 'invalid' }
    writeRow_(works, row.__row, { status: '삭제요청', updated_at: new Date().toISOString() }, row)
    clearWorkCaches_(id)
    return { ok: true }
  })
}

// 학생이 보낸 작품 입력을 검사하고 정리한다. 올바르지 않으면 null.
// html, thumb가 undefined이면 기존 값을 유지하고, thumb가 null이면 지운다.
function cleanWork_(work, existing) {
  if (typeof work !== 'object' || work === null) return null
  const text = (value, max, required) => {
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    if ((required && !trimmed) || trimmed.length > max) return null
    return trimmed
  }
  const artistName = text(work.artist_name, 100, true)
  const title = text(work.title, 200, true)
  const description = text(work.description === undefined ? '' : work.description, 5000, false)
  if (artistName === null || title === null || description === null) return null
  if (!Number.isInteger(work.genre_id) || !genreExists_(work.genre_id)) return null
  if (work.work_type !== 'link' && work.work_type !== 'html') return null
  if (typeof work.is_ai !== 'boolean') return null

  let linkUrl = ''
  if (work.work_type === 'link') {
    linkUrl = text(work.link_url, 2000, true)
    if (!linkUrl || !/^https?:\/\/\S+$/i.test(linkUrl)) return null
  }

  let html
  if (work.html !== undefined) {
    if (typeof work.html !== 'string' || !work.html.trim() || work.html.length > HTML_MAX_CHARS) return null
    html = work.html
  }
  const hasExistingHtml = existing && existing.work_type === 'html' && HTML_REF_PATTERN.test(existing.html_ref)
  if (work.work_type === 'html' && html === undefined && !hasExistingHtml) return null

  let thumb
  if (work.thumb === null) {
    thumb = null
  } else if (work.thumb !== undefined) {
    if (typeof work.thumb !== 'string' || work.thumb.length > THUMB_MAX_CHARS || !UPLOAD_THUMB_PATTERN.test(work.thumb)) return null
    thumb = work.thumb
  }

  return {
    artist_name: artistName,
    title: title,
    description: description,
    genre_id: work.genre_id,
    work_type: work.work_type,
    link_url: linkUrl,
    is_ai: work.is_ai,
    html: html,
    thumb: thumb,
  }
}

function genreExists_(genreId) {
  return readRows_('genres').some((row) => toInteger_(row.id) === genreId)
}

function editSnapshot_(source, workType) {
  return {
    title: String(source.title),
    artist_name: String(source.artist_name),
    genre_id: toInteger_(source.genre_id),
    description: String(source.description),
    work_type: workType,
    link_url: String(source.link_url),
    is_ai: source.is_ai === true || String(source.is_ai).toUpperCase() === 'TRUE',
  }
}

function clearWorkCaches_(id) {
  const cache = CacheService.getScriptCache()
  cache.remove(PUBLIC_CACHE_KEY)
  cache.remove('html:' + id)
}

// --- HTML 본문 저장 ---

// html_files 탭에 나눠 저장하고 "시작행:행수" 형태의 위치를 돌려준다.
function saveHtml_(workId, html) {
  const table = openTable_('html_files')
  const parts = []
  for (let start = 0; start < html.length; start += HTML_CHUNK_CHARS) {
    parts.push(html.slice(start, start + HTML_CHUNK_CHARS))
  }
  const firstRow = table.sheet.getLastRow() + 1
  const range = table.sheet.getRange(firstRow, 1, parts.length, 3)
  range.setNumberFormat('@')
  range.setValues(parts.map((part, index) => [String(workId), String(index + 1), part]))
  return firstRow + ':' + parts.length
}

function readHtml_(ref, workId) {
  const match = HTML_REF_PATTERN.exec(ref)
  if (!match) return null
  const table = openTable_('html_files')
  const firstRow = Number(match[1])
  const count = Number(match[2])
  if (firstRow < 2 || count < 1 || firstRow + count - 1 > table.sheet.getLastRow()) return null
  const values = table.sheet.getRange(firstRow, 1, count, 3).getValues()
  if (values.some((cells) => String(cells[0]) !== String(workId))) return null
  return values.map((cells) => String(cells[2])).join('')
}

// 바꾸거나 링크 작품으로 바뀐 HTML은 내용을 비운다. 다른 작품의 위치가 바뀌지 않도록 행은 지우지 않는다.
function clearHtml_(ref) {
  const match = HTML_REF_PATTERN.exec(ref)
  if (!match) return
  const table = openTable_('html_files')
  const firstRow = Number(match[1])
  const count = Number(match[2])
  if (firstRow < 2 || firstRow + count - 1 > table.sheet.getLastRow()) return
  table.sheet.getRange(firstRow, 1, count, 3).clearContent()
}

// --- 시트 읽기와 쓰기 ---

// 탭을 열고 빠진 머리글을 끝에 추가한다. 이미 쓰던 시트에 새 열이 생겨도 기존 데이터는 그대로 둔다.
function openTable_(name) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = spreadsheet.getSheetByName(name)
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name)
    if (name === 'html_files') sheet.hideSheet()
  }
  let headers = []
  if (sheet.getLastRow() > 0) {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map((header) => String(header).trim())
  }
  const missing = SHEETS[name].filter((header) => headers.indexOf(header) === -1)
  if (missing.length > 0) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing])
    headers = headers.concat(missing)
    sheet.setFrozenRows(1)
  }
  return { sheet: sheet, headers: headers }
}

// 머리글 이름으로 읽은 행 목록. 각 행에 시트 행 번호(__row)와 원래 칸 값(__cells)을 붙인다.
function readTable_(table) {
  const lastRow = table.sheet.getLastRow()
  if (lastRow < 2) return []
  const values = table.sheet.getRange(2, 1, lastRow - 1, table.headers.length).getValues()
  return values.map((cells, index) => {
    const row = { __row: index + 2, __cells: cells }
    table.headers.forEach((header, column) => {
      row[header] = cells[column]
    })
    return row
  })
}

// 한 행을 텍스트 형식으로 쓴다. 학생 입력이 =로 시작해도 수식으로 실행되지 않는다.
// base(기존 행)를 주면 record에 없는 칸은 기존 값을 유지한다.
function writeRow_(table, rowNumber, record, base) {
  const values = table.headers.map((header, column) => {
    if (Object.prototype.hasOwnProperty.call(record, header)) return String(record[header])
    return base ? toCellText_(base.__cells[column]) : ''
  })
  const range = table.sheet.getRange(rowNumber, 1, 1, values.length)
  range.setNumberFormat('@')
  range.setValues([values])
}

// 교사가 시트에서 행을 지워도 번호가 다시 쓰이지 않도록 다음 번호를 스크립트 속성에 둔다.
function nextNumber_(key, rows, column) {
  const properties = PropertiesService.getScriptProperties()
  const largest = rows.reduce((max, row) => Math.max(max, toInteger_(row[column]) || 0), 0)
  const next = Math.max(Number(properties.getProperty(key)) || 1, largest + 1)
  properties.setProperty(key, String(next + 1))
  return next
}

function withLock_(callback) {
  const lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    return callback()
  } finally {
    lock.releaseLock()
  }
}

// 탭의 행을 머리글 이름으로 읽는다. 열 순서가 바뀌어도 동작한다.
function readRows_(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name)
  if (!sheet || sheet.getLastRow() === 0) return []
  const values = sheet.getDataRange().getValues()
  const headers = values.shift().map((header) => String(header).trim())
  return values.map((cells) => {
    const row = {}
    headers.forEach((header, index) => {
      row[header] = cells[index]
    })
    return row
  })
}

function toInteger_(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isInteger(number) ? number : null
}

function toIsoString_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') return value.toISOString()
  return String(value)
}

function toCellText_(value) {
  if (value === null || value === undefined) return ''
  return toIsoString_(value)
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON)
}

// --- 시트 메뉴 ---

// 시트를 열 때 상단에 관리 메뉴를 만든다.
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('전시 관리')
    .addItem('접속 코드 변경', 'menuChangeAccessCode')
    .addItem('사이트에 바로 반영', 'menuClearPublicCache')
    .addSeparator()
    .addItem('시트 탭 만들기', 'setupSheets')
    .addToUi()
}

function menuChangeAccessCode() {
  const ui = SpreadsheetApp.getUi()
  const response = ui.prompt(
    '접속 코드 변경',
    `새 접속 코드를 입력하세요 (${ACCESS_CODE_MIN_LENGTH}~${ACCESS_CODE_MAX_LENGTH}자). 원문은 저장되지 않습니다.`,
    ui.ButtonSet.OK_CANCEL,
  )
  if (response.getSelectedButton() !== ui.Button.OK) return
  const code = response.getResponseText().trim()
  if (code.length < ACCESS_CODE_MIN_LENGTH || code.length > ACCESS_CODE_MAX_LENGTH) {
    ui.alert(`접속 코드는 ${ACCESS_CODE_MIN_LENGTH}~${ACCESS_CODE_MAX_LENGTH}자로 입력하세요. 변경하지 않았습니다.`)
    return
  }
  setAccessCode_(code)
  ui.alert('변경했습니다. 기존 업로드 세션은 모두 종료되었습니다.')
}

function menuClearPublicCache() {
  clearPublicCache()
  SpreadsheetApp.getUi().alert('사이트에 바로 반영했습니다. 사이트를 새로고침하세요.')
}

// 처음 한 번 실행한다. 탭과 머리글, 기본 장르를 만든다. 이미 있는 내용은 지우지 않고 빠진 열만 추가한다.
function setupSheets() {
  Object.keys(SHEETS).forEach((name) => openTable_(name))
  const genres = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('genres')
  if (genres.getLastRow() === 1) {
    genres.getRange(2, 1, DEFAULT_GENRES.length, DEFAULT_GENRES[0].length).setValues(DEFAULT_GENRES)
  }
}

// 시트에서 바꾼 내용을 사이트에 바로 반영한다. 공개 목록 캐시를 비운다 (HTML 캐시는 5분 안에 만료된다).
function clearPublicCache() {
  CacheService.getScriptCache().remove(PUBLIC_CACHE_KEY)
}
