import type { CSSProperties } from 'react'
import type { Genre } from '../lib/constants'

interface GenreBadgeProps {
  genreId: number
  genres: Genre[]
}

export function GenreBadge({ genreId, genres }: GenreBadgeProps) {
  const genre = genres.find((item) => item.id === genreId)
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
