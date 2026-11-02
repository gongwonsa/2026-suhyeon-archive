import type { Work } from '../lib/api'
import { WorkCard } from './WorkCard'

interface WorkGridProps {
  works: Work[]
}

export function WorkGrid({ works }: WorkGridProps) {
  return (
    <ul className="work-grid">
      {works.map((work) => (
        <WorkCard key={work.id} work={work} />
      ))}
    </ul>
  )
}
