import { GENRES } from './constants'
import type { Genre } from './constants'

export type WorkStatus = '대기' | '공개' | '숨김' | '삭제요청'
export type WorkType = 'link' | 'html'

// 공개 API가 돌려주는 작품. 공개 상태인 작품만 오므로 status는 없다.
// HTML 작품은 link_url이 비어 있고, 내용은 fetchWorkHtml로 따로 받는다.
export interface Work {
  id: number
  work_no: number // 등록 순서대로 한 번 부여하는 고정 전시 번호
  title: string
  artist_name: string
  genre_id: number
  description: string
  work_type: WorkType
  link_url: string
  is_ai: boolean
  thumb_path: string | null
  created_at: string
  updated_at: string
}

// 업로드 화면에서 보는 작품. 학생이 상태를 확인할 수 있도록 status가 있다.
export interface UploadWork extends Work {
  status: WorkStatus
}

// 등록·수정 입력. 수정에서 html, thumb를 보내지 않으면(undefined) 기존 값을 유지한다.
export interface WorkInput {
  artist_name: string
  genre_id: number
  title: string
  description: string
  work_type: WorkType
  link_url: string
  html?: string
  is_ai: boolean
  thumb?: string | null
}

export type WriteResult = { ok: true } | { ok: false; reason: 'session' | 'invalid' | 'error' }
export type LoginResult = 'ok' | 'invalid' | 'error'
export type BebrasLookupResult =
  | { ok: true; id: string; password: string }
  | { ok: false; reason: 'notfound' | 'limit' | 'invalid' | 'session' | 'error' }

interface PublicData {
  works: Work[]
  genres: Genre[]
}

interface UploadSession {
  token: string
  expires_at: string
}

interface SampleRecord extends UploadWork {
  html_content?: string
}

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL ?? ''
// 웹 앱 주소가 없는 개발 환경에서는 메모리 안의 샘플로 모든 화면을 확인한다. 새로고침하면 처음 상태로 돌아간다.
const SAMPLE_MODE = !APPS_SCRIPT_URL && import.meta.env.DEV

const UPLOAD_SESSION_KEY = 'upload-session'
const BEBRAS_SESSION_KEY = 'bebras-session'
const BEBRAS_SESSION_MILLISECONDS = 30 * 60 * 1000
const SAMPLE_ACCESS_CODE = 'sample'
const SESSION_MILLISECONDS = 3 * 60 * 60 * 1000
const HTTP_URL_PATTERN = /^https?:\/\//i

let publicDataRequest: Promise<PublicData> | null = null
let sampleStore: SampleRecord[] | null = null

// --- 응답 검사 ---

function toWork(value: unknown): Work | null {
  if (typeof value !== 'object' || value === null) return null
  const work = value as Record<string, unknown>
  const workType: WorkType = work.work_type === 'html' ? 'html' : 'link'
  const linkUrl = typeof work.link_url === 'string' ? work.link_url : ''
  const valid =
    typeof work.id === 'number' &&
    typeof work.work_no === 'number' &&
    typeof work.title === 'string' &&
    typeof work.artist_name === 'string' &&
    typeof work.genre_id === 'number' &&
    typeof work.description === 'string' &&
    (workType === 'html' || HTTP_URL_PATTERN.test(linkUrl)) &&
    typeof work.is_ai === 'boolean' &&
    (typeof work.thumb_path === 'string' || work.thumb_path === null) &&
    typeof work.created_at === 'string' &&
    typeof work.updated_at === 'string'
  if (!valid) return null
  return {
    id: work.id as number,
    work_no: work.work_no as number,
    title: work.title as string,
    artist_name: work.artist_name as string,
    genre_id: work.genre_id as number,
    description: work.description as string,
    work_type: workType,
    link_url: workType === 'html' ? '' : linkUrl,
    is_ai: work.is_ai as boolean,
    thumb_path: work.thumb_path as string | null,
    created_at: work.created_at as string,
    updated_at: work.updated_at as string,
  }
}

