import { useMemo, useState } from 'react'
const f = n => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

export default function InvestmentsTab({ a, onTx }) {
  const [sipQuery, setSipQuery] = useState('')
  const [sipSort, setSipSort] = useState('date_desc')
  const [sipPlatform, setSipPlatform] = useState('ALL')
  const [insQuery, setInsQuery] = useState('')
  const [insSort, setInsSort] = useState('date_desc')
  const [insType, setInsType] = useState('ALL')

  const norm = v => (v ?? '').toString().toLowerCase()

  const sipsRaw = a.sip_investments || []
  const insRaw = a.insurance || []

  const sipSorters = {
    date_desc: (x, y) => new Date(y.date) - new Date(x.date),
    date_asc: (x, y) => new Date(x.date) - new Date(y.date),
    amount_desc: (x, y) => (y.amount || 0) - (x.amount || 0),
    amount_asc: (x, y) => (x.amount || 0) - (y.amount || 0),
    platform_asc: (x, y) => norm(x.platform).localeCompare(norm(y.platform)),
  }

  const insSorters = {
    date_desc: (x, y) => new Date(y.date) - new Date(x.date),
    date_asc: (x, y) => new Date(x.date) - new Date(y.date),
    amount_desc: (x, y) => (y.amount || 0) - (x.amount || 0),
    amount_asc: (x, y) => (x.amount || 0) - (y.amount || 0),
    provider_asc: (x, y) => norm(x.provider).localeCompare(norm(y.provider)),
  }

  const sipPlatforms = useMemo(() => Array.from(new Set(sipsRaw.map(x => x.platform || 'MF'))).sort(), [sipsRaw])
  const insTypes = useMemo(() => Array.from(new Set(insRaw.map(x => x.policy_type || 'insurance'))).sort(), [insRaw])

  const sips = useMemo(() => {
    const q = norm(sipQuery).trim()
    return sipsRaw
      .filter(r => sipPlatform === 'ALL' ? true : (r.platform || 'MF') === sipPlatform)
      .filter(r => !q || `${r.date} ${r.fund_name} ${r.platform} ${r.amount}`.toLowerCase().includes(q))
      .slice()
      .sort(sipSorters[sipSort] || sipSorters.date_desc)
  }, [sipsRaw, sipQuery, sipSort, sipPlatform])

  const ins = useMemo(() => {
    const q = norm(insQuery).trim()
    return insRaw
      .filter(r => insType === 'ALL' ? true : (r.policy_type || 'insurance') === insType)
      .filter(r => !q || `${r.date} ${r.provider} ${r.policy_type} ${r.description} ${r.amount}`.toLowerCase().includes(q))
      .slice()
      .sort(insSorters[insSort] || insSorters.date_desc)
  }, [insRaw, insQuery, insSort, insType])

  const sipTotal = sips.reduce((s,x)=>s+(x.amount||0),0)
  const insTotal = ins.reduce((s,x)=>s+(x.amount||0),0)

  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:18}}>
        <div>
          <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>Investments & Insurance</div>
          <div style={{fontSize:14,color:'var(--text-muted)',marginTop:2}}>Mutual Fund SIPs + Insurance Premiums</div>
        </div>
        <div style={{fontSize:20,fontWeight:700,color:'var(--amber)',fontFamily:'JetBrains Mono,monospace'}}>{f(sipTotal+insTotal)}</div>
      </div>

      {sips.length>0 ? (
        <>
          <div style={{fontSize:11,fontWeight:500,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8}}>SIP / Mutual Fund Investments</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
              <input className="ctrl" value={sipQuery} onChange={e=>setSipQuery(e.target.value)} placeholder="Search SIP..." style={{minWidth:240}} />
              <select className="ctrl" value={sipSort} onChange={e=>setSipSort(e.target.value)}>
                <option value="date_desc">Date ↓</option>
                <option value="date_asc">Date ↑</option>
                <option value="amount_desc">Amount ↓</option>
                <option value="amount_asc">Amount ↑</option>
                <option value="platform_asc">Platform A→Z</option>
              </select>
              <select className="ctrl" value={sipPlatform} onChange={e=>setSipPlatform(e.target.value)}>
                <option value="ALL">All platforms</option>
                {sipPlatforms.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button className="ctrl-btn" onClick={()=>{ setSipQuery(''); setSipSort('date_desc'); setSipPlatform('ALL') }}>Reset</button>
          </div>
          <table style={{marginBottom:24}}>
            <thead><tr><th></th><th>Fund / Platform</th><th>Platform</th><th>Date</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {sips.map((x,i)=>(
                <tr key={i} onClick={()=>onTx && onTx(x)} style={{cursor:onTx?'pointer':'default'}}>
                  <td className="col-icon"><div className="icon-circle amber">📈</div></td>
                  <td className="col-name">{x.fund_name?.slice(0,50)||'—'}<div className="cell-sub">SIP / Mutual Fund</div></td>
                  <td><span className="badge badge-amber">{x.platform||'MF'}</span></td>
                  <td className="col-date">{x.date}</td>
                  <td className="col-right"><span className="amount-invest">{f(x.amount)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div style={{background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.2)',borderRadius:10,padding:'16px 18px',marginBottom:20}}>
          <div style={{color:'var(--amber)',fontWeight:500,marginBottom:4}}>⚠ No SIP/Mutual Fund investments detected</div>
          <div style={{fontSize:13,color:'var(--text-secondary)'}}>Consider starting a SIP — even ₹500/month in index funds builds long-term wealth through compounding.</div>
        </div>
      )}

      {ins.length>0 ? (
        <>
          <div style={{fontSize:11,fontWeight:500,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8}}>Insurance Premiums</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
              <input className="ctrl" value={insQuery} onChange={e=>setInsQuery(e.target.value)} placeholder="Search insurance..." style={{minWidth:240}} />
              <select className="ctrl" value={insSort} onChange={e=>setInsSort(e.target.value)}>
                <option value="date_desc">Date ↓</option>
                <option value="date_asc">Date ↑</option>
                <option value="amount_desc">Amount ↓</option>
                <option value="amount_asc">Amount ↑</option>
                <option value="provider_asc">Provider A→Z</option>
              </select>
              <select className="ctrl" value={insType} onChange={e=>setInsType(e.target.value)}>
                <option value="ALL">All types</option>
                {insTypes.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button className="ctrl-btn" onClick={()=>{ setInsQuery(''); setInsSort('date_desc'); setInsType('ALL') }}>Reset</button>
          </div>
          <table>
            <thead><tr><th></th><th>Provider</th><th>Policy Type</th><th>Date</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {ins.map((x,i)=>(
                <tr key={i} onClick={()=>onTx && onTx(x)} style={{cursor:onTx?'pointer':'default'}}>
                  <td className="col-icon"><div className="icon-circle teal">🛡️</div></td>
                  <td className="col-name">{x.provider}<div className="cell-sub">Insurance Premium</div></td>
                  <td><span className="badge badge-teal">{x.policy_type}</span></td>
                  <td className="col-date">{x.date}</td>
                  <td className="col-right"><span className="amount-invest">{f(x.amount)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div style={{background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.2)',borderRadius:10,padding:'16px 18px'}}>
          <div style={{color:'var(--red)',fontWeight:500,marginBottom:4}}>⚠ No insurance premiums detected</div>
          <div style={{fontSize:13,color:'var(--text-secondary)'}}>Get term life insurance (₹1Cr cover ~₹700/month) and health insurance to protect your finances.</div>
        </div>
      )}
    </div>
  )
}
