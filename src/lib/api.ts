import { sampleWorks } from '../data/sample-works'

export type WorkStatus = '대기' | '공개' | '숨김' | '삭제요청'

export interface Work {
  id: number
  title: string
  artist_name: string
  genre_id: number
  description: string
  link_url: string
  is_ai: boolean
  thumb_path: string | null
  status: WorkStatus
  created_at: string
  updated_at: string
}

// 공개 작품을 최신순으로 가져온다. 지금은 샘플이며 나중에 이 함수 안만 Supabase로 바꾼다.
export async function fetchPublicWorks(): Promise<Work[]> {
  return sampleWorks
    .filter((work) => work.status === '공개')
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}
