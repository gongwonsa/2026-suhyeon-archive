import { Link } from 'react-router-dom'
import { RETENTION_DATE, TEACHER_CONTACT_TEXT } from '../lib/constants'

export function Footer() {
  return (
    <footer className="footer">
      <div className="page-width">
        <p>
          <Link to="/privacy">개인정보 처리방침</Link>
        </p>
        <p>{TEACHER_CONTACT_TEXT}</p>
        <p>보유 기간: {RETENTION_DATE}까지</p>
      </div>
    </footer>
  )
}
