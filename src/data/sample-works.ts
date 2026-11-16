import type { UploadWork } from '../lib/api'

// 화면 확인용 샘플. 실제 학생 데이터가 아니다. 웹 앱 주소가 없는 개발 환경에서만 쓴다.

export type SampleWork = UploadWork & { html_content?: string }

function sampleThumb(width: number, height: number, fill: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${fill}"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// 공이 튀는 샘플 HTML 작품 (파일 하나로 된 작품 예시)
const BOUNCE_HTML = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>공 튀기기</title>
<style>html,body{margin:0;height:100%;background:#F6F3EE}canvas{display:block;width:100%;height:100%}</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
const c = document.getElementById('c'), x = c.getContext('2d')
const balls = Array.from({ length: 12 }, (_, i) => ({ px: 40 + i * 30, py: 60, vx: 2 + (i % 4), vy: 1 + (i % 3), r: 10 + (i % 5) * 3 }))
function size() { c.width = innerWidth; c.height = innerHeight }
addEventListener('resize', size); size()
c.addEventListener('pointerdown', (e) => balls.push({ px: e.clientX, py: e.clientY, vx: 3, vy: -4, r: 14 }))
function tick() {
  x.fillStyle = '#F6F3EE'; x.fillRect(0, 0, c.width, c.height)
  for (const b of balls) {
    b.px += b.vx; b.py += b.vy
    if (b.px < b.r || b.px > c.width - b.r) b.vx *= -1
    if (b.py < b.r || b.py > c.height - b.r) b.vy *= -1
    x.beginPath(); x.arc(b.px, b.py, b.r, 0, Math.PI * 2); x.fillStyle = '#3D5A4C'; x.fill()
  }
  x.fillStyle = '#1E1B1C'; x.font = '16px sans-serif'; x.fillText('화면을 누르면 공이 늘어납니다', 16, 28)
  requestAnimationFrame(tick)
}
tick()
</script>
</body>
</html>`

// localStorage를 쓰는 샘플 HTML 작품 (격리 실행 중에도 오류 없이 동작하는지 확인용)
const COUNTER_HTML = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>누르기 게임</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F6F3EE;font-family:sans-serif}button{font-size:24px;padding:16px 32px}</style>
</head>
<body>
<div style="text-align:center">
<p id="best"></p>
<button id="b">눌러 보세요: 0</button>
</div>
<script>
let n = 0
const best = Number(localStorage.getItem('best') || 0)
document.getElementById('best').textContent = '최고 기록: ' + best
document.getElementById('b').addEventListener('click', (e) => {
  n += 1
  e.target.textContent = '눌러 보세요: ' + n
  if (n > Number(localStorage.getItem('best') || 0)) localStorage.setItem('best', String(n))
})
</script>
</body>
</html>`

function sampleWork(number: number, genreId: number, thumbPath: string | null, isAi = false, html?: string): SampleWork {
  const padded = String(number).padStart(2, '0')
  const date = `2026-10-${padded}T09:00:00+09:00`
  return {
    id: number,
    work_no: number,
    title: `샘플 작품 ${padded}`,
    artist_name: `샘플 이름 ${padded}`,
    genre_id: genreId,
    description: html ? '화면 확인용 샘플 HTML 작품입니다. 작품 보기를 누르면 바로 실행됩니다.' : '화면 확인용 샘플 설명입니다.',
    work_type: html ? 'html' : 'link',
    link_url: html ? '' : `https://example.com/sample-${padded}`,
    html_content: html,
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
  sampleWork(3, 3, sampleThumb(600, 800, '#3D5A4C'), false, BOUNCE_HTML),
  sampleWork(4, 4, sampleThumb(800, 800, '#2F4A6E'), true),
  sampleWork(5, 5, null),
  sampleWork(6, 1, sampleThumb(800, 450, '#F3E6EA')),
  sampleWork(7, 2, sampleThumb(600, 900, '#9A4422'), false, COUNTER_HTML),
  sampleWork(8, 3, null),
  sampleWork(9, 4, sampleThumb(800, 600, '#E4EAF2'), true),
  sampleWork(10, 5, sampleThumb(700, 900, '#6E6567')),
  sampleWork(11, 6, null),
  sampleWork(12, 6, sampleThumb(900, 600, '#F6E9E2')),
]
