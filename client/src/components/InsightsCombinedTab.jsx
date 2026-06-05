const f = n => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

export default function InsightsCombinedTab({ a }) {
  const insights = a.insights || {}
  const uw = a.underwriting || {}
  const as = a.account_summary || {}
  const policyFlags = Array.isArray(uw.policy_flags) ? uw.policy_flags : []
  const riskFlags = Array.isArray(insights.risk_flags) ? insights.risk_flags : []
  const recommendations = Array.isArray(insights.recommendations) ? insights.recommendations : []

  const flagLabels = {
    LOW_SCORE: { label: 'Low CIBIL Score', color: 'red', icon: '📉' },
    EXCELLENT_SCORE: { label: 'Excellent Score', color: 'green', icon: '⭐' },
    DPD_30_PLUS: { label: 'DPD 30+', color: 'red', icon: '⚠️' },
    SEVERE_DEROGATORY: { label: 'Severe Derogatory', color: 'red', icon: '🚨' },
    HIGH_ENQUIRIES: { label: 'High Enquiries', color: 'amber', icon: '🔎' },
    HIGH_CC_UTILIZATION: { label: 'High CC Utilization', color: 'amber', icon: '💳' },
    MULTIPLE_BOUNCES: { label: 'Multiple Bounces', color: 'red', icon: '⚠️' },
    HIGH_FOIR: { label: 'High FOIR', color: 'amber', icon: '📊' },
  }

  const riskLabels = {
    HIGH_EMI_RATIO: { label: 'High EMI to Income Ratio', color: 'red' },
    LOW_SAVINGS: { label: 'Low Savings Rate', color: 'amber' },
    FREQUENT_BOUNCES: { label: 'Frequent Bounces', color: 'red' },
    HIGH_UNSECURED: { label: 'High Unsecured Loans', color: 'amber' },
    SALARY_INCONSISTENT: { label: 'Inconsistent Salary', color: 'amber' },
    HIGH_RENT: { label: 'High Rent Burden', color: 'amber' },
  }

  const monthly = a.monthly_summary || {}
  const months = Object.keys(monthly).sort().slice(-6)

  return (
    <div style={{padding:24}}>
      <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)',marginBottom:20}}>Insights & Recommendations</div>

      {policyFlags.length > 0 && (
        <div style={{marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:10}}>Policy Flags (CIBIL + Underwriting)</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {policyFlags.map((flag, i) => {
              const info = flagLabels[flag] || { label: flag, color: 'blue', icon: '📌' }
              return (
                <span key={i} className={`badge badge-${info.color}`} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'5px 10px'}}>
                  <span>{info.icon}</span> {info.label}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {riskFlags.length > 0 && (
        <div style={{marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:600,color:'var(--red)',marginBottom:10}}>Risk Flags</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10}}>
            {riskFlags.map((flag, i) => {
              const info = riskLabels[flag] || { label: flag.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()), color: 'amber' }
              return (
                <div key={i} className="card" style={{padding:12,borderLeft:`3px solid ${info.color==='red'?'#ef4444':'#f59e0b'}`}}>
                  <div style={{fontSize:12,fontWeight:600,color:info.color==='red'?'var(--red)':'var(--amber)'}}>{info.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div style={{marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:600,color:'var(--green)',marginBottom:10}}>Recommendations</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:10}}>
            {recommendations.map((rec, i) => (
              <div key={i} className="card" style={{padding:14,borderLeft:'3px solid #22c55e'}}>
                <div style={{fontSize:12,color:'var(--text-primary)',lineHeight:1.5}}>{rec}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {insights.savings_rate != null && (
        <div style={{marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:10}}>Savings & Income Summary</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
            <div className="card" style={{padding:14}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Avg Monthly Salary</div>
              <div style={{fontSize:16,fontWeight:700,color:'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>{f(insights.avg_monthly_salary)}</div>
            </div>
            <div className="card" style={{padding:14}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Total Monthly EMI</div>
              <div style={{fontSize:16,fontWeight:700,color:'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{f(insights.total_emi_monthly)}</div>
            </div>
            <div className="card" style={{padding:14}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Savings Rate</div>
              <div style={{fontSize:16,fontWeight:700,color:insights.savings_rate>0.2?'var(--green)':insights.savings_rate>0.1?'var(--amber)':'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{(insights.savings_rate*100).toFixed(0)}%</div>
            </div>
            <div className="card" style={{padding:14}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Obligation to Income</div>
              <div style={{fontSize:16,fontWeight:700,color:insights.obligation_to_income_ratio>0.6?'var(--red)':insights.obligation_to_income_ratio>0.5?'var(--amber)':'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>{insights.obligation_to_income_ratio != null ? `${(insights.obligation_to_income_ratio*100).toFixed(0)}%` : '—'}</div>
            </div>
          </div>
        </div>
      )}

      {months.length > 0 && (
        <div>
          <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:10}}>Monthly Summary (Last 6 Months)</div>
          <table>
            <thead><tr><th>Month</th><th style={{textAlign:'right'}}>Credits</th><th style={{textAlign:'right'}}>Debits</th><th style={{textAlign:'right'}}>Net</th><th style={{textAlign:'right'}}>Txns</th></tr></thead>
            <tbody>
              {months.map(m => {
                const ms = monthly[m] || {}
                return (
                  <tr key={m}>
                    <td className="col-name" style={{fontWeight:600}}>{m}</td>
                    <td className="col-right"><span className="amount-credit">{f(ms.credits)}</span></td>
                    <td className="col-right"><span className="amount-debit">{f(ms.debits)}</span></td>
                    <td className="col-right"><span style={{color:(ms.net||0)>=0?'var(--green)':'var(--red)',fontWeight:600}}>{f(ms.net)}</span></td>
                    <td className="col-right" style={{fontFamily:'JetBrains Mono,monospace'}}>{ms.count ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
