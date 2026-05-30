import { useMemo, useState } from 'react'
const f = n => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

export default function AppLoansTab({ a }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('date_desc')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [appFilter, setAppFilter] = useState('ALL')

  const norm = v => (v ?? '').toString().toLowerCase()
  const raw = a.app_loans || []

  const apps = useMemo(() => Array.from(new Set(raw.map(x => x.app_name || '—'))).sort(), [raw])

  const sorters = {
    date_desc: (x, y) => new Date(y.date) - new Date(x.date),
    date_asc: (x, y) => new Date(x.date) - new Date(y.date),
    amount_desc: (x, y) => (y.amount || 0) - (x.amount || 0),
    amount_asc: (x, y) => (x.amount || 0) - (y.amount || 0),
    app_asc: (x, y) => norm(x.app_name).localeCompare(norm(y.app_name)),
  }

  const loans = useMemo(() => {
    const q = norm(query).trim()
    return raw
      .filter(r => typeFilter === 'ALL' ? true : (r.type || '') === typeFilter)
      .filter(r => appFilter === 'ALL' ? true : (r.app_name || '—') === appFilter)
      .filter(r => !q || `${r.date} ${r.app_name} ${r.type} ${r.description} ${r.amount}`.toLowerCase().includes(q))
      .slice()
      .sort(sorters[sort] || sorters.date_desc)
  }, [raw, query, sort, typeFilter, appFilter])

  const total = loans.reduce((s,x)=>s+(x.amount||0),0)
  const repayments = loans.filter(x=>x.type==='repayment')
  const credits = loans.filter(x=>x.type==='credit')

  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
        <div>
          <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>Mobile App Loans</div>
          <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>KreditBee · LazyPay · Navi · mPokket · CASHe · EarlySalary · Finagle & more</div>
        </div>
        <div style={{fontSize:20,fontWeight:700,color:'var(--purple)',fontFamily:'JetBrains Mono,monospace'}}>{f(total)}</div>
      </div>

      {loans.length>0 ? (
        <>
          <div style={{background:'rgba(168,85,247,.06)',border:'1px solid rgba(168,85,247,.15)',borderRadius:10,padding:'12px 16px',marginBottom:18,fontSize:13,color:'var(--text-secondary)'}}>
            ⚠ App loans typically carry <strong>24–48% APR</strong>. Multiple app loans may indicate cash flow stress or debt trap patterns.
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
              <input className="ctrl" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search..." style={{minWidth:240}} />
              <select className="ctrl" value={sort} onChange={e=>setSort(e.target.value)}>
                <option value="date_desc">Date ↓</option>
                <option value="date_asc">Date ↑</option>
                <option value="amount_desc">Amount ↓</option>
                <option value="amount_asc">Amount ↑</option>
                <option value="app_asc">App A→Z</option>
              </select>
              <select className="ctrl" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
                <option value="ALL">All types</option>
                <option value="repayment">repayment</option>
                <option value="credit">credit</option>
              </select>
              <select className="ctrl" value={appFilter} onChange={e=>setAppFilter(e.target.value)}>
                <option value="ALL">All apps</option>
                {apps.map(app => <option key={app} value={app}>{app}</option>)}
              </select>
            </div>
            <button className="ctrl-btn" onClick={()=>{ setQuery(''); setSort('date_desc'); setTypeFilter('ALL'); setAppFilter('ALL') }}>Reset</button>
          </div>
          <table>
            <thead><tr><th>Date</th><th>App / Lender</th><th>Type</th><th>Description</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {loans.map((x,i)=>(
                <tr key={i}>
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12}}>{x.date}</td>
                  <td style={{color:'var(--purple)',fontWeight:500}}>{x.app_name}</td>
                  <td><span className={`badge badge-${x.type==='credit'?'green':'red'}`}>{x.type}</span></td>
                  <td style={{fontSize:11,color:'var(--text-muted)',maxWidth:200}}>{(x.description||'').slice(0,60)}</td>
                  <td style={{textAlign:'right'}}><span className={x.type==='credit'?'amount-credit':'amount-debit'}>{f(x.amount)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{marginTop:16,display:'flex',gap:12}}>
            <div style={{flex:1,background:'var(--bg-secondary)',borderRadius:8,padding:'10px 14px'}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Total Repaid</div>
              <div style={{fontSize:15,fontWeight:600,color:'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{f(repayments.reduce((s,x)=>s+x.amount,0))}</div>
            </div>
            <div style={{flex:1,background:'var(--bg-secondary)',borderRadius:8,padding:'10px 14px'}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Total Received</div>
              <div style={{fontSize:15,fontWeight:600,color:'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>{f(credits.reduce((s,x)=>s+x.amount,0))}</div>
            </div>
            <div style={{flex:1,background:'var(--bg-secondary)',borderRadius:8,padding:'10px 14px'}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Unique Apps</div>
              <div style={{fontSize:15,fontWeight:600,color:'var(--purple)',fontFamily:'JetBrains Mono,monospace'}}>{new Set(loans.map(x=>x.app_name)).size}</div>
            </div>
          </div>
        </>
      ) : (
        <div style={{textAlign:'center',padding:'48px 20px',color:'var(--text-muted)',fontSize:13}}>
          <div style={{fontSize:32,marginBottom:12}}>✓</div>
          No mobile app loan transactions detected — good financial hygiene!
        </div>
      )}
    </div>
  )
}
