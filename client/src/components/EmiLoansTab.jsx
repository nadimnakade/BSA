const f = n => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—'
const norm = v => (v ?? '').toString().toLowerCase()

export default function EmiLoansTab({ a }) {
  const cibil = a.cibil || {}
  const emiRows = a.loans || []
  const cibilAccounts = Array.isArray(cibil.accounts) ? cibil.accounts : []
  const activeLoans = cibilAccounts.filter(acc => !/CLOSED|SETTLED|WRITTEN\s*OFF|CHARGEOFF|CHARGE\s*OFF/i.test((acc?.account_status || '').toString()) && !acc?.closed_date && (acc.emi || 0) > 0)

  const totalEmiFromStmt = emiRows.reduce((s, x) => s + (x.emi_amount || 0), 0)
  const totalEmiFromCibil = activeLoans.reduce((s, x) => s + (x.emi || 0), 0)

  return (
    <div style={{padding:24}}>
      <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)',marginBottom:20}}>EMI & Loans</div>

      <div style={{marginBottom:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>From Bank Statement</div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{emiRows.length} EMI transactions</div>
          </div>
          <div style={{fontSize:16,fontWeight:700,color:'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{f(totalEmiFromStmt)}/mo</div>
        </div>
        {emiRows.length ? (
          <table>
            <thead><tr><th></th><th>Bank / Lender</th><th>Type</th><th>Description</th><th>Date</th><th style={{textAlign:'right'}}>EMI Amount</th></tr></thead>
            <tbody>
              {emiRows.map((x, i) => (
                <tr key={i}>
                  <td className="col-icon"><div className="icon-circle red">🏦</div></td>
                  <td className="col-name">{x.bank || x.lender || '—'}<div className="cell-sub">EMI Payment</div></td>
                  <td>{x.type || '—'}</td>
                  <td className="col-desc">{(x.description || '').slice(0, 80)}</td>
                  <td className="col-date">{x.date}</td>
                  <td className="col-right"><span className="amount-debit">{f(x.emi_amount)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div style={{textAlign:'center',padding:'30px 20px',color:'var(--text-muted)',fontSize:13}}>No EMI transactions found in bank statement</div>}
      </div>

      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>From CIBIL Report</div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{activeLoans.length} active loan accounts with EMI</div>
          </div>
          <div style={{fontSize:16,fontWeight:700,color:'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{f(totalEmiFromCibil)}/mo</div>
        </div>
        {activeLoans.length ? (
          <table>
            <thead><tr><th></th><th>Lender</th><th>Type</th><th>Status</th><th>Opened</th><th style={{textAlign:'right'}}>Sanctioned</th><th style={{textAlign:'right'}}>Balance</th><th style={{textAlign:'right'}}>EMI</th></tr></thead>
            <tbody>
              {activeLoans.map((x, i) => (
                <tr key={i}>
                  <td className="col-icon"><div className="icon-circle blue">📋</div></td>
                  <td className="col-name">{x.lender || '—'}<div className="cell-sub">{x.account_type || ''}</div></td>
                  <td className="col-desc" style={{maxWidth:80}}>{x.account_type || '—'}</td>
                  <td><span className="status-dot green">{x.account_status || '—'}</span></td>
                  <td className="col-date">{x.opened_date || '—'}</td>
                  <td className="col-right">{f(x.sanctioned_amount)}</td>
                  <td className="col-right">{f(x.current_balance)}</td>
                  <td className="col-right"><span className="amount-debit">{f(x.emi)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div style={{textAlign:'center',padding:'30px 20px',color:'var(--text-muted)',fontSize:13}}>No active loan accounts with EMI in CIBIL report</div>}
      </div>
    </div>
  )
}
