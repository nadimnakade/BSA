import { useState, useRef } from 'react'

export default function CombinedUpload({ onAnalyze, error }) {
  const [cibilFile, setCibilFile] = useState(null)
  const [cibilPassword, setCibilPassword] = useState('')
  const [stmtFile, setStmtFile] = useState(null)
  const [stmtPassword, setStmtPassword] = useState('')
  const [dragging, setDragging] = useState(null)
  const cibilRef = useRef()
  const stmtRef = useRef()

  const canSubmit = !!cibilFile && !!stmtFile

  const onDrop = (which, e) => {
    e.preventDefault()
    setDragging(null)
    const f = e.dataTransfer.files[0]
    if (!f) return
    if (which === 'cibil') setCibilFile(f)
    else setStmtFile(f)
  }

  return (
    <div style={{maxWidth:760, margin:'40px auto 0'}}>
      <div style={{textAlign:'center', marginBottom:32}}>
        <h1 style={{fontSize:28, fontWeight:600, color:'var(--text-primary)', marginBottom:8}}>Complete Underwriting Analysis</h1>
        <p style={{color:'var(--text-secondary)', fontSize:14, lineHeight:1.6, margin:0}}>
          Upload your CIBIL report + bank statement together for full eligibility analysis
        </p>
      </div>

      {error && (
        <div style={{background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:13, color:'var(--red)'}}>
          ✗ {error}
        </div>
      )}

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20}}>
        {/* CIBIL Upload */}
        <div>
          <div style={{fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:8, display:'flex', alignItems:'center', gap:6}}>
            <span>🧾</span> CIBIL Report
          </div>
          <div
            onDragOver={e => { e.preventDefault(); setDragging('cibil') }}
            onDragLeave={() => setDragging(null)}
            onDrop={e => onDrop('cibil', e)}
            onClick={() => cibilRef.current.click()}
            style={{
              border: `2px dashed ${dragging === 'cibil' ? 'var(--blue)' : cibilFile ? 'var(--green)' : 'var(--border-bright)'}`,
              borderRadius: 12, padding: '32px 20px', textAlign: 'center', cursor: 'pointer',
              background: dragging === 'cibil' ? 'rgba(59,130,246,.05)' : cibilFile ? 'rgba(34,197,94,.03)' : 'var(--bg-card)',
              transition: 'all .2s', minHeight: 140, display: 'flex', flexDirection: 'column', justifyContent: 'center'
            }}
          >
            <input ref={cibilRef} type="file" accept=".pdf,.txt" style={{display:'none'}} onChange={e => { if (e.target.files[0]) { setCibilFile(e.target.files[0]); setCibilPassword('') } }} />
            {cibilFile ? (
              <>
                <div style={{fontSize:28, marginBottom:8}}>✓</div>
                <div style={{color:'var(--green)', fontWeight:500, marginBottom:4, fontSize:13, wordBreak:'break-all'}}>{cibilFile.name}</div>
                <div style={{color:'var(--text-muted)', fontSize:11}}>{(cibilFile.size/1024).toFixed(1)} KB · Click to change</div>
              </>
            ) : (
              <>
                <div style={{fontSize:28, marginBottom:8}}>🧾</div>
                <div style={{color:'var(--text-primary)', fontWeight:500, marginBottom:4, fontSize:13}}>Drop CIBIL report</div>
                <div style={{color:'var(--text-muted)', fontSize:11}}>PDF · TXT · up to 25MB</div>
              </>
            )}
          </div>

          {cibilFile && (
            <div className="card" style={{padding:'10px 12px', marginTop:8}}>
              <div style={{fontSize:11, fontWeight:600, color:'var(--text-primary)', marginBottom:4}}>PDF Password (if any)</div>
              <input
                className="ctrl"
                value={cibilPassword}
                onChange={e => setCibilPassword(e.target.value)}
                type="password"
                placeholder="Enter password if locked"
                style={{width:'100%', fontSize:12}}
              />
            </div>
          )}
        </div>

        {/* Statement Upload */}
        <div>
          <div style={{fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:8, display:'flex', alignItems:'center', gap:6}}>
            <span>🏦</span> Bank Statement
          </div>
          <div
            onDragOver={e => { e.preventDefault(); setDragging('stmt') }}
            onDragLeave={() => setDragging(null)}
            onDrop={e => onDrop('stmt', e)}
            onClick={() => stmtRef.current.click()}
            style={{
              border: `2px dashed ${dragging === 'stmt' ? 'var(--blue)' : stmtFile ? 'var(--green)' : 'var(--border-bright)'}`,
              borderRadius: 12, padding: '32px 20px', textAlign: 'center', cursor: 'pointer',
              background: dragging === 'stmt' ? 'rgba(59,130,246,.05)' : stmtFile ? 'rgba(34,197,94,.03)' : 'var(--bg-card)',
              transition: 'all .2s', minHeight: 140, display: 'flex', flexDirection: 'column', justifyContent: 'center'
            }}
          >
            <input ref={stmtRef} type="file" accept=".pdf,.csv,.xlsx,.xls,.txt" style={{display:'none'}} onChange={e => { if (e.target.files[0]) { setStmtFile(e.target.files[0]); setStmtPassword('') } }} />
            {stmtFile ? (
              <>
                <div style={{fontSize:28, marginBottom:8}}>✓</div>
                <div style={{color:'var(--green)', fontWeight:500, marginBottom:4, fontSize:13, wordBreak:'break-all'}}>{stmtFile.name}</div>
                <div style={{color:'var(--text-muted)', fontSize:11}}>{(stmtFile.size/1024).toFixed(1)} KB · Click to change</div>
              </>
            ) : (
              <>
                <div style={{fontSize:28, marginBottom:8}}>📄</div>
                <div style={{color:'var(--text-primary)', fontWeight:500, marginBottom:4, fontSize:13}}>Drop bank statement</div>
                <div style={{color:'var(--text-muted)', fontSize:11}}>PDF · CSV · XLSX · TXT · up to 25MB</div>
              </>
            )}
          </div>

          {stmtFile && stmtFile.name.toLowerCase().endsWith('.pdf') && (
            <div className="card" style={{padding:'10px 12px', marginTop:8}}>
              <div style={{fontSize:11, fontWeight:600, color:'var(--text-primary)', marginBottom:4}}>PDF Password (if any)</div>
              <input
                className="ctrl"
                value={stmtPassword}
                onChange={e => setStmtPassword(e.target.value)}
                type="password"
                placeholder="Enter password if locked"
                style={{width:'100%', fontSize:12}}
              />
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => onAnalyze && onAnalyze(cibilFile, stmtFile, cibilPassword, stmtPassword)}
        disabled={!canSubmit}
        style={{
          width: '100%', padding: '14px 24px',
          background: canSubmit ? 'var(--blue)' : 'var(--bg-card)',
          color: canSubmit ? '#fff' : 'var(--text-muted)',
          border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600,
          cursor: canSubmit ? 'pointer' : 'not-allowed', transition: 'all .2s'
        }}
      >
        Analyze Both →
      </button>

      <div style={{marginTop:24, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
        {[
          {icon:'🏦',label:'Loan Eligibility',desc:'Personal, Home, Vehicle, Business'},
          {icon:'📊',label:'Risk Assessment',desc:'DPD, FOIR, utilization analysis'},
          {icon:'💰',label:'Income & Salary',desc:'Employer, EPFO, cash flow'},
          {icon:'📈',label:'Improvement Tips',desc:'Actionable credit building advice'},
        ].map(f => (
          <div key={f.label} className="card" style={{padding:'10px 12px'}}>
            <div style={{fontSize:16, marginBottom:3}}>{f.icon}</div>
            <div style={{fontSize:12, fontWeight:500, color:'var(--text-primary)', marginBottom:2}}>{f.label}</div>
            <div style={{fontSize:10, color:'var(--text-muted)'}}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
