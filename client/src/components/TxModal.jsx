import { useEffect, useMemo, useState } from 'react'
import PdfHighlightViewer from './PdfHighlightViewer'

export default function TxModal({ open, tx, onClose, file, filename }) {
  if (!open || !tx) return null

  const [showFileText, setShowFileText] = useState(false)
  const [showPdf, setShowPdf] = useState(false)
  const [fileText, setFileText] = useState('')
  const [fileTextErr, setFileTextErr] = useState('')

  const field = (label, value) => (
    <div style={{display:'grid',gridTemplateColumns:'140px 1fr',gap:10,marginBottom:8}}>
      <div style={{fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.06em'}}>{label}</div>
      <div style={{fontSize:12,color:'var(--text-secondary)',fontFamily:'JetBrains Mono,monospace'}}>{value ?? '—'}</div>
    </div>
  )

  const meta = {
    source_type: tx.source_type,
    source_sheet: tx.source_sheet,
    source_row: tx.source_row,
    source_line_start: tx.source_line_start,
    source_line_end: tx.source_line_end,
    source_page: tx.source_page,
  }

  const anyMeta = Object.values(meta).some(v => v !== undefined && v !== null && v !== '')
  const excerpt = tx.source_excerpt || tx.raw || tx.description || ''

  const ext = (filename || (file && file.name) || '').toString().toLowerCase().split('.').pop()
  const isTextLike = ext === 'txt' || ext === 'csv'
  const isPdf = ext === 'pdf'

  const pdfQuery = useMemo(() => {
    const parts = []
    const add = (v) => {
      const s = (v ?? '').toString().trim()
      if (!s) return
      if (parts.includes(s)) return
      parts.push(s)
    }

    add(tx.utr)
    add(tx.rrn)
    add(tx.nach_umrn)
    add(tx.nach_ref)
    add(tx.mandate_id)
    add(tx.txn_id)
    add(tx.reference_id)
    add(tx.disbursement_id)
    add(tx.loan_account_masked)

    const iso = (tx.date || '').toString().match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (iso) add(`${iso[3]}-${iso[2]}-${iso[1]}`)

    const amt = tx.amount ?? tx.emi_amount
    if (amt !== undefined && amt !== null && amt !== '') {
      const n = Number(amt)
      if (!Number.isNaN(n) && Number.isFinite(n)) add(n.toFixed(2))
    }

    if (!parts.length) add((tx.source_excerpt || tx.description || tx.raw || '').toString().slice(0, 120))
    return parts.join(' ')
  }, [tx])

  useEffect(() => {
    if (!open) return
    setShowFileText(false)
    setShowPdf(false)
    setFileText('')
    setFileTextErr('')
  }, [open, tx])

  useEffect(() => {
    let cancelled = false
    if (!open || !showFileText) return
    if (!file || !isTextLike) return
    ;(async () => {
      try {
        const text = await file.text()
        if (cancelled) return
        setFileText(text)
      } catch (e) {
        if (cancelled) return
        setFileTextErr(e?.message || 'Failed to read file')
      }
    })()
    return () => { cancelled = true }
  }, [open, showFileText, file, isTextLike])

  const highlight = useMemo(() => {
    if (!isTextLike) return { start: null, end: null }
    if (tx.source_line_start !== undefined) return { start: tx.source_line_start, end: tx.source_line_end || tx.source_line_start }
    if (tx.source_row !== undefined) return { start: tx.source_row, end: tx.source_row }
    return { start: null, end: null }
  }, [isTextLike, tx.source_line_start, tx.source_line_end, tx.source_row])

  const openOriginal = () => {
    if (!file) return
    const url = URL.createObjectURL(file)
    window.open(url, '_blank', 'noopener,noreferrer')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position:'fixed',
        inset:0,
        background:'rgba(0,0,0,.55)',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        zIndex:1000,
        padding:16
      }}
    >
      <div
        onClick={e=>e.stopPropagation()}
        className="card"
        style={{
          width:'min(980px, 100%)',
          maxHeight:'85vh',
          overflow:'auto',
          padding:18
        }}
      >
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:700,color:'var(--text-primary)'}}>Transaction Source</div>
          <div style={{display:'flex',gap:8}}>
            {file && <button className="ctrl-btn" onClick={openOriginal}>Open File</button>}
            {file && isTextLike && <button className="ctrl-btn" onClick={()=>setShowFileText(v=>!v)}>{showFileText ? 'Hide Highlight' : 'Show Highlight'}</button>}
            {file && isPdf && <button className="ctrl-btn" onClick={()=>setShowPdf(v=>!v)}>{showPdf ? 'Hide PDF' : 'Show PDF Highlight'}</button>}
            <button className="ctrl-btn" onClick={onClose}>Close</button>
          </div>
        </div>

        {field('Date', tx.date)}
        {field('Type', tx.type || tx.loan_type || tx.category || tx.direction)}
        {field('Amount', tx.amount ?? tx.emi_amount)}

        {anyMeta && (
          <div style={{marginTop:14,marginBottom:6,fontSize:12,fontWeight:600,color:'var(--text-primary)'}}>Location</div>
        )}
        {anyMeta && (
          <div style={{background:'var(--bg-secondary)',border:'1px solid var(--border)',borderRadius:10,padding:14,marginBottom:14}}>
            {field('Source Type', meta.source_type)}
            {meta.source_page !== undefined && field('Page', meta.source_page)}
            {meta.source_sheet && field('Sheet', meta.source_sheet)}
            {meta.source_row !== undefined && field('Row', meta.source_row)}
            {(meta.source_line_start !== undefined || meta.source_line_end !== undefined) && field('Lines', `${meta.source_line_start ?? '—'}-${meta.source_line_end ?? '—'}`)}
          </div>
        )}

        <div style={{marginTop:8,marginBottom:6,fontSize:12,fontWeight:600,color:'var(--text-primary)'}}>Extracted Snippet</div>
        <pre style={{
          whiteSpace:'pre-wrap',
          wordBreak:'break-word',
          background:'var(--bg-secondary)',
          border:'1px solid var(--border)',
          borderRadius:10,
          padding:14,
          fontSize:12,
          color:'var(--text-secondary)',
          fontFamily:'JetBrains Mono,monospace',
          lineHeight:1.5
        }}>{excerpt || '—'}</pre>

        {showFileText && (
          <>
            <div style={{marginTop:14,marginBottom:6,fontSize:12,fontWeight:600,color:'var(--text-primary)'}}>File View</div>
            <div style={{background:'var(--bg-secondary)',border:'1px solid var(--border)',borderRadius:10,padding:12}}>
              {fileTextErr ? (
                <div style={{fontSize:12,color:'var(--red)'}}>{fileTextErr}</div>
              ) : !fileText ? (
                <div style={{fontSize:12,color:'var(--text-muted)'}}>Loading...</div>
              ) : (
                <pre style={{
                  whiteSpace:'pre-wrap',
                  wordBreak:'break-word',
                  fontSize:12,
                  color:'var(--text-secondary)',
                  fontFamily:'JetBrains Mono,monospace',
                  lineHeight:1.5,
                  margin:0
                }}>
                  {fileText.split('\n').slice(0, 5000).map((line, idx) => {
                    const lineNo = idx + 1
                    const inRange = highlight.start !== null && lineNo >= highlight.start && lineNo <= (highlight.end ?? highlight.start)
                    return (
                      <div key={idx} style={{display:'grid',gridTemplateColumns:'70px 1fr',gap:10,background:inRange?'rgba(245,158,11,.15)':'transparent',borderRadius:6,padding:'2px 6px'}}>
                        <span style={{color:'var(--text-muted)'}}>{lineNo}</span>
                        <span>{line}</span>
                      </div>
                    )
                  })}
                </pre>
              )}
              {highlight.start === null && (
                <div style={{marginTop:8,fontSize:12,color:'var(--text-muted)'}}>No source line/row info available to highlight.</div>
              )}
            </div>
          </>
        )}

        {showPdf && (
          <>
            <div style={{marginTop:14,marginBottom:6,fontSize:12,fontWeight:600,color:'var(--text-primary)'}}>PDF View</div>
            <PdfHighlightViewer
              file={file}
              initialQuery={pdfQuery}
            />
          </>
        )}
      </div>
    </div>
  )
}
