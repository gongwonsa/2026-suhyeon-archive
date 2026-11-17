import { useState } from 'react'
import { Link, useMatch } from 'react-router-dom'
import { INTRO_TEXT, SITE_TITLE } from '../lib/constants'
import { FeedbackLink } from './FeedbackEvent'

const LOGO_URL = `${import.meta.env.BASE_URL}logo.png`

// public/logo.png가 있으면 보여 준다. 없으면 배포 사이트에서는 자리를 비우고, 개발 화면에서만 자리 표시를 보여 준다.
function Logo() {
  const [missing, setMissing] = useState(false)
  if (missing) {
    return import.meta.env.DEV ? (
      <span className="header-logo-placeholder" aria-hidden="true">
        로고
      </span>
    ) : null
  }
  return <img className="header-logo" src={LOGO_URL} alt="전시 로고" onError={() => setMissing(true)} />
}

export function Header() {
  const isWorksPage = useMatch('/works') !== null
  const TitleTag = isWorksPage ? 'h1' : 'p'

  return (
    <header className="header">
      <div className="page-width">
        <div className="header-row">
          <div className="header-brand">
            <Logo />
            <TitleTag className="page-title header-title">
              <Link to="/works">{SITE_TITLE}</Link>
            </TitleTag>
          </div>
          <nav className="header-links" aria-label="바로가기">
            <FeedbackLink className="header-link header-link-primary" />
            <Link className="header-link header-link-secondary" to="/upload">
              작품 업로드
            </Link>
            <Link className="header-link header-link-outline" to="/bebras">
              비버챌린지 아이디 조회
            </Link>
          </nav>
        </div>
        {isWorksPage && <p className="header-intro">{INTRO_TEXT}</p>}
      </div>
    </header>
  )
}
