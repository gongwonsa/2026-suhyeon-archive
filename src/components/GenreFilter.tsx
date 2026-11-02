import type { CSSProperties } from 'react'
import { GENRES } from '../lib/constants'

interface GenreFilterProps {
  selectedId: number | null
  onSelect: (genreId: number | null) => void
}

const OPTIONS = [
  { id: null, label: '전체', color: 'var(--color-accent)' },
  ...GENRES.map((genre) => ({ id: genre.id, label: genre.label, color: `var(--genre-${genre.code})` })),
]

export function GenreFilter({ selectedId, onSelect }: GenreFilterProps) {
  return (
    <ul className="genre-filter" aria-label="장르 필터">
      {OPTIONS.map((option) => (
        <li key={option.label}>
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
