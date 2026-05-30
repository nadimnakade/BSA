import { useEffect, useMemo, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

const norm = v => (v ?? '').toString().trim()

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
    return Array.from(new Set(
      q
        .toUpperCase()
        .replace(/[^A-Z0-9 ]/g, ' ')
        .split(/\s+/)
        .map(x => x.trim())
        .filter(x => x.length >= 4)
    ))
  }, [query])

  useEffect(() => {
    let cancelled = false
    if (!pdf) return
    const q = norm(query)
    if (!q) return

    ;(async () => {
      try {
        const upperQ = q.toUpperCase()
        for (let p = 1; p <= (pdf.numPages || 0); p++) {
          const page = await pdf.getPage(p)
          const tc = await page.getTextContent()
          const pageText = (tc.items || []).map(i => i.str).join(' ').toUpperCase()
          if (pageText.includes(upperQ)) {
            if (!cancelled) setPageNum(p)
            break
          }
        }
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
        const upperTokens = tokens
        if (!upperTokens.length) return

        octx.fillStyle = 'rgba(245, 158, 11, 0.32)'
        octx.strokeStyle = 'rgba(245, 158, 11, 0.7)'
        octx.lineWidth = 1

        for (const item of items) {
          const str = (item.str || '').toString().toUpperCase()
          if (!str) continue
          if (!upperTokens.some(t => str.includes(t))) continue

          const tr = item.transform || []
          const x = tr[4]
          const y = tr[5]
          const w = item.width || 0
          const h = item.height || 0
          if (!x && !y) continue

          const rect = viewport.convertToViewportRectangle([x, y, x + w, y + h])
          const x1 = Math.min(rect[0], rect[2])
          const y1 = Math.min(rect[1], rect[3])
          const x2 = Math.max(rect[0], rect[2])
          const y2 = Math.max(rect[1], rect[3])
          const rw = x2 - x1
          const rh = y2 - y1
          if (rw <= 0 || rh <= 0) continue
          octx.fillRect(x1, y1 - rh, rw, rh + 2)
          octx.strokeRect(x1, y1 - rh, rw, rh + 2)
        }
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

