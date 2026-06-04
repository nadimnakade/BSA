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

export default function LoanEligibilityTab({ underwriting }) {
  if (!underwriting?.loan_eligibility) {
    return <div style={{padding:24,textAlign:'center',color:'var(--text-muted)',fontSize:13}}>No eligibility data available. Upload both a CIBIL report and bank statement for detailed analysis.</div>
  }

  const le = underwriting.loan_eligibility
  const grade = underwriting.grade
  const gradeColors = { A: '#22c55e', B: '#3b82f6', C: '#f59e0b', D: '#ef4444' }
  const gradeLabels = { A: 'Excellent', B: 'Good', C: 'Fair', D: 'Poor' }

  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div>
          <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>Loan Eligibility Report</div>
          <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>Based on CIBIL score, income, obligations & credit history</div>
        </div>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Grade</div>
            <div style={{width:44,height:44,borderRadius:12,background:gradeColors[grade]||'#64748b',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700}}>{grade}</div>
            <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>{gradeLabels[grade]||'—'}</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>CIBIL Score</div>
            <div style={{fontSize:22,fontWeight:700,color:le.cibil_score>=750?'#22c55e':le.cibil_score>=700?'#3b82f6':le.cibil_score>=650?'#f59e0b':'#ef4444',fontFamily:'JetBrains Mono,monospace'}}>{le.cibil_score || '—'}</div>
            <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>{le.score_band}</div>
          </div>
        </div>
      </div>

      {le.income_source === 'cibil_estimate' && (
        <div style={{background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)',borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:12,color:'var(--amber)',display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:16}}>⚠️</span>
          <div>
            <strong>Income estimated from CIBIL data</strong> — For accurate results, upload your bank statement as well.
          </div>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10,marginBottom:20}}>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Monthly Income</div>
          <div style={{fontSize:16,fontWeight:700,color:'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>{f(underwriting.avg_monthly_income)}</div>
        </div>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Monthly Obligations</div>
          <div style={{fontSize:16,fontWeight:700,color:'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{f(underwriting.avg_monthly_obligations)}</div>
        </div>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Additional EMI Capacity</div>
          <div style={{fontSize:16,fontWeight:700,color:'var(--blue)',fontFamily:'JetBrains Mono,monospace'}}>{f(le.additional_emi_capacity)}</div>
        </div>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>FOIR</div>
          <div style={{fontSize:16,fontWeight:700,color:underwriting.foir>0.6?'var(--red)':underwriting.foir>0.5?'var(--amber)':'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>{underwriting.foir ? `${(underwriting.foir*100).toFixed(0)}%` : '—'}</div>
        </div>
      </div>

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
