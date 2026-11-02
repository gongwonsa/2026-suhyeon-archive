import { useEffect, useMemo, useState } from 'react'
import { GenreFilter } from '../components/GenreFilter'
import { SearchInput } from '../components/SearchInput'
import { WorkGrid } from '../components/WorkGrid'
import { fetchPublicWorks } from '../lib/api'
import type { Work } from '../lib/api'

export function WorksPage() {
  const [works, setWorks] = useState<Work[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [genreId, setGenreId] = useState<number | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetchPublicWorks().then(setWorks, () => setLoadFailed(true))
  }, [])

  const visibleWorks = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return (works ?? []).filter((work) => {
      const matchesGenre = genreId === null || work.genre_id === genreId
      const matchesKeyword =
        work.title.toLowerCase().includes(keyword) || work.artist_name.toLowerCase().includes(keyword)
      return matchesGenre && matchesKeyword
    })
  }, [works, genreId, query])

  return (
    <>
      <div className="controls">
        <GenreFilter selectedId={genreId} onSelect={setGenreId} />
        <SearchInput value={query} onChange={setQuery} />
      </div>
      {loadFailed && <p className="empty-text">잠시 후 다시 시도해 주세요.</p>}
      {works && visibleWorks.length > 0 && <WorkGrid works={visibleWorks} />}
      <p className="empty-text" aria-live="polite">
        {works && visibleWorks.length === 0 ? '해당하는 작품이 없습니다.' : ''}
      </p>
    </>
  )
}
