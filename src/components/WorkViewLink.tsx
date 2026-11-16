import type { ReactNode } from 'react'
import type { Work } from '../lib/api'

interface WorkViewLinkProps {
  work: Work
  className?: string
  children?: ReactNode
}

// 링크 작품은 외부 주소를, HTML 작품은 사이트 안 실행 페이지를 새 탭으로 연다.
export function WorkViewLink({ work, className, children = '작품 보기 ↗' }: WorkViewLinkProps) {
  const href = work.work_type === 'html' ? `${import.meta.env.BASE_URL}works/${work.id}/play` : work.link_url
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}
