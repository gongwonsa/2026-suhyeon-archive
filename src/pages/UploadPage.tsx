import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { clearUploadSession, getUploadSession, login, verifyUploadSession } from '../lib/api'

type View = 'checking' | 'access' | 'entered'

export function UploadPage() {
  const [view, setView] = useState<View>(() => (getUploadSession() ? 'checking' : 'access'))

  useEffect(() => {
    if (view !== 'checking') return
    let cancelled = false
    verifyUploadSession().then((valid) => {
      if (!cancelled) setView(valid ? 'entered' : 'access')
    })
    return () => {
      cancelled = true
    }
  }, [view])

  if (view === 'checking') return null
  if (view === 'access') return <AccessForm onEnter={() => setView('entered')} />

  return (
    <div className="upload-entered">
      <div className="upload-heading">
        <h1 className="page-title">작품 업로드</h1>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            clearUploadSession()
            setView('access')
          }}
        >
          나가기
        </button>
      </div>
      <p className="empty-text">입장했습니다. 작품 등록 기능은 준비 중입니다.</p>
    </div>
  )
}

function AccessForm({ onEnter }: { onEnter: () => void }) {
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || !code.trim()) return
    setPending(true)
    setError('')
    const result = await login(code)
    setPending(false)
    if (result === 'ok') {
      onEnter()
      return
    }
    setError(result === 'invalid' ? '코드가 올바르지 않습니다.' : '잠시 후 다시 시도해 주세요.')
  }

  return (
    <form className="upload-access" onSubmit={handleSubmit}>
      <h1 className="page-title">작품 업로드</h1>
      <p className="form-help">수업 시간에 안내받은 접속 코드를 입력하세요.</p>
      <label className="form-label" htmlFor="access-code">
        접속 코드
      </label>
      <input
        id="access-code"
        className="text-input"
        type="text"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        value={code}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'access-error' : undefined}
        onChange={(event) => setCode(event.target.value)}
      />
      {error && (
        <p id="access-error" className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="text-button upload-access-submit" disabled={pending || !code.trim()}>
        {pending ? '확인 중' : '입장'}
      </button>
    </form>
  )
}