function toUploadWork(value: unknown): UploadWork | null {
  const work = toWork(value)
  if (!work) return null
  const status = (value as Record<string, unknown>).status
  if (status !== '대기' && status !== '공개' && status !== '숨김' && status !== '삭제요청') return null
  return { ...work, status }
}

function toGenre(value: unknown): Genre | null {
  if (typeof value !== 'object' || value === null) return null
  const genre = value as Record<string, unknown>
  if (typeof genre.id !== 'number' || typeof genre.code !== 'string' || typeof genre.label !== 'string') return null
  return { id: genre.id, code: genre.code, label: genre.label, sort_order: typeof genre.sort_order === 'number' ? genre.sort_order : 0 }
}

function compact<T>(items: (T | null)[]): T[] {
  return items.filter((item): item is T => item !== null)
}

function byNewest(a: Work, b: Work): number {
  return b.created_at.localeCompare(a.created_at)
}

// --- 웹 앱 호출 ---

async function getAction(params: Record<string, string>): Promise<Record<string, unknown>> {
  const response = await fetch(`${APPS_SCRIPT_URL}?${new URLSearchParams(params).toString()}`)
  return readResponse(response)
}

// 쓰기 요청은 사전 요청(CORS preflight)이 생기지 않도록 text/plain 본문으로 보낸다.
async function postAction(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  })
  return readResponse(response)
}

async function readResponse(response: Response): Promise<Record<string, unknown>> {
  if (!response.ok) {
    throw new Error('요청을 처리하지 못했습니다.')
  }
  const data: unknown = await response.json()
  if (typeof data !== 'object' || data === null) {
    throw new Error('응답 형식이 올바르지 않습니다.')
  }
  return data as Record<string, unknown>
}

async function getSampleStore(): Promise<SampleRecord[]> {
  if (!sampleStore) {
    const { sampleWorks } = await import('../data/sample-works')
    sampleStore = sampleWorks.map((work) => ({ ...work }))
  }
  return sampleStore
}

// --- 공개 전시 ---

async function loadPublicData(): Promise<PublicData> {
  if (SAMPLE_MODE) {
    const store = await getSampleStore()
    return { works: store.filter((work) => work.status === '공개').sort(byNewest), genres: GENRES }
  }
  if (!APPS_SCRIPT_URL) {
    throw new Error('웹 앱 주소가 설정되지 않았습니다.')
  }
  const data = await getAction({ action: 'public' })
  if (data.ok !== true || !Array.isArray(data.works)) {
    throw new Error('공개 목록 형식이 올바르지 않습니다.')
  }
  const genres = Array.isArray(data.genres) ? compact(data.genres.map(toGenre)) : []
  return { works: compact(data.works.map(toWork)), genres: genres.length > 0 ? genres : GENRES }
}

function fetchPublicData(): Promise<PublicData> {
  if (!publicDataRequest) {
    publicDataRequest = loadPublicData().catch((error: unknown) => {
      publicDataRequest = null
      throw error
    })
  }
  return publicDataRequest
}

// 공개 작품을 최신순으로 가져온다. 한 번 불러온 목록은 페이지를 새로 열거나 작품을 저장할 때까지 다시 쓴다.
export async function fetchPublicWorks(): Promise<Work[]> {
  return (await fetchPublicData()).works
}

// 공개 작품 하나를 가져온다. 공개 상태가 아니거나 없으면 null을 돌려준다.
export async function fetchPublicWork(id: number): Promise<Work | null> {
  const works = await fetchPublicWorks()
  return works.find((work) => work.id === id) ?? null
}

// 시트의 장르 목록. 받지 못하면 기본 장르를 쓴다.
export async function fetchGenres(): Promise<Genre[]> {
  try {
    return (await fetchPublicData()).genres
  } catch {
    return GENRES
  }
}

