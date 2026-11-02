import { Link, useMatch } from 'react-router-dom'
import { FEEDBACK_FORM_URL, INTRO_TEXT, SITE_TITLE } from '../lib/constants'

export function Header() {
  const isWorksPage = useMatch('/works') !== null
  const TitleTag = isWorksPage ? 'h1' : 'p'

  return (
    <header className="header">
      <div className="page-width">
        <div className="header-row">
          <TitleTag className="page-title header-title">
            <Link to="/works">{SITE_TITLE}</Link>
          </TitleTag>
          {FEEDBACK_FORM_URL ? (
            <a className="header-link" href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer">
              후기 작성 ↗
            </a>
          ) : (
            <span className="header-link header-link-disabled">후기 작성 ↗</span>
          )}
        </div>
        {isWorksPage && <p className="header-intro">{INTRO_TEXT}</p>}
      </div>
    </header>
  )
}
