import { FEEDBACK_BUTTON_LABEL, FEEDBACK_EVENT, FEEDBACK_FORM_URL } from '../lib/constants'

interface FeedbackLinkProps {
  className: string
}

// 후기 구글 폼으로 가는 버튼. 폼 주소를 넣기 전에는 같은 모양이지만 누를 수 없다.
export function FeedbackLink({ className }: FeedbackLinkProps) {
  if (!FEEDBACK_FORM_URL) {
    return (
      <span className={`${className} header-link-pending`} aria-disabled="true" title="후기 폼을 준비하고 있습니다">
        {FEEDBACK_BUTTON_LABEL}
      </span>
    )
  }
  return (
    <a className={className} href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer">
      {FEEDBACK_BUTTON_LABEL}
    </a>
  )
}

// 전시 첫 화면의 후기 이벤트 안내 상자. 안내 문구를 비우면 상자를 보여 주지 않는다.
export function FeedbackEventBanner() {
  if (!FEEDBACK_EVENT.description) return null
  return (
    <section className="event-banner" aria-labelledby="event-banner-title">
      <div className="event-banner-text">
        <h2 id="event-banner-title" className="event-banner-title">
          {FEEDBACK_EVENT.title}
        </h2>
        <p>{FEEDBACK_EVENT.description}</p>
        {FEEDBACK_EVENT.period && <p className="event-banner-period">기간: {FEEDBACK_EVENT.period}</p>}
      </div>
      <FeedbackLink className="header-link header-link-primary event-banner-button" />
    </section>
  )
}
