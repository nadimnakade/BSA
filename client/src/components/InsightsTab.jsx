import { useMemo, useState } from 'react'
const f = n => n ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0'
const badge = (label, color='blue') => <span className={`badge badge-${color}`}>{label}</span>

export default function InsightsTab({ a, onTx }) {
  const [disbQuery, setDisbQuery] = useState('')
  const [disbSort, setDisbSort] = useState('date_desc')
  const [disbType, setDisbType] = useState('ALL')

  const norm = v => (v ?? '').toString().toLowerCase()
  const ins = a.insights
  const as = a.account_summary
  const loanT = a.loans.reduce((s,x)=>s+(x.emi_amount||0),0)
  const rentT = a.rent.reduce((s,x)=>s+x.amount,0)
  const appT = a.app_loans.reduce((s,x)=>s+x.amount,0)
  const sipT = a.sip_investments.reduce((s,x)=>s+x.amount,0)
  const insT = a.insurance.reduce((s,x)=>s+x.amount,0)
  const apyT = (a.apy_pension||[]).reduce((s,x)=>s+x.amount,0)
  const ratio = ins.obligation_to_income_ratio
  const ratioColor = ratio>60?'#E24B4A':ratio>40?'#EF9F27':'#22c55e'
  const savRate = Math.max(0, ins.savings_rate)
  const savColor = savRate>20?'#22c55e':savRate>5?'#EF9F27':'#E24B4A'

  const metrics = [
    {label:'Obligation-to-Income Ratio',value:`${ratio}%`,progress:Math.min(ratio,100),color:ratioColor,status:ratio>60?'Critical ⚠':ratio>40?'Moderate':'Healthy ✓',desc:'(EMIs + Rent + App Loans) ÷ Salary'},
    {label:'Monthly Savings Rate',value:`${savRate}%`,progress:Math.min(savRate,100),color:savColor,status:savRate>20?'Excellent':savRate>10?'Fair':'Low ⚠',desc:'Net surplus as % of income'},
    {label:'Investment Allocation',value:ins.avg_monthly_salary>0?`${Math.round((sipT+insT)/ins.avg_monthly_salary*100)}%`:'0%',progress:ins.avg_monthly_salary>0?Math.min((sipT+insT)/ins.avg_monthly_salary*100,100):0,color:'#f59e0b',status:sipT>0?'Active':'None — start SIP!',desc:'(SIP + Insurance) ÷ Income'},
  ]

  const disbRows = useMemo(() => {
    const sorters = {
      date_desc: (x, y) => new Date(y.date) - new Date(x.date),
      date_asc: (x, y) => new Date(x.date) - new Date(y.date),
      amount_desc: (x, y) => (y.amount || 0) - (x.amount || 0),
      amount_asc: (x, y) => (x.amount || 0) - (y.amount || 0),
      lender_asc: (x, y) => norm(x.lender).localeCompare(norm(y.lender)),
    }
    const q = norm(disbQuery).trim()
    return (a.loan_disbursements || [])
      .filter(r => disbType === 'ALL' ? true : (r.loan_type || 'OTHER') === disbType)
      .filter(r => !q || `${r.date} ${r.lender} ${r.loan_type} ${r.description} ${r.reference_id} ${r.utr} ${r.rrn}`.toLowerCase().includes(q))
      .slice()
      .sort(sorters[disbSort] || sorters.date_desc)
  }, [a.loan_disbursements, disbQuery, disbSort, disbType])

  return (
    <div style={{padding:24}}>
      <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)',marginBottom:20}}>Financial Health Analysis</div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:24}}>
        {metrics.map(m=>(
          <div key={m.label} className="card" style={{padding:16}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.06em'}}>{m.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:m.color,fontFamily:'JetBrains Mono,monospace',marginBottom:8}}>{m.value}</div>
            <div className="progress-bar" style={{marginBottom:8}}>
              <div className="progress-fill" style={{width:`${m.progress}%`,background:m.color}} />
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:11,color:'var(--text-muted)'}}>{m.desc}</span>
              <span style={{fontSize:11,fontWeight:500,color:m.color}}>{m.status}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{background:'var(--bg-secondary)',borderRadius:10,padding:16,marginBottom:20}}>
        <div style={{fontSize:14,fontWeight:600,color:'var(--text-secondary)',marginBottom:12}}>Cash Flow Summary (Avg Monthly)</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
          {[
            {l:'Avg Salary',v:ins.avg_monthly_salary,c:'var(--green)'},
            {l:'EMIs/Month',v:ins.total_emi_monthly,c:'var(--red)'},
            {l:'APY Pension',v:apyT/(Object.keys(a.monthly_summary||{}).length||1),c:'var(--amber)'},
            {l:'Investments',v:(sipT+insT)/(Object.keys(a.monthly_summary||{}).length||1),c:'var(--amber)'},
            {l:'Net Surplus',v:Math.max(0,as.net_balance/(Object.keys(a.monthly_summary||{}).length||1)),c:as.net_balance>=0?'var(--green)':'var(--red)'},
          ].map(x=>(
            <div key={x.l} style={{textAlign:'center'}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>{x.l}</div>
              <div style={{fontSize:14,fontWeight:600,color:x.c,fontFamily:'JetBrains Mono,monospace'}}>{f(x.v)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div>
          <div style={{fontSize:14,fontWeight:600,color:'var(--red)',marginBottom:10}}>⚠ Risk Flags ({ins.risk_flags.length})</div>
          {ins.risk_flags.length>0 ? ins.risk_flags.map((f,i)=>(
            <div key={i} style={{fontSize:14,color:'var(--text-secondary)',marginBottom:8,paddingLeft:12,borderLeft:'2px solid rgba(239,68,68,.5)',lineHeight:1.6}}>{f}</div>
          )) : <div style={{fontSize:14,color:'var(--green)'}}>✓ No major risk flags detected</div>}
        </div>
        <div>
          <div style={{fontSize:14,fontWeight:600,color:'var(--green)',marginBottom:10}}>💡 Recommendations</div>
          {ins.recommendations.length>0 ? ins.recommendations.map((r,i)=>(
            <div key={i} style={{fontSize:14,color:'var(--text-secondary)',marginBottom:8,paddingLeft:12,borderLeft:'2px solid rgba(34,197,94,.5)',lineHeight:1.6}}>{r}</div>
          )) : <div style={{fontSize:14,color:'var(--text-muted)'}}>No recommendations generated</div>}
        </div>
      </div>

      {(a.loan_disbursements||[]).length>0&&(
        <div style={{marginTop:20}}>
          <div style={{fontSize:14,fontWeight:600,color:'var(--amber)',marginBottom:10}}>🏦 Loan Disbursements Detected</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
              <input className="ctrl" value={disbQuery} onChange={e=>setDisbQuery(e.target.value)} placeholder="Search disbursements..." style={{minWidth:240}} />
              <select className="ctrl" value={disbSort} onChange={e=>setDisbSort(e.target.value)}>
                <option value="date_desc">Date ↓</option>
                <option value="date_asc">Date ↑</option>
                <option value="amount_desc">Amount ↓</option>
                <option value="amount_asc">Amount ↑</option>
                <option value="lender_asc">Lender A→Z</option>
              </select>
              <select className="ctrl" value={disbType} onChange={e=>setDisbType(e.target.value)}>
                <option value="ALL">All types</option>
                {Array.from(new Set((a.loan_disbursements||[]).map(x=>x.loan_type||'OTHER'))).sort().map(t=>(
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <button className="ctrl-btn" onClick={()=>{ setDisbQuery(''); setDisbSort('date_desc'); setDisbType('ALL') }}>Reset</button>
          </div>
          <table>
            <thead><tr><th></th><th>Lender</th><th>Loan Type</th><th>Description</th><th>Date</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {disbRows.map((x,i)=>(
                <tr key={i} onClick={()=>onTx && onTx(x)} style={{cursor:onTx?'pointer':'default'}}>
                  <td className="col-icon"><div className="icon-circle blue">🏦</div></td>
                  <td className="col-name">{x.lender}<div className="cell-sub">Loan Disbursement</div></td>
                  <td>{badge(x.loan_type||'—', x.loan_type==='HL'?'blue':x.loan_type==='PL'?'red':x.loan_type==='BL'?'purple':x.loan_type==='GL'?'amber':x.loan_type==='AL'?'amber':x.loan_type==='EL'?'teal':'gray')}</td>
                  <td className="col-desc">{x.description?.slice(0,80)}</td>
                  <td className="col-date">{x.date}</td>
                  <td className="col-right"><span className="amount-credit">{f(x.amount)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
