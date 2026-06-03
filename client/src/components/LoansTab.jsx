import { useMemo, useState } from 'react'
const f = n => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—'
const TYPE_COLOR = {HL:'blue',AL:'amber',PL:'red',EL:'teal',BL:'purple',GL:'amber',OTHER:'gray'}

export default function LoansTab({ a }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('date_desc')
  const [typeFilter, setTypeFilter] = useState('ALL')

  const norm = v => (v ?? '').toString().toLowerCase()
  const baseLoans = a.loans || []
  const types = useMemo(() => Array.from(new Set(baseLoans.map(x => x.type || 'OTHER'))).sort(), [baseLoans])

  const sorters = {
    date_desc: (x, y) => new Date(y.date) - new Date(x.date),
    date_asc: (x, y) => new Date(x.date) - new Date(y.date),
    amount_desc: (x, y) => (y.emi_amount || 0) - (x.emi_amount || 0),
    amount_asc: (x, y) => (x.emi_amount || 0) - (y.emi_amount || 0),
    lender_asc: (x, y) => norm(x.bank).localeCompare(norm(y.bank)),
  }

  const loans = useMemo(() => {
    const q = norm(query).trim()
    return baseLoans
      .filter(r => typeFilter === 'ALL' ? true : (r.type || 'OTHER') === typeFilter)
      .filter(r => !q || `${r.date} ${r.bank} ${r.type} ${r.description} ${r.emi_amount}`.toLowerCase().includes(q))
      .slice()
      .sort(sorters[sort] || sorters.date_desc)
  }, [baseLoans, query, sort, typeFilter])

  const apy = a.apy_pension||[]
  const cc = a.credit_card_payments||[]
  const totalEMI = loans.reduce((s,x)=>s+(x.emi_amount||0),0)
  const totalAPY = apy.reduce((s,x)=>s+x.amount,0)

  // Unique banks
  const uniqueLoans = {}
  for (const l of loans) {
    if (!uniqueLoans[l.bank]) uniqueLoans[l.bank] = {...l, count:1}
    else uniqueLoans[l.bank].count++
  }

  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:18}}>
        <div>
          <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>Loan EMIs & Obligations</div>
          <div style={{fontSize:14,color:'var(--text-muted)',marginTop:2}}>{loans.length} EMI debits across {Object.keys(uniqueLoans).length} lenders</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:20,fontWeight:700,color:'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{f(totalEMI+totalAPY)}</div>
          <div style={{fontSize:11,color:'var(--text-muted)'}}>monthly obligations</div>
        </div>
      </div>

      <div style={{marginBottom:20,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
        {Object.values(uniqueLoans).map(l=>(
          <div key={l.bank} style={{background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.15)',borderRadius:10,padding:'14px 16px'}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>{l.bank}</div>
            <div style={{fontSize:20,fontWeight:700,color:'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{f(l.emi_amount)}</div>
            <div style={{display:'flex',gap:6,marginTop:6}}>
              <span className={`badge badge-${TYPE_COLOR[l.type]||'blue'}`}>{l.type}</span>
              <span style={{fontSize:11,color:'var(--text-muted)'}}>×{l.count} debits</span>
            </div>
          </div>
        ))}
        {apy.length>0&&(
          <div style={{background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.15)',borderRadius:10,padding:'14px 16px'}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>Atal Pension Yojana</div>
            <div style={{fontSize:20,fontWeight:700,color:'var(--amber)',fontFamily:'JetBrains Mono,monospace'}}>{f(apy[0]?.amount)}</div>
            <div style={{display:'flex',gap:6,marginTop:6}}>
              <span className="badge badge-amber">govt pension</span>
              <span style={{fontSize:11,color:'var(--text-muted)'}}>×{apy.length}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{fontSize:14,fontWeight:500,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8}}>All EMI Transactions</div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <input className="ctrl" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search EMI..." style={{minWidth:240}} />
          <select className="ctrl" value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="date_desc">Date ↓</option>
            <option value="date_asc">Date ↑</option>
            <option value="amount_desc">Amount ↓</option>
            <option value="amount_asc">Amount ↑</option>
            <option value="lender_asc">Lender A→Z</option>
          </select>
          <select className="ctrl" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
            <option value="ALL">All types</option>
            {types.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button className="ctrl-btn" onClick={()=>{ setQuery(''); setSort('date_desc'); setTypeFilter('ALL') }}>Reset</button>
      </div>
      <table>
        <thead><tr><th></th><th>Lender</th><th>Type</th><th>Description</th><th>Date</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
        <tbody>
          {loans.map((l,i)=>(
            <tr key={i}>
              <td className="col-icon"><div className="icon-circle blue">🏦</div></td>
              <td className="col-name">{l.bank}<div className="cell-sub">{l.type || 'EMI'}</div></td>
              <td><span className={`badge badge-${TYPE_COLOR[l.type]||'blue'}`}>{l.type}</span></td>
              <td className="col-desc">{(l.description||'').slice(0,60)}</td>
              <td className="col-date">{l.date}</td>
              <td className="col-right"><span className="amount-debit">{f(l.emi_amount)}</span></td>
            </tr>
          ))}
          {apy.map((x,i)=>(
            <tr key={`apy-${i}`}>
              <td className="col-icon"><div className="icon-circle amber">💰</div></td>
              <td className="col-name">Atal Pension Yojana<div className="cell-sub">Pension</div></td>
              <td><span className="badge badge-amber">pension</span></td>
              <td className="col-desc">{(x.description||'').slice(0,60)}</td>
              <td className="col-date">{x.date}</td>
              <td className="col-right"><span className="amount-invest">{f(x.amount)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      {cc.length>0&&(
        <>
          <div style={{fontSize:14,fontWeight:500,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.07em',margin:'20px 0 8px'}}>Credit Card Payments</div>
          <table>
            <thead><tr><th></th><th>Description</th><th>Date</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {cc.map((x,i)=>(
                <tr key={i}>
                  <td className="col-icon"><div className="icon-circle red">💳</div></td>
                  <td className="col-name">{x.description.slice(0,80)}<div className="cell-sub">Credit Card Payment</div></td>
                  <td className="col-date">{x.date}</td>
                  <td className="col-right"><span className="amount-debit">{f(x.amount)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
