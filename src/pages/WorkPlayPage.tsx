import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchPublicWork, fetchWorkHtml } from '../lib/api'

type PlayState = { kind: 'loading' } | { kind: 'missing' } | { kind: 'failed' } | { kind: 'ready'; title: string; html: string }

// 격리된 iframe에서는 브라우저 저장소가 막혀 오류가 나므로, 창을 닫으면 사라지는 임시 저장소로 바꿔 끼운다.
const STORAGE_SHIM = `<script>(function(){function m(){var d={};return{getItem:function(k){k=String(k);return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},setItem:function(k,v){d[String(k)]=String(v)},removeItem:function(k){delete d[String(k)]},clear:function(){d={}},key:function(i){var k=Object.keys(d);return i<k.length?k[i]:null},get length(){return Object.keys(d).length}}}["localStorage","sessionStorage"].forEach(function(n){try{window[n].length}catch(e){try{Object.defineProperty(window,n,{value:m(),configurable:true})}catch(_){}}})})();</script>`

// doctype 앞에 넣으면 문서가 호환 모드로 바뀌므로 head(또는 html) 시작 태그 바로 뒤에 넣는다.
function withStorageShim(html: string): string {
  const anchor = html.match(/<head[^>]*>/i) ?? html.match(/<html[^>]*>/i)
  if (anchor && anchor.index !== undefined) {
    const at = anchor.index + anchor[0].length
    return html.slice(0, at) + STORAGE_SHIM + html.slice(at)
  }
  return STORAGE_SHIM + html
}

export function WorkPlayPage() {
  const { id } = useParams()
  const [state, setState] = useState<PlayState>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    const workId = Number(id)
    Promise.all([fetchPublicWork(workId), fetchWorkHtml(workId)]).then(
      ([work, html]) => {
        if (cancelled) return
        if (!work || work.work_type !== 'html' || html === null) {
          setState({ kind: 'missing' })
          return
        }
        document.title = work.title
        setState({ kind: 'ready', title: work.title, html: withStorageShim(html) })
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
    <div className="play">
      <div className="play-bar">
        <Link to={`/works/${id}`}>← 작품 정보</Link>
        {state.kind === 'ready' && <span className="play-title">{state.title}</span>}
      </div>
      {state.kind === 'ready' && (
        <iframe className="play-frame" title={state.title} sandbox="allow-scripts" srcDoc={state.html} />
      )}
      {state.kind === 'loading' && <p className="play-message">작품을 불러오고 있습니다.</p>}
      {state.kind === 'missing' && <p className="play-message">해당하는 작품이 없습니다.</p>}
      {state.kind === 'failed' && <p className="play-message">잠시 후 다시 시도해 주세요.</p>}
    </div>
  )
}
