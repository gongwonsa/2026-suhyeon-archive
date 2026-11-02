import { Link } from 'react-router-dom'
import { RETENTION_TEXT, TEACHER_CONTACT_TEXT } from '../lib/constants'

export function Footer() {
  return (
    <footer className="footer">
      <div className="page-width">
        <p>
          <Link to="/privacy">개인정보 처리방침</Link>
        </p>
        <p>
          이 사이트의 작품과 개인정보는 {RETENTION_TEXT} 보관합니다. {TEACHER_CONTACT_TEXT}
        </p>
      </div>
    </footer>
  )
}
