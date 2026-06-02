import { useMemo, useState } from 'react'
const f = n => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—'
const badge = (label, color='blue') => <span className={`badge badge-${color}`}>{label}</span>

export default function CreditsTab({ a }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('date_desc')
  const [cat, setCat] = useState('ALL')

  const allCredits = [
    ...a.salary.map(x=>({...x,category:'Salary',color:'green'})),
    ...(a.pf_credits||[]).map(x=>({...x,category:'PF/EPFO',color:'teal'})),
    ...(a.loan_disbursements||[]).map(x=>({...x,amount:x.amount,category:'Loan Disbursement',color:'amber'})),
    ...a.other_income.filter(x=>x.type!=='pf'&&x.type!=='loan_credit').map(x=>({...x,category:x.type||'Other',color:'blue'})),
  ].sort((a,b)=>new Date(b.date)-new Date(a.date))

  const norm = v => (v ?? '').toString().toLowerCase()
  const cats = useMemo(() => Array.from(new Set(allCredits.map(x => x.category || 'Other'))).sort(), [allCredits])

  const sorters = {
    date_desc: (x, y) => new Date(y.date) - new Date(x.date),
    date_asc: (x, y) => new Date(x.date) - new Date(y.date),
    amount_desc: (x, y) => (y.amount || 0) - (x.amount || 0),
    amount_asc: (x, y) => (x.amount || 0) - (y.amount || 0),
    cat_asc: (x, y) => norm(x.category).localeCompare(norm(y.category)),
  }

  const rows = useMemo(() => {
    const q = norm(query).trim()
    return allCredits
      .filter(r => cat === 'ALL' ? true : (r.category || 'Other') === cat)
      .filter(r => !q || `${r.date} ${r.category} ${r.employer} ${r.description} ${r.lender} ${r.amount} ${r.utr} ${r.reference_id}`.toLowerCase().includes(q))
      .slice()
      .sort(sorters[sort] || sorters.date_desc)
  }, [allCredits, query, sort, cat])

  const total = rows.reduce((s,x)=>s+(x.amount||0),0)

  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <div>
          <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>All Credits & Income</div>
          <div style={{fontSize:14,color:'var(--text-muted)',marginTop:2}}>{rows.length} credit transactions</div>
        </div>
        <div style={{fontSize:20,fontWeight:700,color:'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>{f(total)}</div>
      </div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <input className="ctrl" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search credits..." style={{minWidth:240}} />
          <select className="ctrl" value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="date_desc">Date ↓</option>
            <option value="date_asc">Date ↑</option>
            <option value="amount_desc">Amount ↓</option>
            <option value="amount_asc">Amount ↑</option>
            <option value="cat_asc">Category A→Z</option>
          </select>
          <select className="ctrl" value={cat} onChange={e=>setCat(e.target.value)}>
            <option value="ALL">All categories</option>
            {cats.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button className="ctrl-btn" onClick={()=>{ setQuery(''); setSort('date_desc'); setCat('ALL') }}>Reset</button>
      </div>
      {rows.length>0 ? (
        <table>
          <thead><tr><th>Date</th><th>Description / Employer</th><th>Category</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
          <tbody>
            {rows.map((x,i)=>(
              <tr key={i}>
                <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,whiteSpace:'nowrap'}}>{x.date}</td>
                <td style={{color:'var(--text-primary)',maxWidth:320}}>
                  <div style={{fontWeight:500}}>{x.employer||x.description||x.lender||'—'}</div>
                  {x.description&&x.employer&&<div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{x.description.slice(0,80)}</div>}
                </td>
                <td>{badge(x.category,x.color)}</td>
                <td style={{textAlign:'right'}}><span className="amount-credit">{f(x.amount)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text-muted)',fontSize:13}}>No credit transactions found</div>}
    </div>
  )
}
