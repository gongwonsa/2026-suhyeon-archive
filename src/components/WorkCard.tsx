import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Work } from '../lib/api'
import { GENRES } from '../lib/constants'

const DEFAULT_THUMB_URL = `${import.meta.env.BASE_URL}default-thumb.png`

interface WorkCardProps {
  work: Work
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

export function WorkCard({ work }: WorkCardProps) {
  const genre = GENRES.find((item) => item.id === work.genre_id)
  const genreStyle = genre
    ? ({
        '--genre-fg': `var(--genre-${genre.code}, var(--genre-etc))`,
        '--genre-bg': `var(--genre-${genre.code}-bg, var(--genre-etc-bg))`,
      } as CSSProperties)
    : undefined

  return (
    <li className="work-card">
      <Link className="work-thumb-link" to={`/works/${work.id}`}>
        {work.thumb_path ? (
          <img className="work-thumb" src={work.thumb_path} alt={work.title} loading="lazy" />
        ) : (
          <DefaultThumb title={work.title} />
        )}
      </Link>
      <div className="work-label">
        <div className="work-label-row">
          <span className="work-number">No. {String(work.work_no).padStart(3, '0')}</span>
          {genre && (
            <span className="work-genre" style={genreStyle}>
              {genre.label}
            </span>
          )}
        </div>
        <h2 className="work-title">{work.title}</h2>
        <div className="work-label-row">
          <span className="work-artist">{work.artist_name}</span>
          <a href={work.link_url} target="_blank" rel="noopener noreferrer">
            작품 보기 ↗
          </a>
        </div>
      </div>
    </li>
  )
}
