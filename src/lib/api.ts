export type WorkStatus = '대기' | '공개' | '숨김' | '삭제요청'

// 공개 API가 돌려주는 작품. 공개 상태인 작품만 오므로 status는 없다.
export interface Work {
  id: number
  work_no: number // 등록 순서대로 한 번 부여하는 고정 전시 번호
  title: string
  artist_name: string
  genre_id: number
  description: string
  link_url: string
  is_ai: boolean
  thumb_path: string | null
  created_at: string
  updated_at: string
}

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL ?? ''

let publicWorksRequest: Promise<Work[]> | null = null

function isWork(value: unknown): value is Work {
  if (typeof value !== 'object' || value === null) return false
  const work = value as Record<string, unknown>
  return (
    typeof work.id === 'number' &&
    typeof work.work_no === 'number' &&
    typeof work.title === 'string' &&
    typeof work.artist_name === 'string' &&
    typeof work.genre_id === 'number' &&
    typeof work.description === 'string' &&
    typeof work.link_url === 'string' &&
    /^https?:\/\//i.test(work.link_url) &&
    typeof work.is_ai === 'boolean' &&
    (typeof work.thumb_path === 'string' || work.thumb_path === null) &&
    typeof work.created_at === 'string' &&
    typeof work.updated_at === 'string'
  )
}

async function loadPublicWorks(): Promise<Work[]> {
  if (!APPS_SCRIPT_URL) {
    if (import.meta.env.PROD) {
      throw new Error('웹 앱 주소가 설정되지 않았습니다.')
    }
    const { sampleWorks } = await import('../data/sample-works')
    return sampleWorks
      .filter((work) => work.status === '공개')
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  const response = await fetch(`${APPS_SCRIPT_URL}?action=public`)
  if (!response.ok) {
    throw new Error('공개 목록을 불러오지 못했습니다.')
  }
  const data: unknown = await response.json()
  if (typeof data !== 'object' || data === null) {
    throw new Error('공개 목록 형식이 올바르지 않습니다.')
  }
  const { ok, works } = data as Record<string, unknown>
  if (ok !== true || !Array.isArray(works)) {
    throw new Error('공개 목록 형식이 올바르지 않습니다.')
  }
  return works.filter(isWork)
}

// 공개 작품을 최신순으로 가져온다. 한 번 불러온 목록은 페이지를 새로 열 때까지 다시 쓴다.
export function fetchPublicWorks(): Promise<Work[]> {
  if (!publicWorksRequest) {
    publicWorksRequest = loadPublicWorks().catch((error: unknown) => {
      publicWorksRequest = null
      throw error
    })
  }
  return publicWorksRequest
}

// 공개 작품 하나를 가져온다. 공개 상태가 아니거나 없으면 null을 돌려준다.
export async function fetchPublicWork(id: number): Promise<Work | null> {
  const works = await fetchPublicWorks()
  return works.find((work) => work.id === id) ?? null
}

// --- 학생 업로드 ---

export type LoginResult = 'ok' | 'invalid' | 'error'

interface UploadSession {
  token: string
  expires_at: string
}

const SESSION_STORAGE_KEY = 'upload-session'
const DEV_ACCESS_CODE = 'sample'
const SESSION_MILLISECONDS = 3 * 60 * 60 * 1000

// 쓰기 요청은 사전 요청(CORS preflight)이 생기지 않도록 text/plain 본문으로 보낸다.
async function postAction(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error('요청을 처리하지 못했습니다.')
  }
  const data: unknown = await response.json()
  if (typeof data !== 'object' || data === null) {
    throw new Error('응답 형식이 올바르지 않습니다.')
  }
  return data as Record<string, unknown>
}

function saveUploadSession(session: UploadSession): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // 저장소를 쓸 수 없는 브라우저에서는 이 화면을 벗어나면 다시 입장해야 한다.
  }
}

export function getUploadSession(): UploadSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const session: unknown = JSON.parse(raw)
    if (typeof session !== 'object' || session === null) return null
    const { token, expires_at } = session as Record<string, unknown>
    if (typeof token !== 'string' || typeof expires_at !== 'string') return null
    if (Date.parse(expires_at) <= Date.now()) {
      clearUploadSession()
      return null
    }
    return { token, expires_at }
  } catch {
    return null
  }
}

export function clearUploadSession(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // 지울 저장소가 없으면 할 일도 없다.
  }
}

// 접속 코드를 확인하고 세션을 저장한다. 웹 앱 주소가 없는 개발 환경에서는 'sample'만 통과한다.
export async function login(code: string): Promise<LoginResult> {
  try {
    if (!APPS_SCRIPT_URL) {
      if (import.meta.env.PROD) return 'error'
      if (code.trim() !== DEV_ACCESS_CODE) return 'invalid'
      saveUploadSession({ token: 'dev', expires_at: new Date(Date.now() + SESSION_MILLISECONDS).toISOString() })
      return 'ok'
    }
    const data = await postAction({ action: 'login', code })
    if (data.ok === true && typeof data.token === 'string' && typeof data.expires_at === 'string') {
      saveUploadSession({ token: data.token, expires_at: data.expires_at })
      return 'ok'
    }
    return data.error === 'invalid' ? 'invalid' : 'error'
  } catch {
    return 'error'
  }
}

// 저장된 세션이 서버에서도 유효한지 확인한다. 접속 코드가 바뀌었으면 세션을 지운다.
export async function verifyUploadSession(): Promise<boolean> {
  const session = getUploadSession()
  if (!session) return false
  if (!APPS_SCRIPT_URL) return true
  try {
    const data = await postAction({ action: 'session', token: session.token })
    if (data.ok === true) return true
    clearUploadSession()
    return false
  } catch {
    // 연결 문제일 수 있으므로 세션은 남겨 두고, 다음 요청에서 다시 확인한다.
    return true
  }
}
