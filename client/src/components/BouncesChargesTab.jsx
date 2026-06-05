const f = n => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—'
const norm = v => (v ?? '').toString().toLowerCase()

export default function BouncesChargesTab({ a }) {
  const bounces = a.bounce_charges || []

  const total = bounces.reduce((s, x) => s + (x.amount || 0), 0)

  const categorySummary = {}
  for (const b of bounces) {
    const cat = b.category || 'Charges/Returns'
    if (!categorySummary[cat]) categorySummary[cat] = { count: 0, total: 0 }
    categorySummary[cat].count++
    categorySummary[cat].total += b.amount || 0
  }

  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>Bounces & Charges</div>
          <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{bounces.length} transactions</div>
        </div>
        <div style={{fontSize:20,fontWeight:700,color:'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{f(total)}</div>
      </div>

      {Object.keys(categorySummary).length > 0 && (
        <div style={{marginBottom:20,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
          {Object.entries(categorySummary).map(([cat, info]) => (
            <div key={cat} className="card" style={{padding:14}}>
              <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>{cat}</div>
              <div style={{fontSize:16,fontWeight:700,color:'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{f(info.total)}</div>
              <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{info.count} transaction{info.count !== 1 ? 's' : ''}</div>
            </div>
          ))}
        </div>
      )}

      {bounces.length ? (
        <table>
          <thead><tr><th></th><th>Category</th><th>Channel</th><th>Description</th><th>Date</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
          <tbody>
            {bounces.map((x, i) => (
              <tr key={i}>
                <td className="col-icon"><div className="icon-circle amber">⚠️</div></td>
                <td className="col-name">{x.category || 'Charges/Returns'}<div className="cell-sub">Bounce / Charge</div></td>
                <td className="col-desc" style={{maxWidth:120}}>{x.channel || '—'}</td>
                <td className="col-desc">{(x.description || '').slice(0, 110)}</td>
                <td className="col-date">{x.date}</td>
                <td className="col-right"><span className="amount-debit">{f(x.amount)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text-muted)',fontSize:13}}>No bounce or charge transactions found</div>}
    </div>
  )
}
