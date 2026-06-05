const f = n => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

export default function CreditCardsCombinedTab({ a }) {
  const cibil = a.cibil || {}
  const ccPayments = a.credit_card_payments || []
  const cibilAccounts = Array.isArray(cibil.accounts) ? cibil.accounts : []
  const ccAccounts = cibilAccounts.filter(acc => /CREDIT\s*CARD|CC/i.test((acc?.account_type || '').toString()) && !/CLOSED|SETTLED|WRITTEN\s*OFF|CHARGEOFF|CHARGE\s*OFF/i.test((acc?.account_status || '').toString()))

  const totalPayments = ccPayments.reduce((s, x) => s + (x.amount || 0), 0)
  const totalCcLimit = ccAccounts.reduce((s, x) => s + (x.credit_limit || 0), 0)
  const totalCcBalance = ccAccounts.reduce((s, x) => s + (x.current_balance || 0), 0)
  const utilization = totalCcLimit > 0 ? totalCcBalance / totalCcLimit : 0

  return (
    <div style={{padding:24}}>
      <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)',marginBottom:20}}>Credit Cards</div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10,marginBottom:24}}>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>CC Accounts</div>
          <div style={{fontSize:16,fontWeight:700,color:'var(--text-primary)',fontFamily:'JetBrains Mono,monospace'}}>{ccAccounts.length}</div>
        </div>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Total Credit Limit</div>
          <div style={{fontSize:16,fontWeight:700,color:'var(--blue)',fontFamily:'JetBrains Mono,monospace'}}>{f(totalCcLimit)}</div>
        </div>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Total Outstanding</div>
          <div style={{fontSize:16,fontWeight:700,color:'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{f(totalCcBalance)}</div>
        </div>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Utilization</div>
          <div style={{fontSize:16,fontWeight:700,color:utilization>0.8?'var(--red)':utilization>0.5?'var(--amber)':'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>{utilization > 0 ? `${(utilization*100).toFixed(0)}%` : '—'}</div>
        </div>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Total CC Payments (Stmt)</div>
          <div style={{fontSize:16,fontWeight:700,color:'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{f(totalPayments)}</div>
        </div>
      </div>

      {ccAccounts.length > 0 && (
        <div style={{marginBottom:24}}>
          <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:10}}>CIBIL Credit Card Accounts</div>
          <table>
            <thead><tr><th></th><th>Lender</th><th>Account</th><th>Status</th><th style={{textAlign:'right'}}>Limit</th><th style={{textAlign:'right'}}>Balance</th><th style={{textAlign:'right'}}>Utilization</th></tr></thead>
            <tbody>
              {ccAccounts.map((x, i) => {
                const u = x.credit_limit > 0 ? x.current_balance / x.credit_limit : 0
                return (
                  <tr key={i}>
                    <td className="col-icon"><div className="icon-circle red">💳</div></td>
                    <td className="col-name">{x.lender || '—'}<div className="cell-sub">Credit Card</div></td>
                    <td className="col-desc" style={{fontFamily:'JetBrains Mono,monospace',fontSize:11}}>{x.account_no || '—'}</td>
                    <td><span className="status-dot green">{x.account_status || '—'}</span></td>
                    <td className="col-right">{f(x.credit_limit)}</td>
                    <td className="col-right">{f(x.current_balance)}</td>
                    <td className="col-right"><span style={{color:u>0.8?'var(--red)':u>0.5?'var(--amber)':'var(--green)',fontWeight:600}}>{u > 0 ? `${(u*100).toFixed(0)}%` : '—'}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:10}}>CC Payment Transactions (Bank Statement)</div>
        {ccPayments.length ? (
          <table>
            <thead><tr><th></th><th>Platform</th><th>Issuer</th><th>Payee/VPA</th><th>Description</th><th>Date</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {ccPayments.map((x, i) => (
                <tr key={i}>
                  <td className="col-icon"><div className="icon-circle red">💳</div></td>
                  <td className="col-name">{x.cc_platform || '—'}<div className="cell-sub">CC Payment</div></td>
                  <td className="col-desc" style={{maxWidth:120}}>{(x.cc_issuer_bank || '—').slice(0, 22)}</td>
                  <td className="col-desc" style={{maxWidth:120}}>{(x.cc_payee || '—').slice(0, 22)}</td>
                  <td className="col-desc">{(x.cc_display || x.description || '').slice(0, 70)}</td>
                  <td className="col-date">{x.date}</td>
                  <td className="col-right"><span className="amount-debit">{f(x.amount)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div style={{textAlign:'center',padding:'30px 20px',color:'var(--text-muted)',fontSize:13}}>No credit card payments found in bank statement</div>}
      </div>
    </div>
  )
}