// 공개된 HTML 작품의 내용을 가져온다. 없거나 공개 상태가 아니면 null.
export async function fetchWorkHtml(id: number): Promise<string | null> {
  if (SAMPLE_MODE) {
    const work = (await getSampleStore()).find((item) => item.id === id && item.status === '공개')
    return work?.work_type === 'html' ? work.html_content ?? null : null
  }
  const data = await getAction({ action: 'html', id: String(id) })
  return data.ok === true && typeof data.html === 'string' ? data.html : null
}

// --- 학생 업로드 ---

function saveSession(key: string, session: UploadSession): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(session))
  } catch {
    // 저장소를 쓸 수 없는 브라우저에서는 이 화면을 벗어나면 다시 입장해야 한다.
  }
}

function readSession(key: string): UploadSession | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const session: unknown = JSON.parse(raw)
    if (typeof session !== 'object' || session === null) return null
    const { token, expires_at } = session as Record<string, unknown>
    if (typeof token !== 'string' || typeof expires_at !== 'string') return null
    if (Date.parse(expires_at) <= Date.now()) {
      clearSession(key)
      return null
    }
    return { token, expires_at }
  } catch {
    return null
  }
}

function clearSession(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // 지울 저장소가 없으면 할 일도 없다.
  }
}

function saveUploadSession(session: UploadSession): void {
  saveSession(UPLOAD_SESSION_KEY, session)
}

export function getUploadSession(): UploadSession | null {
  return readSession(UPLOAD_SESSION_KEY)
}

export function clearUploadSession(): void {
  clearSession(UPLOAD_SESSION_KEY)
}

