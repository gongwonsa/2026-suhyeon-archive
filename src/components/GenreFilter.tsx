import type { CSSProperties } from 'react'
import type { Genre } from '../lib/constants'

interface GenreFilterProps {
  genres: Genre[]
  selectedId: number | null
  onSelect: (genreId: number | null) => void
}

export function GenreFilter({ genres, selectedId, onSelect }: GenreFilterProps) {
  const options = [
    { id: null, label: '전체', color: 'var(--color-accent)' },
    ...genres.map((genre) => ({
      id: genre.id,
      label: genre.label,
      color: `var(--genre-${genre.code}, var(--genre-etc))`,
    })),
  ]

  return (
    <ul className="genre-filter" aria-label="장르 필터">
      {options.map((option) => (
        <li key={option.id ?? 'all'}>
          <button
            type="button"
            className="genre-filter-button"
            style={{ '--filter-color': option.color } as CSSProperties}
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
