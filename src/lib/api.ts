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
