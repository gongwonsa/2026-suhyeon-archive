import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { UploadWorkList } from '../components/UploadWorkList'
import { WorkForm } from '../components/WorkForm'
import {
  clearUploadSession,
  createWork,
  fetchGenres,
  fetchUploadWorks,
  getUploadSession,
  login,
  requestDelete,
  updateWork,
  verifyUploadSession,
} from '../lib/api'
import type { UploadWork, WorkInput, WriteResult } from '../lib/api'
import { CONSENT_VERSION, GENRES } from '../lib/constants'
import type { Genre } from '../lib/constants'

type View = 'checking' | 'access' | 'entered'

const SESSION_ENDED = '입장 시간이 끝났습니다. 다시 입장해 주세요.'

export function UploadPage() {
  const [view, setView] = useState<View>(() => (getUploadSession() ? 'checking' : 'access'))
  const [notice, setNotice] = useState('')

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

  const endSession = useCallback((message: string) => {
    clearUploadSession()
    setNotice(message)
    setView('access')
  }, [])

  if (view === 'checking') return null
  if (view === 'access') {
    return (
      <AccessForm
        notice={notice}
        onEnter={() => {
          setNotice('')
          setView('entered')
        }}
      />
    )
  }
  return <UploadWorkspace onExit={() => endSession('')} onSessionEnded={() => endSession(SESSION_ENDED)} />
}

function UploadWorkspace({ onExit, onSessionEnded }: { onExit: () => void; onSessionEnded: () => void }) {
  const [genres, setGenres] = useState<Genre[]>(GENRES)
  const [works, setWorks] = useState<UploadWork[] | null>(null)
  const [listError, setListError] = useState('')
  const [editing, setEditing] = useState<UploadWork | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [notice, setNotice] = useState('')

  const loadWorks = useCallback(async () => {
    try {
      const list = await fetchUploadWorks()
      if (list === null) {
        onSessionEnded()
        return
      }
      setWorks(list)
      setListError('')
    } catch {
      setListError('잠시 후 다시 시도해 주세요.')
    }
  }, [onSessionEnded])

  useEffect(() => {
    fetchGenres().then(setGenres)
    loadWorks()
  }, [loadWorks])

  async function afterWrite(result: WriteResult): Promise<WriteResult> {
    if (!result.ok && result.reason === 'session') {
      onSessionEnded()
      return result
    }
    if (result.ok) await loadWorks()
    return result
  }

  async function handleCreate(input: WorkInput) {
    return afterWrite(await createWork(input, CONSENT_VERSION))
  }

  async function handleUpdate(input: WorkInput) {
    if (!editing) return { ok: false, reason: 'error' } as const
    const result = await afterWrite(await updateWork(editing.id, input))
    if (result.ok) {
      setNotice(`No. ${String(editing.work_no).padStart(3, '0')} 작품을 저장했습니다.`)
      setEditing(null)
    }
    return result
  }

  async function handleRequestDelete(work: UploadWork) {
    const confirmed = window.confirm(
      `"${work.title}" 작품의 삭제를 요청할까요?\n요청하면 사이트에서 바로 숨겨지고, 되돌리려면 선생님께 말씀드려야 합니다.`,
    )
    if (!confirmed) return
    const result = await afterWrite(await requestDelete(work.id))
    setNotice(result.ok ? `"${work.title}" 작품의 삭제를 요청했습니다.` : result.reason === 'session' ? '' : '잠시 후 다시 시도해 주세요.')
  }

  return (
    <div className="upload">
      <div className="upload-heading">
        <h1 className="page-title">작품 업로드</h1>
        <button type="button" className="text-button" onClick={onExit}>
          나가기
        </button>
      </div>

      {notice && (
        <p className="form-success" role="status">
          {notice}
        </p>
      )}

      <section className="upload-section">
        {editing ? (
          <>
            <h2 className="upload-section-title">
              작품 수정 <span className="work-number">No. {String(editing.work_no).padStart(3, '0')}</span>
            </h2>
            <WorkForm
              key={`edit-${editing.id}`}
              mode="edit"
              genres={genres}
              initial={editing}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(null)}
            />
          </>
        ) : (
          <>
            <h2 className="upload-section-title">작품 등록</h2>
            <WorkForm key={`create-${formKey}`} mode="create" genres={genres} onSubmit={handleCreate} />
          </>
        )}
      </section>

      <section className="upload-section">
        <h2 className="upload-section-title">등록된 작품</h2>
        {listError && <p className="empty-text">{listError}</p>}
        {works && (
          <UploadWorkList
            works={works}
            genres={genres}
            onEdit={(work) => {
              setNotice('')
              setEditing(work)
              setFormKey((key) => key + 1)
              window.scrollTo({ top: 0 })
            }}
            onRequestDelete={handleRequestDelete}
          />
        )}
      </section>
    </div>
  )
}

function AccessForm({ notice, onEnter }: { notice: string; onEnter: () => void }) {
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
      {notice && <p className="form-warning">{notice}</p>}
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
