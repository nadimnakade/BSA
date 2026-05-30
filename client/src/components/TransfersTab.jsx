import { useMemo, useState } from 'react'
const f = n => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

export default function TransfersTab({ a }) {
  const [outQuery, setOutQuery] = useState('')
  const [outSort, setOutSort] = useState('date_desc')
  const [inQuery, setInQuery] = useState('')
  const [inSort, setInSort] = useState('date_desc')

  const norm = v => (v ?? '').toString().toLowerCase()
  const rawOut = a.family_transfers?.out || []
  const rawIn = a.family_transfers?.in || []

  const outSorters = {
    date_desc: (x, y) => new Date(y.date) - new Date(x.date),
    date_asc: (x, y) => new Date(x.date) - new Date(y.date),
    amount_desc: (x, y) => (y.amount || 0) - (x.amount || 0),
    amount_asc: (x, y) => (x.amount || 0) - (y.amount || 0),
  }

  const inSorters = {
    date_desc: (x, y) => new Date(y.date) - new Date(x.date),
    date_asc: (x, y) => new Date(x.date) - new Date(y.date),
    amount_desc: (x, y) => (y.amount || 0) - (x.amount || 0),
    amount_asc: (x, y) => (x.amount || 0) - (y.amount || 0),
  }

  const out = useMemo(() => {
    const q = norm(outQuery).trim()
    return rawOut
      .filter(r => !q || `${r.date} ${r.to} ${r.description} ${r.amount}`.toLowerCase().includes(q))
      .slice()
      .sort(outSorters[outSort] || outSorters.date_desc)
  }, [rawOut, outQuery, outSort])

  const inn = useMemo(() => {
    const q = norm(inQuery).trim()
    return rawIn
      .filter(r => !q || `${r.date} ${r.from} ${r.description} ${r.amount}`.toLowerCase().includes(q))
      .slice()
      .sort(inSorters[inSort] || inSorters.date_desc)
  }, [rawIn, inQuery, inSort])

  const totalOut = out.reduce((s,x)=>s+(x.amount||0),0)
  const totalIn = inn.reduce((s,x)=>s+(x.amount||0),0)
  const net = totalIn - totalOut

  return (
    <div style={{padding:24}}>
      <div style={{marginBottom:18}}>
        <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>Family / Internal Transfers</div>
        <div style={{fontSize:12,color:'var(--text-muted)'}}>Transfers to/from NISHIKANT HIRE and related accounts</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:24}}>
        <div style={{background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.15)',borderRadius:10,padding:'14px 16px'}}>
          <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Total Sent Out</div>
          <div style={{fontSize:20,fontWeight:700,color:'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{f(totalOut)}</div>
          <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>{out.length} transactions</div>
        </div>
        <div style={{background:'rgba(34,197,94,.06)',border:'1px solid rgba(34,197,94,.15)',borderRadius:10,padding:'14px 16px'}}>
          <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Total Received</div>
          <div style={{fontSize:20,fontWeight:700,color:'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>{f(totalIn)}</div>
          <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>{inn.length} transactions</div>
        </div>
        <div style={{background:'var(--bg-secondary)',borderRadius:10,padding:'14px 16px'}}>
          <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Net Flow</div>
          <div style={{fontSize:20,fontWeight:700,color:net>=0?'var(--green)':'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{net>=0?'+':''}{f(Math.abs(net))}</div>
          <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>{net>=0?'Net inflow':'Net outflow'}</div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <div>
          <div style={{fontSize:11,fontWeight:500,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8}}>Outgoing Transfers ({out.length})</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
              <input className="ctrl" value={outQuery} onChange={e=>setOutQuery(e.target.value)} placeholder="Search outgoing..." style={{minWidth:220}} />
              <select className="ctrl" value={outSort} onChange={e=>setOutSort(e.target.value)}>
                <option value="date_desc">Date ↓</option>
                <option value="date_asc">Date ↑</option>
                <option value="amount_desc">Amount ↓</option>
                <option value="amount_asc">Amount ↑</option>
              </select>
            </div>
            <button className="ctrl-btn" onClick={()=>{ setOutQuery(''); setOutSort('date_desc') }}>Reset</button>
          </div>
          <table>
            <thead><tr><th>Date</th><th>To</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {out.map((x,i)=>(
                <tr key={i}>
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:11}}>{x.date}</td>
                  <td style={{fontSize:12,color:'var(--text-secondary)',maxWidth:160}}>{x.description?.slice(0,50)||x.to}</td>
                  <td style={{textAlign:'right'}}><span className="amount-debit">{f(x.amount)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:500,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8}}>Incoming Transfers ({inn.length})</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
              <input className="ctrl" value={inQuery} onChange={e=>setInQuery(e.target.value)} placeholder="Search incoming..." style={{minWidth:220}} />
              <select className="ctrl" value={inSort} onChange={e=>setInSort(e.target.value)}>
                <option value="date_desc">Date ↓</option>
                <option value="date_asc">Date ↑</option>
                <option value="amount_desc">Amount ↓</option>
                <option value="amount_asc">Amount ↑</option>
              </select>
            </div>
            <button className="ctrl-btn" onClick={()=>{ setInQuery(''); setInSort('date_desc') }}>Reset</button>
          </div>
          <table>
            <thead><tr><th>Date</th><th>From</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {inn.map((x,i)=>(
                <tr key={i}>
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:11}}>{x.date}</td>
                  <td style={{fontSize:12,color:'var(--text-secondary)',maxWidth:160}}>{x.description?.slice(0,50)||x.from}</td>
                  <td style={{textAlign:'right'}}><span className="amount-credit">{f(x.amount)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
