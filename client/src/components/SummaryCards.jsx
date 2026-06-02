const f = n => n ? (n>=100000?`₹${(n/100000).toFixed(2)}L`:n>=1000?`₹${(n/1000).toFixed(1)}K`:`₹${n.toFixed(0)}`) : '₹0'

export default function SummaryCards({ a }) {
  const safeA = a || {}
  const ins = safeA.insights || {}
  const salaryTotal = (safeA.salary||[]).reduce((s,x)=>s+(x.amount||0),0)
  const loanTotal = (safeA.loans||[]).reduce((s,x)=>s+((x.emi_amount||0)),0)
  const sipTotal = (safeA.sip_investments||[]).reduce((s,x)=>s+(x.amount||0),0)
  const appTotal = (safeA.app_loans||[]).reduce((s,x)=>s+(x.amount||0),0)
  const pfTotal = (safeA.pf_credits||[]).reduce((s,x)=>s+(x.amount||0),0)
  const transferOut = (safeA.family_transfers?.out||[]).reduce((s,x)=>s+(x.amount||0),0)
  const ratio = ins.obligation_to_income_ratio
  const ratioColor = ratio>60?'var(--red)':ratio>40?'var(--amber)':'var(--green)'
  const savRate = ins.savings_rate
  const savColor = savRate>20?'var(--green)':savRate>5?'var(--amber)':'var(--red)'

  const accountSummary = safeA.account_summary || {}
  const cards = [
    {label:'Total Credits',value:f(accountSummary.total_credits),sub:`Salary: ${f(salaryTotal)}`,color:'var(--green)'},
    {label:'Total Debits',value:f(accountSummary.total_debits),sub:`EMIs: ${f(loanTotal)}`,color:'var(--red)'},
    {label:'Net Position',value:f(Math.abs(accountSummary.net_balance||0)),sub:(accountSummary.net_balance||0)>=0?'Surplus':'Deficit',color:(accountSummary.net_balance||0)>=0?'var(--green)':'var(--red)'},
    {label:'Avg Monthly Salary',value:f(ins.avg_monthly_salary),sub:`${(safeA.salary||[]).length} salary credits`,color:'var(--green)'},
    {label:'Total EMI/Month',value:f(ins.total_emi_monthly),sub:`${(safeA.loans||[]).length} active loans`,color:'var(--red)'},
    {label:'Obligation Ratio',value:`${ratio}%`,sub:ratio>60?'⚠ Critical':ratio>40?'! Moderate':'✓ Healthy',color:ratioColor},
    {label:'Savings Rate',value:`${Math.max(0,savRate)}%`,sub:savRate>20?'Excellent':savRate>10?'Fair':'Low',color:savColor},
    {label:'PF Credits',value:f(pfTotal),sub:`${(safeA.pf_credits||[]).length} credit(s)`,color:'var(--teal)'},
    {label:'SIP / Investments',value:sipTotal>0?f(sipTotal):'None',sub:`${(safeA.sip_investments||[]).length} SIPs`,color:'var(--amber)'},
    {label:'App Loan Payments',value:appTotal>0?f(appTotal):'None',sub:`${(safeA.app_loans||[]).length} transaction(s)`,color:appTotal>0?'var(--red)':'var(--text-muted)'},
    {label:'Family Transfers',value:f(transferOut),sub:`${(safeA.family_transfers?.out||[]).length} outflows`,color:'var(--purple)'},
    {label:'Loan Disbursements',value:f((safeA.loan_disbursements||[]).reduce((s,x)=>s+x.amount,0)),sub:`${(safeA.loan_disbursements||[]).length} credit(s)`,color:'var(--blue)'},
  ]

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10, marginBottom:4 }}>
      {cards.map(c => (
        <div key={c.label} className="card" style={{ padding:'14px 16px' }}>
          <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{c.label}</div>
          <div style={{ fontSize:20, fontWeight:600, color:c.color, fontFamily:'JetBrains Mono,monospace', marginBottom:3 }}>{c.value}</div>
          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{c.sub}</div>
        </div>
      ))}
    </div>
  )
}
