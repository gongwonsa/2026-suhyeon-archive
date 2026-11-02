export const SITE_TITLE = '2026 수현중 소프트웨어의 날 온라인 작품 전시회'

export const INTRO_TEXT =
  '수현중 학생들의 정보 수업 및 동아리 작품 온라인 전시페이지입니다. 다양한 작품을 즐기고 후기를 남겨 주세요.'

// 후기 작성 구글 폼 주소. 폼을 만든 뒤 여기에 넣는다. 비어 있으면 헤더 링크가 비활성으로 표시된다.
export const FEEDBACK_FORM_URL = ''

export const TEACHER_CONTACT_TEXT = '게시 중단이나 삭제를 원하면 지도교사에게 직접 연락해 주세요.'

export const SCHOOL_NAME = '수현중학교'

export const SCHOOL_ADDRESS = '경기도 화성시 봉담읍 상리3길 136'

export const PRIVACY_OFFICER = '수현중학교 정보교사'

export const CONTACT_EMAIL = 'parksa1236@gmail.com'

export const PRIVACY_EFFECTIVE_DATE = '2026년 11월 1일'

// Supabase 프로젝트를 만든 뒤 실제 리전으로 바꾼다. 배포 전에 반드시 채운다.
export const DATA_REGION = '리전 확정 후 기재'

export const RETENTION_TEXT = '전시 운영이 끝날 때까지'

export interface Genre {
  id: number
  code: string // 색 변수가 없는 새 장르는 --genre-etc 색을 쓴다
  label: string
  sort_order: number
}

export const GENRES: Genre[] = [
  { id: 1, code: 'game', label: '게임', sort_order: 1 },
  { id: 2, code: 'anim', label: '애니메이션', sort_order: 2 },
  { id: 3, code: 'sim', label: '시뮬레이션', sort_order: 3 },
  { id: 4, code: 'agent', label: 'AI 에이전트 도구(바이브코딩)', sort_order: 4 },
  { id: 5, code: 'etc', label: '기타', sort_order: 5 },
]
