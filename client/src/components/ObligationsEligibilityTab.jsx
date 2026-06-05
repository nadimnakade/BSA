const f = n => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

const statusColors = {
  eligible: { bg: '#dcfce7', border: '#86efac', text: '#15803d', label: 'Eligible' },
  conditional: { bg: '#fef3c7', border: '#fde68a', text: '#92400e', label: 'Conditional' },
  not_eligible: { bg: '#fee2e2', border: '#fca5a5', text: '#b91c1c', label: 'Not Eligible' },
}

const impactColors = {
  high: { bg: '#fee2e2', text: '#b91c1c' },
  medium: { bg: '#fef3c7', text: '#92400e' },
  low: { bg: '#dbeafe', text: '#1d4ed8' },
}

const gradeColors = { A: '#22c55e', B: '#3b82f6', C: '#f59e0b', D: '#ef4444' }
const gradeLabels = { A: 'Excellent', B: 'Good', C: 'Fair', D: 'Poor' }

export default function ObligationsEligibilityTab({ a }) {
  const uw = a.underwriting
  const cibil = a.cibil || {}
  const le = uw?.loan_eligibility

  if (!uw) {
    return <div style={{padding:24,textAlign:'center',color:'var(--text-muted)',fontSize:13}}>No underwriting data available. Upload both a CIBIL report and bank statement.</div>
  }

  const policyFlags = Array.isArray(uw.policy_flags) ? uw.policy_flags : []
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

  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div>
          <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>Obligations & Eligibility</div>
          <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>Combined analysis from bank statement + CIBIL report</div>
        </div>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Grade</div>
            <div style={{width:44,height:44,borderRadius:12,background:gradeColors[uw.grade]||'#64748b',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700}}>{uw.grade}</div>
            <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>{gradeLabels[uw.grade]||'—'}</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>CIBIL Score</div>
            <div style={{fontSize:22,fontWeight:700,color:cibil.score>=750?'#22c55e':cibil.score>=700?'#3b82f6':cibil.score>=650?'#f59e0b':'#ef4444',fontFamily:'JetBrains Mono,monospace'}}>{cibil.score || '—'}</div>
            <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>{le?.score_band || '—'}</div>
          </div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10,marginBottom:20}}>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Monthly Income</div>
          <div style={{fontSize:16,fontWeight:700,color:'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>{f(uw.avg_monthly_income)}</div>
          <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>avg from {uw.income_source === 'cibil_estimate' ? 'CIBIL estimate' : 'bank statement'}</div>
        </div>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Monthly Obligations</div>
          <div style={{fontSize:16,fontWeight:700,color:'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{f(uw.avg_monthly_obligations)}</div>
          <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>EMI + Rent + Apps + CC</div>
        </div>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Additional EMI Capacity</div>
          <div style={{fontSize:16,fontWeight:700,color:'var(--blue)',fontFamily:'JetBrains Mono,monospace'}}>{f(le?.additional_emi_capacity)}</div>
          <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>at max FOIR {uw.max_foir_policy ? `${(uw.max_foir_policy*100).toFixed(0)}%` : '—'}</div>
        </div>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>FOIR</div>
          <div style={{fontSize:16,fontWeight:700,color:uw.foir>0.6?'var(--red)':uw.foir>0.5?'var(--amber)':'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>{uw.foir ? `${(uw.foir*100).toFixed(0)}%` : '—'}</div>
          <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>fixed obligation to income</div>
        </div>
      </div>

      {policyFlags.length > 0 && (
        <div style={{marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:10}}>Policy Flags</div>
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

      {le && (
        <>
          {le.eligible_count > 0 && (
            <div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:600,color:'#15803d',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:'#22c55e',display:'inline-block'}}></span>
                Eligible ({le.eligible_count})
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:10}}>
                {le.loan_products.filter(p => p.status === 'eligible').map(p => (
                  <ProductCard key={p.code} product={p} />
                ))}
              </div>
            </div>
          )}

          {le.conditional_count > 0 && (
            <div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:600,color:'#92400e',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:'#f59e0b',display:'inline-block'}}></span>
                Conditionally Eligible ({le.conditional_count})
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:10}}>
                {le.loan_products.filter(p => p.status === 'conditional').map(p => (
                  <ProductCard key={p.code} product={p} />
                ))}
              </div>
            </div>
          )}

          {le.not_eligible_count > 0 && (
            <div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:600,color:'#b91c1c',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:'#ef4444',display:'inline-block'}}></span>
                Not Eligible ({le.not_eligible_count})
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:10}}>
                {le.loan_products.filter(p => p.status === 'not_eligible').map(p => (
                  <ProductCard key={p.code} product={p} />
                ))}
              </div>
            </div>
          )}

          {(le.risk_factors.length > 0 || le.positive_factors.length > 0) && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
              {le.risk_factors.length > 0 && (
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--red)',marginBottom:10}}>Risk Factors</div>
                  {le.risk_factors.map((r, i) => (
                    <div key={i} style={{marginBottom:8,padding:'10px 12px',borderRadius:8,background:impactColors[r.impact]?.bg||'var(--bg-secondary)',borderLeft:`3px solid ${r.impact==='high'?'#ef4444':r.impact==='medium'?'#f59e0b':'#3b82f6'}`}}>
                      <div style={{fontSize:12,fontWeight:600,color:impactColors[r.impact]?.text||'var(--text-primary)'}}>{r.factor}</div>
                      <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:2}}>{r.detail}</div>
                    </div>
                  ))}
                </div>
              )}
              {le.positive_factors.length > 0 && (
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--green)',marginBottom:10}}>Positive Factors</div>
                  {le.positive_factors.map((r, i) => (
                    <div key={i} style={{marginBottom:8,padding:'10px 12px',borderRadius:8,background:'rgba(34,197,94,.06)',borderLeft:'3px solid #22c55e'}}>
                      <div style={{fontSize:12,fontWeight:600,color:'#15803d'}}>{r.factor}</div>
                      <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:2}}>{r.detail}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {le.improvement_tips.length > 0 && (
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'var(--blue)',marginBottom:10}}>Improvement Tips</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:10}}>
                {le.improvement_tips.map((t, i) => (
                  <div key={i} className="card" style={{padding:14,borderLeft:`3px solid ${t.impact==='high'?'#ef4444':t.impact==='medium'?'#f59e0b':'#3b82f6'}`}}>
                    <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>{t.tip}</div>
                    <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:6,lineHeight:1.5}}>{t.detail}</div>
                    <div style={{display:'flex',gap:8}}>
                      <span className={`badge badge-${t.impact==='high'?'red':t.impact==='medium'?'amber':'blue'}`}>{t.impact}</span>
                      <span style={{fontSize:10,color:'var(--text-muted)'}}>{t.timeline}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div style={{marginTop:20,padding:14,borderRadius:10,background:'var(--bg-secondary)',border:'1px solid var(--border)'}}>
        <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:8}}>Quick Summary</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10,fontSize:12}}>
          <div>
            <div style={{color:'var(--text-muted)',marginBottom:2}}>Accounts (Total / Active)</div>
            <div style={{fontFamily:'JetBrains Mono,monospace',fontWeight:600}}>{uw.accounts_total ?? '—'} / {uw.accounts_active ?? '—'}</div>
          </div>
          <div>
            <div style={{color:'var(--text-muted)',marginBottom:2}}>Unsecured Active</div>
            <div style={{fontFamily:'JetBrains Mono,monospace',fontWeight:600}}>{uw.unsecured_active ?? '—'}</div>
          </div>
          <div>
            <div style={{color:'var(--text-muted)',marginBottom:2}}>Credit Cards Active</div>
            <div style={{fontFamily:'JetBrains Mono,monospace',fontWeight:600}}>{uw.credit_cards_active ?? '—'}</div>
          </div>
          <div>
            <div style={{color:'var(--text-muted)',marginBottom:2}}>CC Utilization</div>
            <div style={{fontFamily:'JetBrains Mono,monospace',fontWeight:600,color:uw.credit_card_utilization>0.8?'var(--red)':'var(--text-primary)'}}>{uw.credit_card_utilization != null ? `${(uw.credit_card_utilization*100).toFixed(0)}%` : '—'}</div>
          </div>
          <div>
            <div style={{color:'var(--text-muted)',marginBottom:2}}>Recent Enquiries</div>
            <div style={{fontFamily:'JetBrains Mono,monospace',fontWeight:600}}>{uw.enquiries_recent ?? '—'}</div>
          </div>
          <div>
            <div style={{color:'var(--text-muted)',marginBottom:2}}>Bounce Count</div>
            <div style={{fontFamily:'JetBrains Mono,monospace',fontWeight:600,color:uw.bounce_count>2?'var(--red)':'var(--text-primary)'}}>{uw.bounce_count ?? '—'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product }) {
  const sc = statusColors[product.status] || statusColors.not_eligible
  return (
    <div className="card" style={{padding:16,borderTop:`3px solid ${sc.border}`}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:20}}>{product.icon}</span>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{product.name}</div>
            <div style={{fontSize:10,color:'var(--text-muted)'}}>{product.code}</div>
          </div>
        </div>
        <span className="badge" style={{background:sc.bg,color:sc.text,border:`1px solid ${sc.border}`}}>{sc.label}</span>
      </div>

      {product.maxAmount && (
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,color:'var(--text-muted)',marginBottom:2}}>Max Loan Amount</div>
          <div style={{fontSize:18,fontWeight:700,color:'var(--text-primary)',fontFamily:'JetBrains Mono,monospace'}}>{f(product.maxAmount)}</div>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:11}}>
        <div>
          <div style={{color:'var(--text-muted)'}}>APR</div>
          <div style={{color:'var(--text-secondary)',fontWeight:500}}>{product.typicalApr}</div>
        </div>
        <div>
          <div style={{color:'var(--text-muted)'}}>Max Tenure</div>
          <div style={{color:'var(--text-secondary)',fontWeight:500}}>{product.maxTenure}</div>
        </div>
        {product.estimatedEmi && (
          <div>
            <div style={{color:'var(--text-muted)'}}>Est. EMI</div>
            <div style={{color:'var(--text-secondary)',fontWeight:500}}>{f(product.estimatedEmi)}/mo</div>
          </div>
        )}
        {product.maxLtv && (
          <div>
            <div style={{color:'var(--text-muted)'}}>Max LTV</div>
            <div style={{color:'var(--text-secondary)',fontWeight:500}}>{(product.maxLtv*100).toFixed(0)}%</div>
          </div>
        )}
      </div>

      <div style={{fontSize:11,color:'var(--text-muted)',marginTop:8,paddingTop:8,borderTop:'1px solid var(--border)',lineHeight:1.4}}>{product.reason}</div>
    </div>
  )
}
