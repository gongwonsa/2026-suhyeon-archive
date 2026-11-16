import { RETENTION_TEXT } from '../lib/constants'

interface ConsentBoxProps {
  agreedPrivacy: boolean
  agreedPublic: boolean
  onChange: (next: { agreedPrivacy: boolean; agreedPublic: boolean }) => void
}

export function ConsentBox({ agreedPrivacy, agreedPublic, onChange }: ConsentBoxProps) {
  return (
    <div className="consent-box">
      <details className="consent-details">
        <summary>동의 내용 전문 보기 +</summary>
        <dl className="consent-text">
          <dt>수집 항목</dt>
          <dd>이름(실명 또는 닉네임), 작품 제목, 설명, 작품 링크 또는 HTML 파일, 썸네일</dd>
          <dt>이용 목적</dt>
          <dd>작품 온라인 전시와 관리</dd>
          <dt>보유 기간</dt>
          <dd>{RETENTION_TEXT}</dd>
          <dt>공개 범위</dt>
          <dd>등록한 작품과 이름은 누구나 볼 수 있는 사이트에 바로 공개됩니다.</dd>
          <dt>동의 거부</dt>
          <dd>동의하지 않을 수 있으며, 이 경우 작품을 등록할 수 없습니다.</dd>
        </dl>
      </details>
      <label className="check-row">
        <input
          type="checkbox"
          checked={agreedPrivacy}
          onChange={(event) => onChange({ agreedPrivacy: event.target.checked, agreedPublic })}
        />
        <span>개인정보 수집·이용에 동의합니다. (필수)</span>
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={agreedPublic}
          onChange={(event) => onChange({ agreedPrivacy, agreedPublic: event.target.checked })}
        />
        <span>작품을 사이트에 공개 전시하는 데 동의합니다. (필수)</span>
      </label>
    </div>
  )
}
