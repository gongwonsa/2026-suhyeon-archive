import type { CSSProperties } from 'react'
import { GENRES } from '../lib/constants'

interface GenreBadgeProps {
  genreId: number
}

export function GenreBadge({ genreId }: GenreBadgeProps) {
  const genre = GENRES.find((item) => item.id === genreId)
  if (!genre) {
    return null
  }

  const style = {
    '--genre-fg': `var(--genre-${genre.code}, var(--genre-etc))`,
    '--genre-bg': `var(--genre-${genre.code}-bg, var(--genre-etc-bg))`,
  } as CSSProperties

  return (
    <span className="work-genre" style={style}>
      {genre.label}
    </span>
  )
}
