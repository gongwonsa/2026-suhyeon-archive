import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { GenreBadge } from '../components/GenreBadge'
import { WorkThumb } from '../components/WorkThumb'
import { WorkViewLink } from '../components/WorkViewLink'
import { fetchPublicWork } from '../lib/api'
import type { Work } from '../lib/api'

type LoadState = { kind: 'loading' } | { kind: 'failed' } | { kind: 'loaded'; work: Work | null }

export function WorkDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ kind: 'loading' })
    fetchPublicWork(Number(id)).then(
      (work) => {
        if (!cancelled) setState({ kind: 'loaded', work })
      },
      () => {
        if (!cancelled) setState({ kind: 'failed' })
      },
    )
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <>
      <p className="detail-back">
        <Link to="/works">← 목록으로</Link>
      </p>
      {state.kind === 'failed' && <p className="empty-text">잠시 후 다시 시도해 주세요.</p>}
      {state.kind === 'loaded' && !state.work && <p className="empty-text">해당하는 작품이 없습니다.</p>}
      {state.kind === 'loaded' && state.work && <WorkDetail work={state.work} />}
    </>
  )
}

function WorkDetail({ work }: { work: Work }) {
  return (
    <div className="detail">
      <div className="detail-thumb">
        <WorkThumb title={work.title} thumbPath={work.thumb_path} />
      </div>
      <div>
        {work.is_ai && <p className="detail-ai-notice">이 작품은 AI 기능을 사용합니다. 실행은 외부 링크에서 이루어집니다.</p>}
        <div className="work-label-row detail-meta">
          <span className="work-number">No. {String(work.work_no).padStart(3, '0')}</span>
          <GenreBadge genreId={work.genre_id} />
        </div>
        <h1 className="page-title detail-title">{work.title}</h1>
        <p className="detail-artist">{work.artist_name}</p>
        <p className="detail-description">{work.description}</p>
        <WorkViewLink work={work} className="detail-link-button" />
        <p className="detail-link-note">{work.work_type === 'html' ? '새 탭에서 작품이 바로 실행됩니다' : '외부 사이트로 이동합니다'}</p>
      </div>
    </div>
  )
}
