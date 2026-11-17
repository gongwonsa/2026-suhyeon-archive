export const SITE_TITLE = '2026 수현중 소프트웨어의 날 온라인 작품 전시회'

export const INTRO_TEXT =
  '수현중 학생들의 정보 수업 및 동아리 작품 온라인 전시페이지입니다. 다양한 작품을 즐기고 후기를 남겨 주세요.'

// 후기 작성 구글 폼 주소. 폼을 만든 뒤 여기에 넣는다. 비어 있으면 후기 버튼이 눌리지 않는다.
export const FEEDBACK_FORM_URL = ''

// 후기 버튼 문구 (헤더와 이벤트 안내 상자에 함께 쓰인다)
export const FEEDBACK_BUTTON_LABEL = '후기 이벤트 참여 ↗'

// 전시 첫 화면의 후기 이벤트 안내. description을 ''로 비우면 안내 상자가 사라지고, period를 비우면 기간 줄만 사라진다.
export const FEEDBACK_EVENT = {
  title: '후기 이벤트',
  description: '전시를 보고 후기를 남겨 주세요. 참여한 분 중 추첨을 통해 선물을 드립니다.',
  period: '',
}

export const TEACHER_CONTACT_TEXT = '게시 중단이나 삭제를 원하면 지도교사에게 직접 연락해 주세요.'

export const BEBRAS_SITE_URL = 'https://www.bebras.kr/'

// 동의 문구를 바꾸면 버전도 바꾼다. 버전은 consents 탭에 함께 저장된다.
export const CONSENT_VERSION = '2026-11-v1'

export const HTML_MAX_BYTES = 5 * 1024 * 1024
export const THUMB_MAX_WIDTH = 480

export const SCHOOL_NAME = '수현중학교'

export const SCHOOL_ADDRESS = '경기도 화성시 봉담읍 상리3길 136'

export const PRIVACY_OFFICER = '수현중학교 정보교사'

export const CONTACT_EMAIL = 'parksa1236@gmail.com'

export const PRIVACY_EFFECTIVE_DATE = '2026년 11월 1일'


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
  { id: 6, code: 'study', label: '학습 지원', sort_order: 5 },
  { id: 5, code: 'etc', label: '기타', sort_order: 6 },
]
