import type { UploadWork } from '../lib/api'
import type { Genre } from '../lib/constants'
import { WorkThumb } from './WorkThumb'

interface UploadWorkListProps {
  works: UploadWork[]
  genres: Genre[]
  onEdit: (work: UploadWork) => void
  onRequestDelete: (work: UploadWork) => void
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : `${date.getMonth() + 1}.${date.getDate()}`
}

export function UploadWorkList({ works, genres, onEdit, onRequestDelete }: UploadWorkListProps) {
  if (works.length === 0) {
    return <p className="empty-text">아직 등록한 작품이 없습니다.</p>
  }

  return (
    <ul className="upload-list">
      {works.map((work) => {
        const deleted = work.status === '삭제요청'
        const edited = work.updated_at && work.updated_at !== work.created_at
        const meta = [
          genres.find((genre) => genre.id === work.genre_id)?.label ?? '기타',
          work.artist_name,
          `${formatDate(edited ? work.updated_at : work.created_at)} ${edited ? '수정' : '등록'}`,
          work.work_type === 'html' ? 'HTML 작품' : '링크 작품',
          deleted ? null : work.status,
        ].filter(Boolean)

        return (
          <li key={work.id} className={deleted ? 'upload-row upload-row-deleted' : 'upload-row'}>
            <div className="upload-row-thumb">
              <WorkThumb title={work.title} thumbPath={work.thumb_path} />
            </div>
            <div className="upload-row-info">
              <p>
                <span className="work-number">No. {String(work.work_no).padStart(3, '0')}</span>{' '}
                <span className="upload-row-title">{work.title}</span>
              </p>
              <p className="upload-row-meta">{meta.join(' · ')}</p>
            </div>
            <div className="upload-row-actions">
              {deleted ? (
                <span className="upload-row-deleted-label">삭제 요청됨</span>
              ) : (
                <>
                  <button type="button" className="text-button" onClick={() => onEdit(work)}>
                    수정
                  </button>
                  <button type="button" className="text-button" onClick={() => onRequestDelete(work)}>
                    삭제 요청
                  </button>
                </>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
