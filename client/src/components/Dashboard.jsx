import { useMemo, useState } from 'react'
import SummaryCards from './SummaryCards'
import OverviewTab from './OverviewTab'
import InvestmentsTab from './InvestmentsTab'
import AppLoansTab from './AppLoansTab'
import TransfersTab from './TransfersTab'
import InsightsTab from './InsightsTab'
import MonthlyTab from './MonthlyTab'

const TABS = [
  {id:'overview',label:'📊 Overview'},
  {id:'salary',label:'💼 Salary'},
  {id:'pf',label:'🧾 PF/EPFO'},
  {id:'emi',label:'🏦 EMI'},
  {id:'disbursement',label:'💳 Loan Disbursement'},
  {id:'creditCard',label:'💳 Credit Card'},
  {id:'investments',label:'📈 Investments'},
  {id:'appLoans',label:'📱 App Loans'},
  {id:'transfers',label:'🔄 Transfers'},
  {id:'monthly',label:'📅 Monthly'},
  {id:'insights',label:'🔍 Insights'},
]

export default function Dashboard({ result, onReset }) {
  const [tab, setTab] = useState('overview')
  const { analysis: a, filename, transaction_count } = result
  const as = a.account_summary
  const f = n => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—'
  const badge = (label, color='blue') => <span className={`badge badge-${color}`}>{label}</span>
  const norm = v => (v ?? '').toString().toLowerCase()
  const [exporting, setExporting] = useState(false)

  const exportSummary = async (format) => {
    setExporting(true)
    try {
      const res = await fetch(`/api/export-summary?format=${encodeURIComponent(format)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, analysis: a })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Export failed')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const base = (filename || 'statement').toString().replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9\-_ ]/gi, '').trim().slice(0, 60) || 'statement'
      const aTag = document.createElement('a')
      aTag.href = url
      aTag.download = `${base}-summary-insights.${format === 'csv' ? 'csv' : 'xlsx'}`
      document.body.appendChild(aTag)
      aTag.click()
      aTag.remove()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const Controls = ({ query, setQuery, sort, setSort, sortOptions, extra, onResetControls }) => (
    <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
        <input className="ctrl" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search..." style={{minWidth:240}} />
        <select className="ctrl" value={sort} onChange={e=>setSort(e.target.value)}>
          {sortOptions.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        {extra}
      </div>
      <button className="ctrl-btn" onClick={onResetControls}>Reset</button>
    </div>
  )

  const SalaryTab = () => {
    const [query, setQuery] = useState('')
    const [sort, setSort] = useState('date_desc')

    const sorters = {
      date_desc: (x, y) => new Date(y.date) - new Date(x.date),
      date_asc: (x, y) => new Date(x.date) - new Date(y.date),
      amount_desc: (x, y) => (y.amount || 0) - (x.amount || 0),
      amount_asc: (x, y) => (x.amount || 0) - (y.amount || 0),
      employer_asc: (x, y) => norm(x.employer).localeCompare(norm(y.employer)),
    }

    const rows = useMemo(() => {
      const q = norm(query).trim()
      return (a.salary || [])
        .filter(r => !q || `${r.date} ${r.employer} ${r.description} ${r.utr} ${r.reference_id}`.toLowerCase().includes(q))
        .slice()
        .sort(sorters[sort] || sorters.date_desc)
    }, [a.salary, query, sort])

    const total = useMemo(() => rows.reduce((s, x) => s + (x.amount || 0), 0), [rows])
    return (
      <div style={{padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>Salary Credits</div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{rows.length} transactions</div>
          </div>
          <div style={{fontSize:20,fontWeight:700,color:'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>{f(total)}</div>
        </div>
        <Controls
          query={query}
          setQuery={setQuery}
          sort={sort}
          setSort={setSort}
          sortOptions={[
            {id:'date_desc',label:'Date ↓'},
            {id:'date_asc',label:'Date ↑'},
            {id:'amount_desc',label:'Amount ↓'},
            {id:'amount_asc',label:'Amount ↑'},
            {id:'employer_asc',label:'Employer A→Z'},
          ]}
          onResetControls={()=>{ setQuery(''); setSort('date_desc') }}
        />
        {rows.length ? (
          <table>
            <thead><tr><th>Date</th><th>Employer</th><th>Description</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {rows.map((x, i) => (
                <tr key={i}>
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,whiteSpace:'nowrap'}}>{x.date}</td>
                  <td style={{color:'var(--text-primary)',fontWeight:600}}>{x.employer || '—'}</td>
                  <td style={{fontSize:12,color:'var(--text-secondary)'}}>{(x.description || '').slice(0, 90)}</td>
                  <td style={{textAlign:'right'}}><span className="amount-credit">{f(x.amount)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text-muted)',fontSize:13}}>No salary credits found</div>}
      </div>
    )
  }

  const PFTab = () => {
    const [query, setQuery] = useState('')
    const [sort, setSort] = useState('date_desc')

    const sorters = {
      date_desc: (x, y) => new Date(y.date) - new Date(x.date),
      date_asc: (x, y) => new Date(x.date) - new Date(y.date),
      amount_desc: (x, y) => (y.amount || 0) - (x.amount || 0),
      amount_asc: (x, y) => (x.amount || 0) - (y.amount || 0),
    }

    const rows = useMemo(() => {
      const q = norm(query).trim()
      return (a.pf_credits || [])
        .filter(r => !q || `${r.date} ${r.description} ${r.rrn} ${r.utr} ${r.reference_id}`.toLowerCase().includes(q))
        .slice()
        .sort(sorters[sort] || sorters.date_desc)
    }, [a.pf_credits, query, sort])

    const total = useMemo(() => rows.reduce((s, x) => s + (x.amount || 0), 0), [rows])
    return (
      <div style={{padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>PF / EPFO Credits</div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{rows.length} transactions</div>
          </div>
          <div style={{fontSize:20,fontWeight:700,color:'var(--teal)',fontFamily:'JetBrains Mono,monospace'}}>{f(total)}</div>
        </div>
        <Controls
          query={query}
          setQuery={setQuery}
          sort={sort}
          setSort={setSort}
          sortOptions={[
            {id:'date_desc',label:'Date ↓'},
            {id:'date_asc',label:'Date ↑'},
            {id:'amount_desc',label:'Amount ↓'},
            {id:'amount_asc',label:'Amount ↑'},
          ]}
          onResetControls={()=>{ setQuery(''); setSort('date_desc') }}
        />
        {rows.length ? (
          <table>
            <thead><tr><th>Date</th><th>Description</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {rows.map((x, i) => (
                <tr key={i}>
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,whiteSpace:'nowrap'}}>{x.date}</td>
                  <td style={{fontSize:12,color:'var(--text-secondary)'}}>{(x.description || '').slice(0, 110)}</td>
                  <td style={{textAlign:'right'}}><span className="amount-credit">{f(x.amount)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text-muted)',fontSize:13}}>No PF/EPFO credits found</div>}
      </div>
    )
  }

  const DisbursementTab = () => {
    const [query, setQuery] = useState('')
    const [sort, setSort] = useState('date_desc')
    const [typeFilter, setTypeFilter] = useState('ALL')

    const typeColor = t => t==='HL' ? 'blue' : t==='PL' ? 'red' : t==='BL' ? 'purple' : t==='GL' ? 'amber' : t==='AL' ? 'amber' : t==='EL' ? 'teal' : 'gray'

    const sorters = {
      date_desc: (x, y) => new Date(y.date) - new Date(x.date),
      date_asc: (x, y) => new Date(x.date) - new Date(y.date),
      amount_desc: (x, y) => (y.amount || 0) - (x.amount || 0),
      amount_asc: (x, y) => (x.amount || 0) - (y.amount || 0),
      lender_asc: (x, y) => norm(x.lender).localeCompare(norm(y.lender)),
    }

    const rows = useMemo(() => {
      const q = norm(query).trim()
      return (a.loan_disbursements || [])
        .filter(r => typeFilter === 'ALL' ? true : (r.loan_type || 'OTHER') === typeFilter)
        .filter(r => !q || `${r.date} ${r.lender} ${r.loan_type} ${r.description} ${r.reference_id} ${r.utr} ${r.rrn} ${r.disbursement_id}`.toLowerCase().includes(q))
        .slice()
        .sort(sorters[sort] || sorters.date_desc)
    }, [a.loan_disbursements, query, sort, typeFilter])

    const total = useMemo(() => rows.reduce((s, x) => s + (x.amount || 0), 0), [rows])
    const types = useMemo(() => Array.from(new Set((a.loan_disbursements || []).map(x => x.loan_type || 'OTHER'))).sort(), [a.loan_disbursements])

    return (
      <div style={{padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>Loan Disbursements</div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{rows.length} transactions</div>
          </div>
          <div style={{fontSize:20,fontWeight:700,color:'var(--blue)',fontFamily:'JetBrains Mono,monospace'}}>{f(total)}</div>
        </div>
        <Controls
          query={query}
          setQuery={setQuery}
          sort={sort}
          setSort={setSort}
          sortOptions={[
            {id:'date_desc',label:'Date ↓'},
            {id:'date_asc',label:'Date ↑'},
            {id:'amount_desc',label:'Amount ↓'},
            {id:'amount_asc',label:'Amount ↑'},
            {id:'lender_asc',label:'Lender A→Z'},
          ]}
          extra={(
            <select className="ctrl" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
              <option value="ALL">All types</option>
              {types.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          )}
          onResetControls={()=>{ setQuery(''); setSort('date_desc'); setTypeFilter('ALL') }}
        />
        {rows.length ? (
          <table>
            <thead><tr><th>Date</th><th>Lender</th><th>Type</th><th>Description</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {rows.map((x, i) => (
                <tr key={i}>
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,whiteSpace:'nowrap'}}>{x.date}</td>
                  <td style={{color:'var(--text-primary)',fontWeight:600}}>{x.lender || '—'}</td>
                  <td>{badge(x.loan_type || '—', typeColor(x.loan_type))}</td>
                  <td style={{fontSize:12,color:'var(--text-secondary)'}}>{(x.description || '').slice(0, 80)}</td>
                  <td style={{textAlign:'right'}}><span className="amount-credit">{f(x.amount)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text-muted)',fontSize:13}}>No loan disbursements found</div>}
      </div>
    )
  }

  const CreditCardTab = () => {
    const [query, setQuery] = useState('')
    const [sort, setSort] = useState('date_desc')

    const sorters = {
      date_desc: (x, y) => new Date(y.date) - new Date(x.date),
      date_asc: (x, y) => new Date(x.date) - new Date(y.date),
      amount_desc: (x, y) => (y.amount || 0) - (x.amount || 0),
      amount_asc: (x, y) => (x.amount || 0) - (y.amount || 0),
    }

    const rows = useMemo(() => {
      const q = norm(query).trim()
      return (a.credit_card_payments || [])
        .filter(r => !q || `${r.date} ${r.description} ${r.utr} ${r.reference_id} ${r.rrn}`.toLowerCase().includes(q))
        .slice()
        .sort(sorters[sort] || sorters.date_desc)
    }, [a.credit_card_payments, query, sort])

    const total = useMemo(() => rows.reduce((s, x) => s + (x.amount || 0), 0), [rows])
    return (
      <div style={{padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>Credit Card Payments</div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{rows.length} transactions</div>
          </div>
          <div style={{fontSize:20,fontWeight:700,color:'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{f(total)}</div>
        </div>
        <Controls
          query={query}
          setQuery={setQuery}
          sort={sort}
          setSort={setSort}
          sortOptions={[
            {id:'date_desc',label:'Date ↓'},
            {id:'date_asc',label:'Date ↑'},
            {id:'amount_desc',label:'Amount ↓'},
            {id:'amount_asc',label:'Amount ↑'},
          ]}
          onResetControls={()=>{ setQuery(''); setSort('date_desc') }}
        />
        {rows.length ? (
          <table>
            <thead><tr><th>Date</th><th>Description</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {rows.map((x, i) => (
                <tr key={i}>
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,whiteSpace:'nowrap'}}>{x.date}</td>
                  <td style={{fontSize:12,color:'var(--text-secondary)'}}>{(x.description || '').slice(0, 110)}</td>
                  <td style={{textAlign:'right'}}><span className="amount-debit">{f(x.amount)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text-muted)',fontSize:13}}>No credit card payments found</div>}
      </div>
    )
  }

  const EMITab = () => {
    const [query, setQuery] = useState('')
    const [sort, setSort] = useState('date_desc')
    const [typeFilter, setTypeFilter] = useState('ALL')

    const sorters = {
      date_desc: (x, y) => new Date(y.date) - new Date(x.date),
      date_asc: (x, y) => new Date(x.date) - new Date(y.date),
      amount_desc: (x, y) => (y.emi_amount || 0) - (x.emi_amount || 0),
      amount_asc: (x, y) => (x.emi_amount || 0) - (y.emi_amount || 0),
      lender_asc: (x, y) => norm(x.bank).localeCompare(norm(y.bank)),
    }

    const rows = useMemo(() => {
      const q = norm(query).trim()
      return (a.loans || [])
        .filter(r => typeFilter === 'ALL' ? true : (r.type || 'OTHER') === typeFilter)
        .filter(r => !q || `${r.date} ${r.bank} ${r.type} ${r.description} ${r.utr} ${r.reference_id} ${r.nach_umrn} ${r.mandate_id} ${r.loan_account_masked}`.toLowerCase().includes(q))
        .slice()
        .sort(sorters[sort] || sorters.date_desc)
    }, [a.loans, query, sort, typeFilter])

    const apy = a.apy_pension || []
    const totalEMI = rows.reduce((s, x) => s + (x.emi_amount || 0), 0)
    const totalAPY = apy.reduce((s, x) => s + (x.amount || 0), 0)

    const byLender = {}
    for (const l of rows) {
      const k = l.bank || 'Unknown'
      if (!byLender[k]) byLender[k] = { bank: k, count: 1, total: l.emi_amount || 0, type: l.type || 'OTHER' }
      else { byLender[k].count++; byLender[k].total += (l.emi_amount || 0) }
    }

    const typeColor = t => t==='HL' ? 'blue' : t==='PL' ? 'red' : t==='BL' ? 'purple' : t==='GL' ? 'amber' : t==='AL' ? 'amber' : t==='EL' ? 'teal' : 'gray'
    const types = useMemo(() => Array.from(new Set((a.loans || []).map(x => x.type || 'OTHER'))).sort(), [a.loans])

    return (
      <div style={{padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:18}}>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>EMI & Obligations</div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{rows.length} EMI debits across {Object.keys(byLender).length} lenders</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:20,fontWeight:700,color:'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{f(totalEMI + totalAPY)}</div>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>monthly obligations</div>
          </div>
        </div>

        <Controls
          query={query}
          setQuery={setQuery}
          sort={sort}
          setSort={setSort}
          sortOptions={[
            {id:'date_desc',label:'Date ↓'},
            {id:'date_asc',label:'Date ↑'},
            {id:'amount_desc',label:'Amount ↓'},
            {id:'amount_asc',label:'Amount ↑'},
            {id:'lender_asc',label:'Lender A→Z'},
          ]}
          extra={(
            <select className="ctrl" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
              <option value="ALL">All types</option>
              {types.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          )}
          onResetControls={()=>{ setQuery(''); setSort('date_desc'); setTypeFilter('ALL') }}
        />

        <div style={{marginBottom:20,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {Object.values(byLender).map(l=>(
            <div key={l.bank} style={{background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.15)',borderRadius:10,padding:'14px 16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'baseline'}}>
                <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{l.bank}</div>
                {badge(l.type || 'OTHER', typeColor(l.type))}
              </div>
              <div style={{fontSize:20,fontWeight:700,color:'var(--red)',fontFamily:'JetBrains Mono,monospace',marginTop:6}}>{f(l.total)}</div>
              <div style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>×{l.count} debits</div>
            </div>
          ))}
          {apy.length>0&&(
            <div style={{background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.15)',borderRadius:10,padding:'14px 16px'}}>
              <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>Atal Pension Yojana</div>
              <div style={{fontSize:20,fontWeight:700,color:'var(--amber)',fontFamily:'JetBrains Mono,monospace'}}>{f(apy[0]?.amount)}</div>
              <div style={{display:'flex',gap:6,marginTop:6}}>
                <span className="badge badge-amber">APY</span>
                <span style={{fontSize:11,color:'var(--text-muted)'}}>×{apy.length}</span>
              </div>
            </div>
          )}
        </div>

        <div style={{fontSize:12,fontWeight:500,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8}}>All EMI Transactions</div>
        {rows.length ? (
          <table>
            <thead><tr><th>Date</th><th>Lender</th><th>Type</th><th>Description</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {rows.map((l,i)=>(
                <tr key={i}>
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,whiteSpace:'nowrap'}}>{l.date}</td>
                  <td style={{color:'var(--text-primary)',fontWeight:500}}>{l.bank}</td>
                  <td>{badge(l.type || 'OTHER', typeColor(l.type))}</td>
                  <td style={{fontSize:11,color:'var(--text-muted)',maxWidth:280}}>{(l.description||'').slice(0,80)}</td>
                  <td style={{textAlign:'right'}}><span className="amount-debit">{f(l.emi_amount)}</span></td>
                </tr>
              ))}
              {apy.map((x,i)=>(
                <tr key={`apy-${i}`}>
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,whiteSpace:'nowrap'}}>{x.date}</td>
                  <td style={{color:'var(--text-primary)',fontWeight:500}}>Atal Pension Yojana</td>
                  <td><span className="badge badge-amber">APY</span></td>
                  <td style={{fontSize:11,color:'var(--text-muted)'}}>{(x.description||'').slice(0,80)}</td>
                  <td style={{textAlign:'right'}}><span className="amount-invest">{f(x.amount)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text-muted)',fontSize:13}}>No EMI transactions found</div>}
      </div>
    )
  }

  return (
    <div className="slide-up">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:8 }}>
        <div>
          <div style={{ fontSize:19, fontWeight:600, color:'var(--text-primary)' }}>Statement Analysis</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'JetBrains Mono,monospace', marginTop:2 }}>
            {filename} · {transaction_count} transactions · {as.period}
          </div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <button
            onClick={()=>exportSummary('xlsx')}
            disabled={exporting}
            style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', padding:'6px 12px', borderRadius:8, fontSize:12, cursor:exporting?'not-allowed':'pointer', opacity:exporting?.6:1 }}
          >
            {exporting ? 'Exporting...' : 'Export XLSX'}
          </button>
          <button
            onClick={()=>exportSummary('csv')}
            disabled={exporting}
            style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', padding:'6px 12px', borderRadius:8, fontSize:12, cursor:exporting?'not-allowed':'pointer', opacity:exporting?.6:1 }}
          >
            Export CSV
          </button>
          <button onClick={onReset} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', padding:'6px 14px', borderRadius:8, fontSize:12, cursor:'pointer' }}>← New Analysis</button>
        </div>
      </div>

      <SummaryCards a={a} />

      <div style={{ display:'flex', gap:4, margin:'20px 0 16px', flexWrap:'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {tab==='overview' && <OverviewTab a={a} />}
        {tab==='salary' && <SalaryTab />}
        {tab==='pf' && <PFTab />}
        {tab==='emi' && <EMITab />}
        {tab==='disbursement' && <DisbursementTab />}
        {tab==='creditCard' && <CreditCardTab />}
        {tab==='investments' && <InvestmentsTab a={a} />}
        {tab==='appLoans' && <AppLoansTab a={a} />}
        {tab==='transfers' && <TransfersTab a={a} />}
        {tab==='monthly' && <MonthlyTab a={a} />}
        {tab==='insights' && <InsightsTab a={a} />}
      </div>
    </div>
  )
}
