import { useEffect, useState, useRef } from 'react'

const SAMPLE = `Date,Description,Debit,Credit,Balance
01-Nov-2025,NACH/10/2363147532/AI AIRPORT,,35305.00,139023.22
04-Nov-2025,NACH/10/3388104833/SMFGINDIACR,16832.00,,93582.22
01-Dec-2025,NACH/10/2535264292/AI AIRPORT,,35280.00,35351.38
02-Dec-2025,NACH/10/3919685093/Piramal Cap,8050.00,,48760.25
04-Dec-2025,NACH/10/3578752490/SMFGINDIACR,16832.00,,1335.38
05-Nov-2025,UPIAR/530979261068/DR/NISHIKAN/ICIC/nishikant.hire,30000.00,,64957.22
20-Dec-2025,NEFT:PIRAMAL CAPITAL AND HOUSING FINANCE,,271339.00,271691.38
06-Mar-2026,NEFT:EMPLOYEE PROVIDENT FUND ORGANIZATIO,,60500.00,83179.27
03-Jan-2026,TRTR/0APY16279540/GBM,824.00,,11182.43
02-Feb-2026,NACH/10/3919685093/Piramal Cap,8050.00,,48760.25`

export default function UploadZone({ mode = 'statement', onAnalyze, onTextAnalyze, error }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [cibilFile, setCibilFile] = useState(null)
  const [cibilPassword, setCibilPassword] = useState('')
  const [textMode, setTextMode] = useState(false)
  const [text, setText] = useState('')
  const fileRef = useRef()
  const cibilRef = useRef()

  const isCibil = mode === 'cibil'

  useEffect(() => {
    setDragging(false)
    setFile(null)
    setCibilFile(null)
    setCibilPassword('')
    setTextMode(false)
    setText('')
  }, [mode])

  const canSubmit = isCibil
    ? !!cibilFile
    : (textMode ? text.trim().length > 30 : !!file)

  return (
    <div style={{ maxWidth:680, margin:'48px auto 0' }}>
      <div style={{ textAlign:'center', marginBottom:36 }}>
        <h1 style={{ fontSize:30, fontWeight:600, color:'var(--text-primary)', marginBottom:8, lineHeight:1.2 }}>{isCibil ? 'Analyze Your CIBIL Report' : 'Analyze Your Bank Statement'}</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:14, lineHeight:1.6, margin:0 }}>{isCibil ? 'Upload CIBIL PDF/TXT · Extract score, active loans, enquiries · 100% private' : 'Upload PDF, CSV, or XLSX · Instant rule-based analysis · No AI · No cloud · 100% private'}</p>
      </div>

      {error && (
        <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:13, color:'var(--red)' }}>
          ✗ {error}
        </div>
      )}

      {!isCibil && (
        <div style={{ display:'flex', gap:6, marginBottom:14 }}>
          <button className={`tab-btn ${!textMode?'active':''}`} onClick={() => { setTextMode(false); setText('') }}>📁 Upload File</button>
          <button className={`tab-btn ${textMode?'active':''}`} onClick={() => { setTextMode(true); setFile(null) }}>📋 Paste Text / CSV</button>
        </div>
      )}

      {isCibil ? (
        <div style={{display:'grid',gridTemplateColumns:'1fr',gap:12}}>
          <div
            onDragOver={e=>{e.preventDefault();setDragging(true)}}
            onDragLeave={()=>setDragging(false)}
            onDrop={e=>{e.preventDefault();setDragging(false);const f=e.dataTransfer.files[0];if(f)setCibilFile(f)}}
            onClick={()=>cibilRef.current.click()}
            style={{ border:`2px dashed ${dragging?'var(--blue)':cibilFile?'var(--green)':'var(--border-bright)'}`, borderRadius:14, padding:'44px 32px', textAlign:'center', cursor:'pointer', background:dragging?'rgba(59,130,246,.05)':cibilFile?'rgba(34,197,94,.03)':'var(--bg-card)', transition:'all .2s' }}
          >
            <input ref={cibilRef} type="file" accept=".pdf,.txt" style={{display:'none'}} onChange={e=>{ if (e.target.files[0]) { setCibilFile(e.target.files[0]); setCibilPassword('') } }} />
            {cibilFile ? (
              <><div style={{fontSize:32,marginBottom:10}}>✓</div>
              <div style={{color:'var(--green)',fontWeight:500,marginBottom:4}}>{cibilFile.name}</div>
              <div style={{color:'var(--text-muted)',fontSize:12}}>{(cibilFile.size/1024).toFixed(1)} KB · Click to change</div></>
            ) : (
              <><div style={{fontSize:32,marginBottom:10}}>🧾</div>
              <div style={{color:'var(--text-primary)',fontWeight:500,marginBottom:6}}>Drop your CIBIL report here</div>
              <div style={{color:'var(--text-muted)',fontSize:12}}>PDF · TXT · up to 25MB</div></>
            )}
          </div>

          {cibilFile && (
            <div className="card" style={{padding:'12px 14px'}}>
              <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:6}}>CIBIL PDF password (if any)</div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
                <input
                  className="ctrl"
                  value={cibilPassword}
                  onChange={e=>setCibilPassword(e.target.value)}
                  type="password"
                  placeholder="Enter password if the PDF is locked"
                  style={{minWidth:320}}
                />
                <button className="ctrl-btn" onClick={()=>setCibilPassword('')} disabled={!cibilPassword}>Clear</button>
              </div>
              <div style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>If the PDF is password-protected, enter the password here so it can be read.</div>
            </div>
          )}
        </div>
      ) : !textMode ? (
        <div style={{display:'grid',gridTemplateColumns:'1fr',gap:12}}>
          <div
            onDragOver={e=>{e.preventDefault();setDragging(true)}}
            onDragLeave={()=>setDragging(false)}
            onDrop={e=>{e.preventDefault();setDragging(false);const f=e.dataTransfer.files[0];if(f)setFile(f)}}
            onClick={()=>fileRef.current.click()}
            style={{ border:`2px dashed ${dragging?'var(--blue)':file?'var(--green)':'var(--border-bright)'}`, borderRadius:14, padding:'44px 32px', textAlign:'center', cursor:'pointer', background:dragging?'rgba(59,130,246,.05)':file?'rgba(34,197,94,.03)':'var(--bg-card)', transition:'all .2s' }}
          >
            <input ref={fileRef} type="file" accept=".pdf,.csv,.xlsx,.xls,.txt" style={{display:'none'}} onChange={e=>e.target.files[0]&&setFile(e.target.files[0])} />
            {file ? (
              <><div style={{fontSize:32,marginBottom:10}}>✓</div>
              <div style={{color:'var(--green)',fontWeight:500,marginBottom:4}}>{file.name}</div>
              <div style={{color:'var(--text-muted)',fontSize:12}}>{(file.size/1024).toFixed(1)} KB · Click to change</div></>
            ) : (
              <><div style={{fontSize:32,marginBottom:10}}>📄</div>
              <div style={{color:'var(--text-primary)',fontWeight:500,marginBottom:6}}>Drop your bank statement here</div>
              <div style={{color:'var(--text-muted)',fontSize:12}}>PDF · CSV · XLSX · XLS · TXT · up to 25MB</div></>
            )}
          </div>
        </div>
      ) : (
        <div>
          <textarea value={text} onChange={e=>setText(e.target.value)}
            placeholder="Paste your bank statement CSV or text here..."
            style={{ width:'100%', height:200, background:'var(--bg-card)', border:'1px solid var(--border-bright)', color:'var(--text-primary)', borderRadius:10, padding:'12px 14px', fontSize:12, fontFamily:'JetBrains Mono,monospace', resize:'vertical', outline:'none', lineHeight:1.6 }}
          />
          <button onClick={()=>setText(SAMPLE)} style={{ marginTop:6, background:'transparent', border:'1px solid var(--border)', color:'var(--text-muted)', padding:'4px 10px', borderRadius:6, fontSize:11, fontFamily:'JetBrains Mono,monospace', cursor:'pointer' }}>
            Load sample data
          </button>
        </div>
      )}

      <button
        onClick={() => {
          if (isCibil) return onAnalyze && onAnalyze(cibilFile, cibilPassword)
          if (textMode) return onTextAnalyze && onTextAnalyze(text)
          return onAnalyze && onAnalyze(file)
        }}
        disabled={!canSubmit}
        style={{ width:'100%', marginTop:14, padding:'13px 24px', background:canSubmit?'var(--blue)':'var(--bg-card)', color:canSubmit?'#fff':'var(--text-muted)', border:'none', borderRadius:10, fontSize:15, fontWeight:600, cursor:canSubmit?'pointer':'not-allowed', transition:'all .2s' }}>
        {isCibil ? 'Analyze CIBIL →' : 'Analyze Statement →'}
      </button>

      <div style={{ marginTop:28, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        {[
          ...(isCibil ? [
            {icon:'👤',label:'Personal Info',desc:'Name, DOB, address, company'},
            {icon:'✅',label:'CIBIL Score',desc:'Score, report date, DPD'},
            {icon:'🏦',label:'Active Loans',desc:'EMI, balances, delinquencies'},
            {icon:'🔎',label:'Enquiries',desc:'Recent and total enquiries'},
            {icon:'⚠️',label:'Risk Flags',desc:'DPD, overdue, adverse flags'},
            {icon:'🔒',label:'Password PDF',desc:'Supports locked PDFs'},
          ] : [
            {icon:'💰',label:'Salary & PF',desc:'Employer, EPFO credits'},
            {icon:'🏦',label:'Loan EMIs',desc:'NACH, SMFG, Piramal etc'},
            {icon:'📱',label:'App Loans',desc:'KreditBee, LazyPay, Navi'},
            {icon:'📈',label:'SIP / MF',desc:'Groww, Zerodha, CAMS'},
            {icon:'🏠',label:'Rent',desc:'House, PG, flat payments'},
            {icon:'⚡',label:'Utilities',desc:'Electric, gas, OTT, mobile'},
          ])
        ].map(f=>(
          <div key={f.label} className="card" style={{padding:'10px 12px'}}>
            <div style={{fontSize:16,marginBottom:3}}>{f.icon}</div>
            <div style={{fontSize:12,fontWeight:500,color:'var(--text-primary)',marginBottom:2}}>{f.label}</div>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
