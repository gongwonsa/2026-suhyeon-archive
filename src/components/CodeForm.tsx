import { useState } from 'react'
import type { FormEvent } from 'react'
import type { LoginResult } from '../lib/api'

interface CodeFormProps {
  title: string
  help: string
  label: string
  notice?: string
  onSubmitCode: (code: string) => Promise<LoginResult>
  onEnter: () => void
}

// 코드를 입력해 입장하는 공용 화면 (작품 업로드, 비버챌린지 아이디 조회). 오류 문구는 하나로 통일한다.
export function CodeForm({ title, help, label, notice, onSubmitCode, onEnter }: CodeFormProps) {
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || !code.trim()) return
    setPending(true)
    setError('')
    const result = await onSubmitCode(code)
    setPending(false)
    if (result === 'ok') {
      onEnter()
      return
    }
    setError(result === 'invalid' ? '코드가 올바르지 않습니다.' : '잠시 후 다시 시도해 주세요.')
  }

  return (
    <form className="upload-access" onSubmit={handleSubmit}>
      <h1 className="page-title">{title}</h1>
      <p className="form-help">{help}</p>
      {notice && <p className="form-warning">{notice}</p>}
      <label className="form-label" htmlFor="access-code">
        {label}
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
