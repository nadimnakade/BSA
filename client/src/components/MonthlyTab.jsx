import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'
import { useMemo, useState } from 'react'
const f = n => n>=100000?`₹${(n/100000).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(1)}K`:`₹${n.toFixed(0)}`
const fp = n => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

export default function MonthlyTab({ a }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('month_desc')
  const ms = a.monthly_summary || {}
  const months = Object.keys(ms)

  const chartData = months.map(m => ({
    name: m,
    Credits: Math.round(ms[m].credits),
    Debits: Math.round(ms[m].debits),
    Salary: Math.round(ms[m].salary||0),
    EMI: Math.round(ms[m].emi||0),
  }))

  const rows = useMemo(() => {
    const q = (query || '').toLowerCase().trim()
    const base = months.map(m => {
      const r = ms[m]
      const surplus = (r.credits || 0) - (r.debits || 0)
      return { month: m, ...r, surplus }
    }).filter(r => !q || `${r.month} ${r.credits} ${r.debits} ${r.salary} ${r.emi} ${r.closing_balance}`.toLowerCase().includes(q))

    const sorters = {
      month_desc: (a, b) => a.month.localeCompare(b.month),
      month_asc: (a, b) => b.month.localeCompare(a.month),
      surplus_desc: (a, b) => (b.surplus || 0) - (a.surplus || 0),
      surplus_asc: (a, b) => (a.surplus || 0) - (b.surplus || 0),
      credits_desc: (a, b) => (b.credits || 0) - (a.credits || 0),
      debits_desc: (a, b) => (b.debits || 0) - (a.debits || 0),
    }

    return base.slice().sort(sorters[sort] || sorters.month_desc)
  }, [months, ms, query, sort])

  const Tip = ({active,payload,label}) => active&&payload?.length ? (
    <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',fontSize:14}}>
      <div style={{color:'var(--text-primary)',fontWeight:500,marginBottom:6}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{color:p.fill,fontFamily:'JetBrains Mono,monospace',marginBottom:2}}>{p.name}: {f(p.value)}</div>
      ))}
    </div>
  ) : null

  return (
    <div style={{padding:24}}>
      <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)',marginBottom:18}}>Month-by-Month Breakdown</div>
      {chartData.length>0 && (
        <div style={{marginBottom:28}}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={20}>
              <XAxis dataKey="name" tick={{fontSize:11,fill:'var(--text-secondary)'}} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={f} tick={{fontSize:10,fill:'var(--text-secondary)'}} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} cursor={{fill:'rgba(255,255,255,.04)'}} />
              <Legend formatter={v=><span style={{fontSize:11,color:'var(--text-secondary)'}}>{v}</span>} />
              <Bar dataKey="Credits" fill="#22c55e" radius={[3,3,0,0]} />
              <Bar dataKey="Debits" fill="#ef4444" radius={[3,3,0,0]} />
              <Bar dataKey="Salary" fill="#3b82f6" radius={[3,3,0,0]} />
              <Bar dataKey="EMI" fill="#f59e0b" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <input className="ctrl" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search month..." style={{minWidth:240}} />
          <select className="ctrl" value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="month_desc">Month ↓</option>
            <option value="month_asc">Month ↑</option>
            <option value="surplus_desc">Surplus ↓</option>
            <option value="surplus_asc">Surplus ↑</option>
            <option value="credits_desc">Credits ↓</option>
            <option value="debits_desc">Debits ↓</option>
          </select>
        </div>
        <button className="ctrl-btn" onClick={()=>{ setQuery(''); setSort('month_desc') }}>Reset</button>
      </div>
      <table>
        <thead>
          <tr>
            <th></th><th>Month</th><th>Salary</th><th>Total Credits</th><th>Total Debits</th>
            <th>EMIs</th><th>Transfers Out</th><th>Closing Bal</th><th>Surplus</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r=>{
            const surplus = r.surplus || 0
            return (
              <tr key={r.month}>
                <td className="col-icon"><div className="icon-circle blue">📅</div></td>
                <td className="col-name">{r.month}<div className="cell-sub">Monthly Summary</div></td>
                <td><span className="amount-credit">{fp(r.salary)}</span></td>
                <td><span className="amount-credit">{fp(r.credits)}</span></td>
                <td><span className="amount-debit">{fp(r.debits)}</span></td>
                <td><span className="amount-debit">{fp(r.emi)}</span></td>
                <td className="col-right"><span style={{color:'var(--purple)',fontFamily:'JetBrains Mono,monospace',fontSize:13}}>{fp(r.transfers_out)}</span></td>
                <td className="col-right" style={{fontFamily:'JetBrains Mono,monospace',fontSize:13,color:'var(--text-secondary)'}}>{fp(r.closing_balance)}</td>
                <td className="col-right"><span style={{fontFamily:'JetBrains Mono,monospace',fontSize:13,color:surplus>=0?'var(--green)':'var(--red)',fontWeight:500}}>{surplus>=0?'+':''}{fp(surplus)}</span></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
