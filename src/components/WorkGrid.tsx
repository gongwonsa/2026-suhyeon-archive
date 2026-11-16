import type { Work } from '../lib/api'
import type { Genre } from '../lib/constants'
import { WorkCard } from './WorkCard'

interface WorkGridProps {
  works: Work[]
  genres: Genre[]
}

export function WorkGrid({ works, genres }: WorkGridProps) {
  return (
    <ul className="work-grid">
      {works.map((work) => (
        <WorkCard key={work.id} work={work} genres={genres} />
      ))}
    </ul>
  )
}
