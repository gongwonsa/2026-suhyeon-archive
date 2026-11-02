import { useState } from 'react'

const DEFAULT_THUMB_URL = `${import.meta.env.BASE_URL}default-thumb.png`

interface WorkThumbProps {
  title: string
  thumbPath: string | null
}

function DefaultThumb({ title }: { title: string }) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <span className="work-default-thumb">
      {imageFailed ? (
        <span className="work-default-fallback" />
      ) : (
        <img className="work-thumb" src={DEFAULT_THUMB_URL} alt="" onError={() => setImageFailed(true)} />
      )}
      <span className="work-default-title">{title}</span>
    </span>
  )
}

export function WorkThumb({ title, thumbPath }: WorkThumbProps) {
  if (!thumbPath) {
    return <DefaultThumb title={title} />
  }
  return <img className="work-thumb" src={thumbPath} alt={title} loading="lazy" />
}