// 접속 코드를 확인하고 세션을 저장한다. 샘플 모드에서는 'sample'만 통과한다.
export async function login(code: string): Promise<LoginResult> {
  try {
    if (SAMPLE_MODE) {
      if (code.trim() !== SAMPLE_ACCESS_CODE) return 'invalid'
      saveUploadSession({ token: 'sample', expires_at: new Date(Date.now() + SESSION_MILLISECONDS).toISOString() })
      return 'ok'
    }
    if (!APPS_SCRIPT_URL) return 'error'
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
  if (SAMPLE_MODE) return true
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

function toWriteResult(data: Record<string, unknown>): WriteResult {
  if (data.ok === true) return { ok: true }
  if (data.error === 'session') {
    clearUploadSession()
    return { ok: false, reason: 'session' }
  }
  return { ok: false, reason: data.error === 'invalid' ? 'invalid' : 'error' }
}

async function writeAction(body: Record<string, unknown>): Promise<WriteResult> {
  const session = getUploadSession()
  if (!session) return { ok: false, reason: 'session' }
  try {
    const result = toWriteResult(await postAction({ ...body, token: session.token }))
    if (result.ok) publicDataRequest = null
    return result
  } catch {
    return { ok: false, reason: 'error' }
  }
}

// 업로드 화면의 전체 작품 목록 (누가 등록했는지와 상관없이 전체). 세션이 끝났으면 null.
export async function fetchUploadWorks(): Promise<UploadWork[] | null> {
  if (SAMPLE_MODE) {
    return (await getSampleStore()).map((work) => ({ ...work })).sort(byNewest)
  }
  const session = getUploadSession()
  if (!session) return null
  const data = await postAction({ action: 'list', token: session.token })
  if (data.ok !== true) {
    if (data.error === 'session') {
      clearUploadSession()
      return null
    }
    throw new Error('목록을 불러오지 못했습니다.')
  }
  return Array.isArray(data.works) ? compact(data.works.map(toUploadWork)).sort(byNewest) : []
}

export async function createWork(input: WorkInput, consentVersion: string): Promise<WriteResult> {
  if (SAMPLE_MODE) {
    const store = await getSampleStore()
    const now = new Date().toISOString()
    const id = Math.max(0, ...store.map((work) => work.id)) + 1
    const workNo = Math.max(0, ...store.map((work) => work.work_no)) + 1
    store.push({
      id,
      work_no: workNo,
      title: input.title,
      artist_name: input.artist_name,
      genre_id: input.genre_id,
      description: input.description,
      work_type: input.work_type,
      link_url: input.work_type === 'link' ? input.link_url : '',
      html_content: input.work_type === 'html' ? input.html : undefined,
      is_ai: input.is_ai,
      thumb_path: input.thumb ?? null,
      status: '공개',
      created_at: now,
      updated_at: now,
    })
    publicDataRequest = null
    return { ok: true }
  }
  return writeAction({ action: 'create', work: input, consent_version: consentVersion })
}

export async function updateWork(id: number, input: WorkInput): Promise<WriteResult> {
  if (SAMPLE_MODE) {
    const work = (await getSampleStore()).find((item) => item.id === id)
    if (!work) return { ok: false, reason: 'invalid' }
    Object.assign(work, {
      title: input.title,
      artist_name: input.artist_name,
      genre_id: input.genre_id,
      description: input.description,
      work_type: input.work_type,
      link_url: input.work_type === 'link' ? input.link_url : '',
      is_ai: input.is_ai,
      updated_at: new Date().toISOString(),
    })
    if (input.html !== undefined) work.html_content = input.html
    if (input.thumb !== undefined) work.thumb_path = input.thumb
    publicDataRequest = null
    return { ok: true }
  }
  return writeAction({ action: 'update', id, work: input })
}

export async function requestDelete(id: number): Promise<WriteResult> {
  if (SAMPLE_MODE) {
    const work = (await getSampleStore()).find((item) => item.id === id)
    if (!work) return { ok: false, reason: 'invalid' }
    work.status = '삭제요청'
    work.updated_at = new Date().toISOString()
    publicDataRequest = null
    return { ok: true }
  }
  return writeAction({ action: 'requestDelete', id })
}

// --- 비버챌린지 아이디 조회 ---

export function hasBebrasSession(): boolean {
  return readSession(BEBRAS_SESSION_KEY) !== null
}

export function clearBebrasSession(): void {
  clearSession(BEBRAS_SESSION_KEY)
}

// 조회 코드를 확인하고 세션을 저장한다. 샘플 모드에서는 'sample'만 통과한다.
export async function enterBebras(code: string): Promise<LoginResult> {
  try {
    if (SAMPLE_MODE) {
      if (code.trim() !== SAMPLE_ACCESS_CODE) return 'invalid'
      saveSession(BEBRAS_SESSION_KEY, { token: 'sample', expires_at: new Date(Date.now() + BEBRAS_SESSION_MILLISECONDS).toISOString() })
      return 'ok'
    }
    if (!APPS_SCRIPT_URL) return 'error'
    const data = await postAction({ action: 'bebrasLogin', code })
    if (data.ok === true && typeof data.token === 'string' && typeof data.expires_at === 'string') {
      saveSession(BEBRAS_SESSION_KEY, { token: data.token, expires_at: data.expires_at })
      return 'ok'
    }
    return data.error === 'invalid' ? 'invalid' : 'error'
  } catch {
    return 'error'
  }
}

// 학번 하나의 비버챌린지 아이디와 비밀번호. 샘플 모드에서는 12345만 찾을 수 있다.
export async function lookupBebras(studentNo: string): Promise<BebrasLookupResult> {
  if (SAMPLE_MODE) {
    return studentNo === '12345'
      ? { ok: true, id: 'sample_bebras', password: 'sample-pw' }
      : { ok: false, reason: 'notfound' }
  }
  const session = readSession(BEBRAS_SESSION_KEY)
  if (!session) return { ok: false, reason: 'session' }
  try {
    const data = await postAction({ action: 'bebrasLookup', token: session.token, student_no: studentNo })
    if (data.ok === true && typeof data.id === 'string' && typeof data.password === 'string') {
      return { ok: true, id: data.id, password: data.password }
    }
    if (data.error === 'session') {
      clearSession(BEBRAS_SESSION_KEY)
      return { ok: false, reason: 'session' }
    }
    if (data.error === 'notfound' || data.error === 'limit' || data.error === 'invalid') {
      return { ok: false, reason: data.error }
    }
    return { ok: false, reason: 'error' }
  } catch {
    return { ok: false, reason: 'error' }
  }
}
