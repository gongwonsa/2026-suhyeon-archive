// 2026 수현중 소프트웨어의 날 온라인 작품 전시회 웹 앱 API.
// 공개 저장소에 있는 파일이므로 접속 코드, 교사 이메일, 시트 ID 같은 비밀 값을 쓰지 않는다.

const SHEETS = {
  works: ['id', 'work_no', 'title', 'artist_name', 'genre_id', 'description', 'link_url', 'is_ai', 'thumb', 'status', 'created_at', 'updated_at'],
  work_edits: ['id', 'work_id', 'edited_at', 'before_json', 'after_json'],
  consents: ['id', 'work_id', 'consent_version', 'agreed_at', 'agreed_public'],
  genres: ['id', 'code', 'label', 'sort_order'],
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

const LOGIN_FAIL_KEY = 'login-failures'
const LOGIN_FAIL_LIMIT = 20
const LOGIN_FAIL_WINDOW_SECONDS = 600
const SESSION_SECONDS = 3 * 60 * 60
const SESSION_TOKEN_PATTERN = /^[0-9a-f]{64}$/
const ACCESS_CODE_MIN_LENGTH = 4
const ACCESS_CODE_MAX_LENGTH = 50

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : ''
  if (action !== 'public') {
    return json_({ ok: false })
  }
  try {
    return json_(getPublicData_())
  } catch (error) {
    console.error('공개 목록을 만들지 못했습니다.', error)
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
    return json_({ ok: false })
  } catch (error) {
    console.error('요청을 처리하지 못했습니다.', error)
    return json_({ ok: false })
  }
}

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
    .map(toPublicWork_)
    .filter(Boolean)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  const data = { ok: true, works: works, genres: genres }

  const text = JSON.stringify(data)
  if (text.length < CACHE_VALUE_LIMIT) {
    cache.put(PUBLIC_CACHE_KEY, text, PUBLIC_CACHE_SECONDS)
  }
  return data
}

function toPublicWork_(row) {
  if (String(row.status).trim() !== '공개') return null

  const id = toInteger_(row.id)
  const workNo = toInteger_(row.work_no)
  const genreId = toInteger_(row.genre_id)
  const title = String(row.title).trim()
  const artistName = String(row.artist_name).trim()
  const linkUrl = String(row.link_url).trim()
  if (id === null || workNo === null || genreId === null || !title || !artistName) return null
  if (!/^https?:\/\//i.test(linkUrl)) return null

  const thumb = String(row.thumb).trim()
  return {
    id: id,
    work_no: workNo,
    title: title,
    artist_name: artistName,
    genre_id: genreId,
    description: String(row.description),
    link_url: linkUrl,
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

// 탭의 행을 머리글 이름으로 읽는다. 열 순서가 바뀌어도 동작한다.
function readRows_(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name)
  if (!sheet) return []
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

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON)
}

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

// 처음 한 번 실행한다. 탭과 머리글, 기본 장르를 만든다. 이미 있는 내용은 지우지 않는다.
function setupSheets() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  Object.keys(SHEETS).forEach((name) => {
    const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(SHEETS[name])
      sheet.setFrozenRows(1)
    }
  })
  const genres = spreadsheet.getSheetByName('genres')
  if (genres.getLastRow() === 1) {
    genres.getRange(2, 1, DEFAULT_GENRES.length, DEFAULT_GENRES[0].length).setValues(DEFAULT_GENRES)
  }
}

// 시트에서 바꾼 내용을 사이트에 바로 반영하고 싶을 때 편집기에서 실행한다.
function clearPublicCache() {
  CacheService.getScriptCache().remove(PUBLIC_CACHE_KEY)
}
