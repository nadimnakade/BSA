const f = n => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

export default function ProfileTab({ a }) {
  const cibil = a.cibil || {}
  const p = cibil.personal || {}
  const addresses = Array.isArray(p.addresses) ? p.addresses : []
  const accounts = Array.isArray(cibil.accounts) ? cibil.accounts : []
  const enq = cibil.enquiries || {}
  const adverse = Array.isArray(cibil.adverse_flags) ? cibil.adverse_flags : []
  const as = a.account_summary || {}

  const isActive = (acc) => !/CLOSED|SETTLED|WRITTEN\s*OFF|CHARGEOFF|CHARGE\s*OFF/i.test((acc?.account_status || '').toString()) && !acc?.closed_date
  const activeCount = accounts.filter(isActive).length
  const closedCount = accounts.length - activeCount

  const totalSanctioned = accounts.reduce((s, x) => s + (x.sanctioned_amount || 0), 0)
  const totalBalance = accounts.reduce((s, x) => s + (x.current_balance || 0), 0)

  const scoreColor = cibil.score >= 750 ? '#22c55e' : cibil.score >= 700 ? '#3b82f6' : cibil.score >= 650 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{padding:24}}>
      <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)',marginBottom:20}}>Profile & Account Summary</div>

      <div style={{marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:10}}>Personal Information</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Name</div>
            <div style={{fontSize:13,color:'var(--text-primary)',fontWeight:500}}>{p.name || '—'}</div>
          </div>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>DOB</div>
            <div style={{fontSize:13,color:'var(--text-primary)',fontFamily:'JetBrains Mono,monospace'}}>{p.dob || '—'}</div>
          </div>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>PAN</div>
            <div style={{fontSize:13,color:'var(--text-primary)',fontFamily:'JetBrains Mono,monospace'}}>{p.pan || '—'}</div>
          </div>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Gender</div>
            <div style={{fontSize:13,color:'var(--text-primary)'}}>{p.gender || '—'}</div>
          </div>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Mobile</div>
            <div style={{fontSize:13,color:'var(--text-primary)',fontFamily:'JetBrains Mono,monospace'}}>{p.mobile || '—'}</div>
          </div>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Company</div>
            <div style={{fontSize:13,color:'var(--text-primary)'}}>{p.company || '—'}</div>
          </div>
        </div>
        {addresses.length > 0 && (
          <div className="card" style={{marginTop:10,padding:14}}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:8}}>Addresses</div>
            <div style={{fontSize:12,color:'var(--text-secondary)',whiteSpace:'pre-wrap'}}>
              {addresses.slice(0, 5).map((addr, i) => (
                <div key={i} style={{padding:'6px 0',borderTop:i? '1px solid var(--border)' : 'none'}}>{addr}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:10}}>CIBIL Score & Credit Summary</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
          <div className="card" style={{padding:14,textAlign:'center'}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>CIBIL Score</div>
            <div style={{fontSize:28,fontWeight:700,color:scoreColor,fontFamily:'JetBrains Mono,monospace'}}>{cibil.score || '—'}</div>
            <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>{cibil.report_date || ''}</div>
          </div>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Report Date</div>
            <div style={{fontSize:13,color:'var(--text-primary)',fontFamily:'JetBrains Mono,monospace'}}>{cibil.report_date || '—'}</div>
          </div>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>DPD Max</div>
            <div style={{fontSize:13,color:cibil.dpd_max>0?'var(--red)':'var(--text-primary)',fontFamily:'JetBrains Mono,monospace'}}>{cibil.dpd_max ?? '—'}</div>
          </div>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Total Enquiries</div>
            <div style={{fontSize:13,color:'var(--text-primary)',fontFamily:'JetBrains Mono,monospace'}}>{enq.total ?? '—'}</div>
          </div>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Last 30d Enquiries</div>
            <div style={{fontSize:13,color:'var(--text-primary)',fontFamily:'JetBrains Mono,monospace'}}>{enq.last_30d ?? '—'}</div>
          </div>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Last 90d Enquiries</div>
            <div style={{fontSize:13,color:'var(--text-primary)',fontFamily:'JetBrains Mono,monospace'}}>{enq.last_90d ?? '—'}</div>
          </div>
        </div>
      </div>

      <div style={{marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:10}}>CIBIL Accounts</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Total Accounts</div>
            <div style={{fontSize:16,fontWeight:700,color:'var(--text-primary)',fontFamily:'JetBrains Mono,monospace'}}>{accounts.length}</div>
          </div>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Active</div>
            <div style={{fontSize:16,fontWeight:700,color:'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>{activeCount}</div>
          </div>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Closed</div>
            <div style={{fontSize:16,fontWeight:700,color:'var(--text-muted)',fontFamily:'JetBrains Mono,monospace'}}>{closedCount}</div>
          </div>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Total Sanctioned</div>
            <div style={{fontSize:16,fontWeight:700,color:'var(--blue)',fontFamily:'JetBrains Mono,monospace'}}>{f(totalSanctioned)}</div>
          </div>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Total Current Balance</div>
            <div style={{fontSize:16,fontWeight:700,color:'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{f(totalBalance)}</div>
          </div>
        </div>
      </div>

      <div>
        <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:10}}>Bank Statement Summary</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Total Credits</div>
            <div style={{fontSize:16,fontWeight:700,color:'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>{f(as.total_credits)}</div>
          </div>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Total Debits</div>
            <div style={{fontSize:16,fontWeight:700,color:'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{f(as.total_debits)}</div>
          </div>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Net Balance</div>
            <div style={{fontSize:16,fontWeight:700,color:as.net_balance>=0?'var(--green)':'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{f(as.net_balance)}</div>
          </div>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Transactions</div>
            <div style={{fontSize:16,fontWeight:700,color:'var(--text-primary)',fontFamily:'JetBrains Mono,monospace'}}>{as.transaction_count ?? '—'}</div>
          </div>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Period</div>
            <div style={{fontSize:13,color:'var(--text-primary)',fontFamily:'JetBrains Mono,monospace'}}>{as.period || '—'}</div>
          </div>
        </div>
      </div>

      {adverse.length > 0 && (
        <div style={{marginTop:20}}>
          <div style={{fontSize:13,fontWeight:600,color:'var(--red)',marginBottom:10}}>Adverse Flags</div>
          <div className="card" style={{padding:14}}>
            <div style={{fontSize:12,color:'var(--text-secondary)',fontFamily:'JetBrains Mono,monospace',whiteSpace:'pre-wrap'}}>{adverse.join('\n')}</div>
          </div>
        </div>
      )}
    </div>
  )
}
