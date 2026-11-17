import { useState } from 'react'
import type { FormEvent } from 'react'
import { CodeForm } from '../components/CodeForm'
import { clearBebrasSession, enterBebras, hasBebrasSession, lookupBebras } from '../lib/api'

const TITLE = '비버챌린지 아이디 조회'
const STUDENT_NO_PATTERN = /^\d{5}$/

const ERROR_MESSAGES = {
  notfound: '해당 학번을 찾을 수 없습니다. 선생님께 문의하세요.',
  limit: '조회 횟수를 넘었습니다. 나가기를 누른 뒤 다시 코드를 입력해 주세요.',
  invalid: '학번 5자리 숫자를 입력하세요.',
  error: '잠시 후 다시 시도해 주세요.',
}

export function BebrasPage() {
  const [entered, setEntered] = useState(() => hasBebrasSession())
  const [notice, setNotice] = useState('')

  if (!entered) {
    return (
      <CodeForm
        title={TITLE}
        help="선생님께 안내받은 코드를 입력하세요."
        label="코드"
        notice={notice}
        onSubmitCode={enterBebras}
        onEnter={() => {
          setNotice('')
          setEntered(true)
        }}
      />
    )
  }

  return (
    <BebrasLookup
      onExit={(message) => {
        clearBebrasSession()
        setNotice(message)
        setEntered(false)
      }}
    />
  )
}

function BebrasLookup({ onExit }: { onExit: (message: string) => void }) {
  const [studentNo, setStudentNo] = useState('')
  const [pending, setPending] = useState(false)
  const [account, setAccount] = useState<{ id: string; password: string } | null>(null)
  const [error, setError] = useState('')
  const valid = STUDENT_NO_PATTERN.test(studentNo)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || !valid) return
    setPending(true)
    setError('')
    setAccount(null)
    const result = await lookupBebras(studentNo)
    setPending(false)
    if (result.ok) {
      setAccount({ id: result.id, password: result.password })
      return
    }
    if (result.reason === 'session') {
      onExit('입장 시간이 끝났습니다. 다시 코드를 입력해 주세요.')
      return
    }
    setError(ERROR_MESSAGES[result.reason])
  }

  return (
    <form className="bebras" onSubmit={handleSubmit}>
      <div className="upload-heading">
        <h1 className="page-title">{TITLE}</h1>
        <button type="button" className="text-button" onClick={() => onExit('')}>
          나가기
        </button>
      </div>
      <p className="form-help">학번 5자리를 입력하고 조회를 누르세요.</p>
      <label className="form-label" htmlFor="student-no">
        학번
      </label>
      <input
        id="student-no"
        className="text-input"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={5}
        placeholder="예: 20101"
        value={studentNo}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'bebras-error' : undefined}
        onChange={(event) => {
          setStudentNo(event.target.value.replace(/\D/g, '').slice(0, 5))
          setAccount(null)
          setError('')
        }}
      />
      {error && (
        <p id="bebras-error" className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button type="submit" className="primary-button" disabled={pending || !valid}>
          {pending ? '조회 중' : '조회'}
        </button>
      </div>

      <div aria-live="polite">
        {account && (
          <>
            <dl className="bebras-result">
              <dt>아이디</dt>
              <dd>{account.id}</dd>
              <dt>비밀번호</dt>
              <dd>{account.password}</dd>
            </dl>
            <p className="form-help">비밀번호는 다른 사람에게 보여 주지 마세요. 확인이 끝나면 나가기를 누르세요.</p>
          </>
        )}
      </div>
    </form>
  )
}
