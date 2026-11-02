import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 주소가 저장소 이름 아래에 있으므로 base를 맞춘다.
export default defineConfig({
  base: '/2026-suhyeon-archive/',
  plugins: [react()],
})
