import type { Work, WorkStatus } from '../lib/api'

// 화면 확인용 샘플. 실제 학생 데이터가 아니다. 웹 앱 주소가 없는 개발 환경에서만 쓴다.

export type SampleWork = Work & { status: WorkStatus }

function sampleThumb(width: number, height: number, fill: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${fill}"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function sampleWork(number: number, genreId: number, thumbPath: string | null, isAi = false): SampleWork {
  const padded = String(number).padStart(2, '0')
  const date = `2026-10-${padded}T09:00:00+09:00`
  return {
    id: number,
    work_no: number,
    title: `샘플 작품 ${padded}`,
    artist_name: `샘플 이름 ${padded}`,
    genre_id: genreId,
    description: '화면 확인용 샘플 설명입니다.',
    link_url: `https://example.com/sample-${padded}`,
    is_ai: isAi,
    thumb_path: thumbPath,
    status: '공개',
    created_at: date,
    updated_at: date,
  }
}

export const sampleWorks: SampleWork[] = [
  sampleWork(1, 1, sampleThumb(800, 600, '#8A1C36')),
  sampleWork(2, 2, null),
  sampleWork(3, 3, sampleThumb(600, 800, '#3D5A4C')),
  sampleWork(4, 4, sampleThumb(800, 800, '#2F4A6E'), true),
  sampleWork(5, 5, null),
  sampleWork(6, 1, sampleThumb(800, 450, '#F3E6EA')),
  sampleWork(7, 2, sampleThumb(600, 900, '#9A4422')),
  sampleWork(8, 3, null),
  sampleWork(9, 4, sampleThumb(800, 600, '#E4EAF2'), true),
  sampleWork(10, 5, sampleThumb(700, 900, '#6E6567')),
  sampleWork(11, 1, null),
  sampleWork(12, 2, sampleThumb(900, 600, '#F6E9E2')),
]
