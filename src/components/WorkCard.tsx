import { Link } from 'react-router-dom'
import type { Work } from '../lib/api'
import { GenreBadge } from './GenreBadge'
import { WorkThumb } from './WorkThumb'

interface WorkCardProps {
  work: Work
}

export function WorkCard({ work }: WorkCardProps) {
  return (
    <li className="work-card">
      <Link className="work-thumb-link" to={`/works/${work.id}`}>
        <WorkThumb title={work.title} thumbPath={work.thumb_path} />
      </Link>
      <div className="work-label">
        <div className="work-label-row">
          <span className="work-number">No. {String(work.work_no).padStart(3, '0')}</span>
          <GenreBadge genreId={work.genre_id} />
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
