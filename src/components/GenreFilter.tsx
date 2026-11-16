import type { CSSProperties } from 'react'
import type { Genre } from '../lib/constants'

interface GenreFilterProps {
  genres: Genre[]
  selectedId: number | null
  onSelect: (genreId: number | null) => void
}

export function GenreFilter({ genres, selectedId, onSelect }: GenreFilterProps) {
  const options = [
    { id: null, label: '전체', color: 'var(--color-accent)', background: 'var(--color-surface)' },
    ...genres.map((genre) => ({
      id: genre.id,
      label: genre.label,
      color: `var(--genre-${genre.code}, var(--genre-etc))`,
      background: `var(--genre-${genre.code}-bg, var(--genre-etc-bg))`,
    })),
  ]

  return (
    <ul className="genre-filter" aria-label="장르 필터">
      {options.map((option) => (
        <li key={option.id ?? 'all'}>
          <button
            type="button"
            className="genre-filter-button"
            style={{ '--filter-color': option.color, '--filter-bg': option.background } as CSSProperties}
            aria-pressed={option.id === selectedId}
            onClick={() => onSelect(option.id)}
          >
            {option.label}
          </button>
        </li>
      ))}
    </ul>
  )
}
