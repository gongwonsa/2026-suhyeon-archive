import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { UploadWork, WorkInput, WorkType, WriteResult } from '../lib/api'
import type { Genre } from '../lib/constants'
import { HTML_MAX_BYTES, THUMB_MAX_WIDTH } from '../lib/constants'
import { ConsentBox } from './ConsentBox'

// 시트 한 칸(5만 자)에 들어가도록 썸네일 문자열 길이를 제한한다.
const THUMB_MAX_CHARS = 45000

interface WorkFormProps {
  mode: 'create' | 'edit'
  genres: Genre[]
  initial?: UploadWork
  onSubmit: (input: WorkInput) => Promise<WriteResult>
  onCancel?: () => void
}

type Errors = Partial<Record<'artist_name' | 'genre_id' | 'title' | 'link_url' | 'html' | 'thumb' | 'form', string>>

function canvasToDataUrl(canvas: HTMLCanvasElement, quality: number): string {
  const webp = canvas.toDataURL('image/webp', quality)
  // WebP로 저장하지 못하는 브라우저(일부 Safari)는 PNG를 돌려주므로 JPEG로 바꾼다.
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', quality)
}

// 원본 비율을 유지한 채 가로 THUMB_MAX_WIDTH 이하로 줄이고, 길이 제한에 맞을 때까지 화질과 크기를 낮춘다.
async function resizeThumb(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  try {
    for (const width of [THUMB_MAX_WIDTH, 360, 240]) {
      const scale = Math.min(1, width / bitmap.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      const context = canvas.getContext('2d')
      if (!context) break
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      for (const quality of [0.8, 0.65, 0.5]) {
        const url = canvasToDataUrl(canvas, quality)
        if (url.length <= THUMB_MAX_CHARS) return url
      }
    }
  } finally {
    bitmap.close()
  }
  throw new Error('썸네일이 너무 큽니다.')
}

export function WorkForm({ mode, genres, initial, onSubmit, onCancel }: WorkFormProps) {
  const [artistName, setArtistName] = useState(initial?.artist_name ?? '')
  const [genreId, setGenreId] = useState<number | null>(initial?.genre_id ?? null)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [workType, setWorkType] = useState<WorkType>(initial?.work_type ?? 'link')
  const [linkUrl, setLinkUrl] = useState(initial?.link_url ?? '')
  const [html, setHtml] = useState<{ name: string; content: string } | null>(null)
  const [isAi, setIsAi] = useState(initial?.is_ai ?? false)
  // undefined는 수정에서 기존 썸네일 유지, null은 썸네일 없음
  const [thumb, setThumb] = useState<string | null | undefined>(mode === 'create' ? null : undefined)
  const [consents, setConsents] = useState({ agreedPrivacy: false, agreedPublic: false })
  const [errors, setErrors] = useState<Errors>({})
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  const consentsDone = mode === 'edit' || (consents.agreedPrivacy && consents.agreedPublic)
  const thumbPreview = thumb === undefined ? initial?.thumb_path ?? null : thumb
  const hasExistingHtml = mode === 'edit' && initial?.work_type === 'html'

  async function handleThumbChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setErrors((current) => ({ ...current, thumb: 'PNG, JPG, WebP 파일만 올릴 수 있습니다.' }))
      return
    }
    try {
      setThumb(await resizeThumb(file))
      setErrors((current) => ({ ...current, thumb: undefined }))
    } catch {
      setErrors((current) => ({ ...current, thumb: '이미지를 읽지 못했습니다. 다른 파일을 골라 주세요.' }))
    }
  }

  async function handleHtmlChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!/\.html?$/i.test(file.name)) {
      setErrors((current) => ({ ...current, html: '.html 파일만 올릴 수 있습니다.' }))
      return
    }
    if (file.size > HTML_MAX_BYTES) {
      setErrors((current) => ({ ...current, html: 'HTML 파일은 5MB까지 올릴 수 있습니다.' }))
      return
    }
    setHtml({ name: file.name, content: await file.text() })
    setErrors((current) => ({ ...current, html: undefined }))
  }

  function validate(): Errors {
    const next: Errors = {}
    if (!artistName.trim()) next.artist_name = '이름을 입력하세요.'
    if (genreId === null) next.genre_id = '장르를 고르세요.'
    if (!title.trim()) next.title = '제목을 입력하세요.'
    if (workType === 'link' && !/^https?:\/\/\S+$/i.test(linkUrl.trim())) {
      next.link_url = 'http:// 또는 https://로 시작하는 주소를 입력하세요.'
    }
    if (workType === 'html' && !html && !hasExistingHtml) next.html = 'HTML 파일을 고르세요.'
    return next
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || !consentsDone) return
    const nextErrors = validate()
    setErrors(nextErrors)
    setMessage('')
    if (Object.keys(nextErrors).length > 0) return

    setPending(true)
    const result = await onSubmit({
      artist_name: artistName.trim(),
      genre_id: genreId as number,
      title: title.trim(),
      description: description.trim(),
      work_type: workType,
      link_url: workType === 'link' ? linkUrl.trim() : '',
      html: workType === 'html' && html ? html.content : undefined,
      is_ai: isAi,
      thumb,
    })
    setPending(false)
    if (result.ok) {
      if (mode === 'create') {
        setTitle('')
        setDescription('')
        setLinkUrl('')
        setHtml(null)
        setIsAi(false)
        setThumb(null)
        setMessage('등록했습니다. 사이트에 바로 공개됩니다.')
      }
      return
    }
    if (result.reason !== 'session') {
      setErrors({ form: result.reason === 'invalid' ? '입력 내용을 다시 확인해 주세요.' : '잠시 후 다시 시도해 주세요.' })
    }
  }

  const clearError = (key: keyof Errors) => setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current))

  const fieldError = (key: keyof Errors) =>
    errors[key] ? (
      <p className="form-error" role="alert">
        {errors[key]}
      </p>
    ) : null

  return (
    <form className="work-form" onSubmit={handleSubmit} noValidate>
      {mode === 'create' && (
        <ConsentBox agreedPrivacy={consents.agreedPrivacy} agreedPublic={consents.agreedPublic} onChange={setConsents} />
      )}

      <label className="form-label" htmlFor="work-artist">
        이름 (실명 또는 닉네임)
      </label>
      <input id="work-artist" className="text-input" maxLength={100} value={artistName} onChange={(e) => {
          setArtistName(e.target.value)
          clearError('artist_name')
        }} />
      {fieldError('artist_name')}

      <fieldset className="form-fieldset">
        <legend className="form-label">장르</legend>
        <div className="choice-list">
          {genres.map((genre) => (
            <label key={genre.id} className="check-row">
              <input type="radio" name="genre" checked={genreId === genre.id} onChange={() => {
                  setGenreId(genre.id)
                  clearError('genre_id')
                }} />
              <span>{genre.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {fieldError('genre_id')}

      <label className="form-label" htmlFor="work-title">
        제목
      </label>
      <input id="work-title" className="text-input" maxLength={200} value={title} onChange={(e) => {
          setTitle(e.target.value)
          clearError('title')
        }} />
      {fieldError('title')}

      <label className="form-label" htmlFor="work-description">
        설명
      </label>
      <textarea
        id="work-description"
        className="text-area"
        rows={4}
        maxLength={5000}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <fieldset className="form-fieldset">
        <legend className="form-label">작품 형태</legend>
        <div className="choice-list">
          <label className="check-row">
            <input type="radio" name="work-type" checked={workType === 'link'} onChange={() => setWorkType('link')} />
            <span>링크로 등록</span>
          </label>
          <label className="check-row">
            <input type="radio" name="work-type" checked={workType === 'html'} onChange={() => setWorkType('html')} />
            <span>HTML 파일 올리기</span>
          </label>
        </div>
      </fieldset>

      {workType === 'link' ? (
        <>
          <label className="form-label" htmlFor="work-link">
            작품 링크 (https://로 시작)
          </label>
          <input
            key="work-link"
            id="work-link"
            className="text-input"
            type="url"
            inputMode="url"
            placeholder="https://"
            value={linkUrl}
            onChange={(e) => {
              setLinkUrl(e.target.value)
              clearError('link_url')
            }}
          />
          {fieldError('link_url')}
        </>
      ) : (
        <>
          <label className="form-label" htmlFor="work-html">
            HTML 파일
          </label>
          <input key="work-html" id="work-html" className="file-input" type="file" accept=".html,.htm,text/html" onChange={handleHtmlChange} />
          <p className="form-help">
            {html
              ? `${html.name} (${Math.ceil(html.content.length / 1024)}KB)`
              : hasExistingHtml
                ? '올린 HTML 파일이 있습니다. 바꾸려면 새 파일을 고르세요.'
                : '파일 하나로 된 작품만 올릴 수 있습니다. 최대 5MB'}
          </p>
          {fieldError('html')}
        </>
      )}

      <label className="check-row form-check">
        <input type="checkbox" checked={isAi} onChange={(e) => setIsAi(e.target.checked)} />
        <span>AI 기능 사용</span>
      </label>

      <label className="form-label" htmlFor="work-thumb">
        썸네일 (선택, PNG·JPG·WebP)
      </label>
      <input id="work-thumb" className="file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleThumbChange} />
      <p className="form-help">얼굴이나 몸이 나온 사진은 올리지 마세요.</p>
      {fieldError('thumb')}
      {thumbPreview && (
        <div className="thumb-preview">
          <img src={thumbPreview} alt={`${title || '작품'} 썸네일 미리보기`} />
          <button type="button" className="text-button" onClick={() => setThumb(null)}>
            썸네일 지우기
          </button>
        </div>
      )}

      {mode === 'edit' && <p className="form-warning">수정 내용은 바로 사이트에 반영됩니다.</p>}
      {fieldError('form')}
      {message && (
        <p className="form-success" role="status">
          {message}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="primary-button" disabled={pending || !consentsDone}>
          {pending ? '저장 중' : mode === 'create' ? '등록' : '저장'}
        </button>
        {onCancel && (
          <button type="button" className="text-button" onClick={onCancel}>
            취소
          </button>
        )}
      </div>
    </form>
  )
}
