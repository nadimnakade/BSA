import { useEffect, useMemo, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

const norm = v => (v ?? '').toString().trim()
const unique = (arr) => Array.from(new Set(arr.filter(Boolean)))

export default function PdfHighlightViewer({ file, initialQuery }) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [pdf, setPdf] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [query, setQuery] = useState(initialQuery || '')
  const [scale, setScale] = useState(1.4)

  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)

  useEffect(() => {
    setQuery(initialQuery || '')
  }, [initialQuery])

  useEffect(() => {
    let cancelled = false
    let url = ''

    ;(async () => {
      if (!file) return
      setLoading(true)
      setErr('')
      setPdf(null)
      try {
        url = URL.createObjectURL(file)
        const doc = await pdfjsLib.getDocument({ url }).promise
        if (cancelled) return
        setPdf(doc)
        setNumPages(doc.numPages || 0)
        setPageNum(1)
      } catch (e) {
        if (cancelled) return
        setErr(e?.message || 'Failed to load PDF')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [file])

  const tokens = useMemo(() => {
    const q = norm(query)
    if (!q) return []
    const raw = q
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, ' ')
      .split(/\s+/)
      .map(x => x.trim())
      .filter(x => (/^\d+$/.test(x) ? x.length >= 6 : x.length >= 4))

    const expanded = []
    for (const t of raw) {
      if (/^\d{10,}$/.test(t)) {
        const step = 3
        const size = 6
        for (let i = 0; i + size <= t.length; i += step) expanded.push(t.slice(i, i + size))
        expanded.push(t.slice(-size))
      } else {
        expanded.push(t)
      }
    }

    return unique(expanded)
  }, [query])

  useEffect(() => {
    let cancelled = false
    if (!pdf) return
    const q = norm(query)
    if (!q) return

    ;(async () => {
      try {
        const upperQ = q.toUpperCase()
        const searchTokens = unique(
          upperQ
            .replace(/[^A-Z0-9 ]/g, ' ')
            .split(/\s+/)
            .map(x => x.trim())
            .filter(x => (/^\d+$/.test(x) ? x.length >= 6 : x.length >= 4))
        )

        let best = { page: 1, score: -1 }
        const pageCount = pdf.numPages || 0
        for (let p = 1; p <= pageCount; p++) {
          const page = await pdf.getPage(p)
          const tc = await page.getTextContent()
          const pageText = (tc.items || []).map(i => i.str).join(' ').toUpperCase()

          if (pageText.includes(upperQ)) {
            if (!cancelled) setPageNum(p)
            return
          }

          let score = 0
          for (const t of searchTokens) {
            if (pageText.includes(t)) score++
          }
          if (score > best.score) best = { page: p, score }
        }

        const minNeeded = Math.min(2, searchTokens.length || 0)
        if (best.score >= minNeeded && !cancelled) setPageNum(best.page)
      } catch {}
    })()

    return () => { cancelled = true }
  }, [pdf, query])

  useEffect(() => {
    let cancelled = false
    if (!pdf) return

    ;(async () => {
      try {
        const page = await pdf.getPage(pageNum)
        if (cancelled) return

        const viewport = page.getViewport({ scale })
        const canvas = canvasRef.current
        const overlay = overlayRef.current
        const container = containerRef.current
        if (!canvas || !overlay || !container) return

        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        overlay.width = canvas.width
        overlay.height = canvas.height
        container.style.width = `${canvas.width}px`
        container.style.height = `${canvas.height}px`

        const ctx = canvas.getContext('2d')
        const octx = overlay.getContext('2d')
        if (!ctx || !octx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        octx.clearRect(0, 0, overlay.width, overlay.height)

        await page.render({ canvasContext: ctx, viewport }).promise
        if (cancelled) return

        const tc = await page.getTextContent()
        if (cancelled) return

        const items = tc.items || []
        if (!items.length) {
          setErr('No selectable text detected on this PDF page. If this is a scanned PDF/image, highlighting cannot work.')
          return
        }
        const upperTokens = tokens
        if (!upperTokens.length) return

        octx.fillStyle = 'rgba(245, 158, 11, 0.32)'
        octx.strokeStyle = 'rgba(245, 158, 11, 0.7)'
        octx.lineWidth = 1

        let matchCount = 0
        for (const item of items) {
          const str = (item.str || '').toString().toUpperCase()
          if (!str) continue
          if (!upperTokens.some(t => str.includes(t))) continue

          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform || [])
          const x = tx[4]
          const y = tx[5]
          const h = Math.max(8, Math.abs(tx[3] || tx[0] || 0))
          const w = Math.max(1, (item.width || 0) * (viewport.scale || 1))
          if (!Number.isFinite(x) || !Number.isFinite(y)) continue
          matchCount++
          octx.fillRect(x, y - h, w, h + 2)
          octx.strokeRect(x, y - h, w, h + 2)
        }
        if (!matchCount) setErr('No highlights found for the current query on this page. Try searching by a shorter unique token (e.g., UTR/UMRN/last 6 digits).')
      } catch (e) {
        if (!cancelled) setErr(e?.message || 'Failed to render PDF page')
      }
    })()

    return () => { cancelled = true }
  }, [pdf, pageNum, scale, tokens])

  return (
    <div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <input className="ctrl" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search in PDF..." style={{minWidth:280}} />
          <select className="ctrl" value={scale} onChange={e=>setScale(Number(e.target.value))}>
            <option value={1.0}>100%</option>
            <option value={1.2}>120%</option>
            <option value={1.4}>140%</option>
            <option value={1.6}>160%</option>
            <option value={1.8}>180%</option>
          </select>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button className="ctrl-btn" onClick={()=>setPageNum(p=>Math.max(1, p-1))} disabled={!pdf || pageNum<=1}>Prev</button>
          <div style={{fontSize:12,color:'var(--text-muted)',fontFamily:'JetBrains Mono,monospace'}}>{pageNum}/{numPages || '—'}</div>
          <button className="ctrl-btn" onClick={()=>setPageNum(p=>Math.min(numPages || p, p+1))} disabled={!pdf || pageNum>=numPages}>Next</button>
        </div>
      </div>

      {err && <div style={{fontSize:12,color:'var(--red)',marginBottom:10}}>{err}</div>}
      {loading && <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:10}}>Loading PDF...</div>}

      <div style={{overflow:'auto',border:'1px solid var(--border)',borderRadius:10,background:'var(--bg-secondary)',padding:12}}>
        <div ref={containerRef} style={{position:'relative'}}>
          <canvas ref={canvasRef} style={{display:'block'}} />
          <canvas ref={overlayRef} style={{position:'absolute',left:0,top:0,pointerEvents:'none'}} />
        </div>
      </div>

      <div style={{marginTop:10,fontSize:12,color:'var(--text-muted)'}}>
        Highlights match tokens from the search (words with 4+ characters). If the PDF is scanned (image-only), highlighting won’t work.
      </div>
    </div>
  )
}
