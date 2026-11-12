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

// 처음 한 번 편집기에서 실행한다. 탭과 머리글, 기본 장르를 만든다. 이미 있는 내용은 지우지 않는다.
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
