import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import SummaryCards from './SummaryCards'
import OverviewTab from './OverviewTab'
import InvestmentsTab from './InvestmentsTab'
import AppLoansTab from './AppLoansTab'
import TransfersTab from './TransfersTab'
import InsightsTab from './InsightsTab'
import MonthlyTab from './MonthlyTab'
import TxModal from './TxModal'
import LoanEligibilityTab from './LoanEligibilityTab'
import ObligationsEligibilityTab from './ObligationsEligibilityTab'
import ProfileTab from './ProfileTab'
import EmiLoansTab from './EmiLoansTab'
import CreditCardsCombinedTab from './CreditCardsCombinedTab'
import BouncesChargesTab from './BouncesChargesTab'
import InsightsCombinedTab from './InsightsCombinedTab'

const STATEMENT_TABS = [
  {id:'overview',label:'📊 Overview'},
  {id:'salary',label:'💼 Salary'},
  {id:'pf',label:'🧾 PF/EPFO'},
  {id:'emi',label:'🏦 EMI'},
  {id:'disbursement',label:'💳 Loan Disbursement'},
  {id:'creditCard',label:'💳 Credit Card'},
  {id:'bounces',label:'⚠️ Bounces/Charges'},
  {id:'stock',label:'📈 Stock Market'},
  {id:'investments',label:'📈 Investments'},
  {id:'appLoans',label:'📱 App Loans'},
  {id:'transfers',label:'🔄 Transfers'},
  {id:'monthly',label:'📅 Monthly'},
  {id:'insights',label:'🔍 Insights'},
]

const CIBIL_TABS = [
  {id:'personal',label:'👤 Personal Information'},
  {id:'score',label:'✅ CIBIL Score'},
  {id:'eligibility',label:'🏦 Loan Eligibility'},
  {id:'loans',label:'📋 Active Loans'},
  {id:'closedLoans',label:'Closed Loans'},
  {id:'inquiry',label:'🔎 Inquiry'},
]

const BOTH_TABS = [
  {id:'obligations',label:'🏦 Obligations & Eligibility'},
  {id:'profile',label:'👤 Profile'},
  {id:'emiLoans',label:'📋 EMI & Loans'},
  {id:'creditCards',label:'💳 Credit Cards'},
  {id:'bounces',label:'⚠️ Bounces/Charges'},
  {id:'insights',label:'🔍 Insights'},
]

export default function Dashboard({ mode = 'statement', result, onReset, uploadedStatementFile, uploadedCibilFile }) {
  const isCibil = mode === 'cibil'
  const isBoth = mode === 'both'
  const [tab, setTab] = useState(isBoth ? 'obligations' : isCibil ? 'score' : 'overview')
  const a = result?.analysis || {}
  const filename = result?.filename
  const transaction_count = result?.transaction_count
  const as = a.account_summary || {}
  const f = n => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—'
  const badge = (label, color='blue') => <span className={`badge badge-${color}`}>{label}</span>
  const norm = v => (v ?? '').toString().toLowerCase()
  const [exporting, setExporting] = useState(false)
  const [txOpen, setTxOpen] = useState(false)
  const [selectedTx, setSelectedTx] = useState(null)

  const openTx = (tx) => { setSelectedTx(tx); setTxOpen(true) }
  const tabs = isBoth ? BOTH_TABS : isCibil ? CIBIL_TABS : STATEMENT_TABS

  const tabBarRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = tabBarRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => { checkScroll() }, [checkScroll, tabs])

  const scrollTabs = (dir) => {
    const el = tabBarRef.current
    if (!el) return
    el.scrollBy({ left: dir * 200, behavior: 'smooth' })
    setTimeout(checkScroll, 350)
  }

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

  const exportCibil = async (format) => {
    setExporting(true)
    try {
      const res = await fetch(`/api/export-cibil?format=${encodeURIComponent(format)}`, {
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
      const base = ((a?.cibil?.filename || filename || 'cibil') || 'cibil')
        .toString()
        .replace(/\.[a-z0-9]+$/i, '')
        .replace(/[^a-z0-9\-_ ]/gi, '')
        .trim()
        .slice(0, 60) || 'cibil'
      const aTag = document.createElement('a')
      aTag.href = url
      aTag.download = `${base}-cibil.${format === 'csv' ? 'csv' : 'xlsx'}`
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
    const avgMonthly = useMemo(() => {
      const months = new Set(rows.map(r => (r.date || '').slice(0, 7)))
      return months.size > 0 ? total / months.size : 0
    }, [rows, total])
    const byEmployer = useMemo(() => {
      const map = {}
      for (const r of rows) {
        const e = r.employer || 'Unknown'
        if (!map[e]) map[e] = { employer: e, count: 0, total: 0, amounts: [] }
        map[e].count++
        map[e].total += r.amount || 0
        map[e].amounts.push(r.amount || 0)
      }
      return Object.values(map).sort((a, b) => b.total - a.total)
    }, [rows])

    return (
      <div style={{padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>Salary Credits</div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{rows.length} transactions</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:20,fontWeight:700,color:'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>{f(total)}</div>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>total salary received</div>
          </div>
        </div>

        {byEmployer.length > 0 && (
          <div style={{marginBottom:20,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:10}}>
            {byEmployer.map(e => (
              <div key={e.employer} style={{background:'rgba(34,197,94,.06)',border:'1px solid rgba(34,197,94,.15)',borderRadius:10,padding:'14px 16px'}}>
                <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.employer}</div>
                <div style={{fontSize:20,fontWeight:700,color:'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>{f(e.total)}</div>
                <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>
                  {e.count} credit{e.count !== 1 ? 's' : ''} · avg {f(e.total / e.count)}
                </div>
              </div>
            ))}
            {rows.length > 0 && (
              <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px'}}>
                <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>Monthly Average</div>
                <div style={{fontSize:20,fontWeight:700,color:'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>{f(avgMonthly)}</div>
                <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>estimated per month</div>
              </div>
            )}
          </div>
        )}
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
            <thead><tr><th></th><th>Employer</th><th>Description</th><th>Date</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {rows.map((x, i) => (
                <tr key={i} onClick={()=>openTx(x)} style={{cursor:'pointer'}}>
                  <td className="col-icon"><div className="icon-circle green">💼</div></td>
                  <td className="col-name">{x.employer || '—'}<div className="cell-sub">Salary Credit</div></td>
                  <td className="col-desc">{(x.description || '').slice(0, 90)}</td>
                  <td className="col-date">{x.date}</td>
                  <td className="col-right"><span className="amount-credit">{f(x.amount)}</span></td>
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
    const avgPerCredit = rows.length > 0 ? total / rows.length : 0

    return (
      <div style={{padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>PF / EPFO Credits</div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{rows.length} transactions</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:20,fontWeight:700,color:'var(--teal)',fontFamily:'JetBrains Mono,monospace'}}>{f(total)}</div>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>total PF received</div>
          </div>
        </div>

        {rows.length > 0 && (
          <div style={{marginBottom:20,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
            <div style={{background:'rgba(20,184,166,.06)',border:'1px solid rgba(20,184,166,.15)',borderRadius:10,padding:'14px 16px'}}>
              <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>Total PF Credits</div>
              <div style={{fontSize:20,fontWeight:700,color:'var(--teal)',fontFamily:'JetBrains Mono,monospace'}}>{f(total)}</div>
              <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>{rows.length} credit{rows.length !== 1 ? 's' : ''}</div>
            </div>
            <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px'}}>
              <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>Average Per Credit</div>
              <div style={{fontSize:20,fontWeight:700,color:'var(--teal)',fontFamily:'JetBrains Mono,monospace'}}>{f(avgPerCredit)}</div>
              <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>per transaction</div>
            </div>
          </div>
        )}
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
            <thead><tr><th></th><th>Description</th><th>Date</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {rows.map((x, i) => (
                <tr key={i} onClick={()=>openTx(x)} style={{cursor:'pointer'}}>
                  <td className="col-icon"><div className="icon-circle teal">🧾</div></td>
                  <td className="col-name">{(x.description || '').slice(0, 110)}<div className="cell-sub">PF / EPFO Credit</div></td>
                  <td className="col-date">{x.date}</td>
                  <td className="col-right"><span className="amount-credit">{f(x.amount)}</span></td>
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
            <thead><tr><th></th><th>Lender</th><th>Type</th><th>Description</th><th>Date</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {rows.map((x, i) => (
                <tr key={i} onClick={()=>openTx(x)} style={{cursor:'pointer'}}>
                  <td className="col-icon"><div className="icon-circle blue">🏦</div></td>
                  <td className="col-name">{x.lender || '—'}<div className="cell-sub">Loan Disbursement</div></td>
                  <td>{badge(x.loan_type || '—', typeColor(x.loan_type))}</td>
                  <td className="col-desc">{(x.description || '').slice(0, 80)}</td>
                  <td className="col-date">{x.date}</td>
                  <td className="col-right"><span className="amount-credit">{f(x.amount)}</span></td>
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
        .filter(r => {
          if (!q) return true
          const hay = `${r.date} ${r.description} ${r.cc_platform || ''} ${r.cc_channel || ''} ${r.cc_issuer_bank || ''} ${r.cc_payee || ''} ${r.utr || ''} ${r.reference_id || ''} ${r.rrn || ''}`.toLowerCase()
          return hay.includes(q)
        })
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
            <thead><tr><th></th><th>Platform</th><th>Issuer</th><th>Payee/VPA</th><th>Description</th><th>Date</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {rows.map((x, i) => (
                <tr key={i} onClick={()=>openTx(x)} style={{cursor:'pointer'}}>
                  <td className="col-icon"><div className="icon-circle red">💳</div></td>
                  <td className="col-name">{x.cc_platform || '—'}<div className="cell-sub">Credit Card Payment</div></td>
                  <td className="col-desc" style={{maxWidth:160}}>{(x.cc_issuer_bank || '—').slice(0, 22)}</td>
                  <td className="col-desc" style={{maxWidth:160}}>{(x.cc_payee || '—').slice(0, 22)}</td>
                  <td className="col-desc">{(x.cc_display || x.description || '').slice(0, 70)}</td>
                  <td className="col-date">{x.date}</td>
                  <td className="col-right"><span className="amount-debit">{f(x.amount)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text-muted)',fontSize:13}}>No credit card payments found</div>}
      </div>
    )
  }

  const BouncesTab = () => {
    const [query, setQuery] = useState('')
    const [sort, setSort] = useState('date_desc')
    const [cat, setCat] = useState('ALL')

    const sorters = {
      date_desc: (x, y) => new Date(y.date) - new Date(x.date),
      date_asc: (x, y) => new Date(x.date) - new Date(y.date),
      amount_desc: (x, y) => (y.amount || 0) - (x.amount || 0),
      amount_asc: (x, y) => (x.amount || 0) - (y.amount || 0),
      category_asc: (x, y) => norm(x.category).localeCompare(norm(y.category)),
    }

    const base = a.bounce_charges || []
    const categories = useMemo(() => Array.from(new Set(base.map(x => x.category || 'Charges/Returns'))).sort(), [base])

    const rows = useMemo(() => {
      const q = norm(query).trim()
      return base
        .filter(r => cat === 'ALL' ? true : (r.category || 'Charges/Returns') === cat)
        .filter(r => !q || `${r.date} ${r.category} ${r.channel || ''} ${r.description} ${r.utr || ''} ${r.reference_id || ''} ${r.rrn || ''}`.toLowerCase().includes(q))
        .slice()
        .sort(sorters[sort] || sorters.date_desc)
    }, [base, query, sort, cat])

    const total = useMemo(() => rows.reduce((s, x) => s + (x.amount || 0), 0), [rows])

    return (
      <div style={{padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>Bounces / Charges</div>
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
            {id:'category_asc',label:'Category A→Z'},
          ]}
          extra={(
            <select className="ctrl" value={cat} onChange={e=>setCat(e.target.value)}>
              <option value="ALL">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          onResetControls={()=>{ setQuery(''); setSort('date_desc'); setCat('ALL') }}
        />

        {rows.length ? (
          <table>
            <thead><tr><th></th><th>Category</th><th>Channel</th><th>Description</th><th>Date</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {rows.map((x, i) => (
                <tr key={i} onClick={()=>openTx(x)} style={{cursor:'pointer'}}>
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
        ) : <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text-muted)',fontSize:13}}>No bounce/return charges found</div>}
      </div>
    )
  }

  const cibil = a.cibil || null

  const openCibil = () => {
    if (!uploadedCibilFile) return
    const url = URL.createObjectURL(uploadedCibilFile)
    window.open(url, '_blank', 'noopener,noreferrer')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }
  const isClosedAccount = (account) => /CLOSED|SETTLED|WRITTEN\s*OFF|CHARGEOFF|CHARGE\s*OFF/i.test((account?.account_status || '').toString()) || !!account?.closed_date
  const formatDpdHistory = (account) => {
    if (account?.dpd_history_formatted) return account.dpd_history_formatted
    const history = Array.isArray(account?.dpd_history) ? account.dpd_history : []
    if (!history.length) return account?.dpd_max !== undefined ? `Max - ${account.dpd_max}` : '—'
    return history
      .map(x => `${x.month} - ${Number(x.days) || 0}`)
      .join(', ')
  }

  const PersonalTab = () => {
    const p = cibil?.personal || {}
    const addresses = Array.isArray(p.addresses) ? p.addresses : []
    return (
      <div style={{padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,marginBottom:14,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>Personal Information</div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{cibil?.filename || uploadedCibilFile?.name || filename || '—'}</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            {uploadedCibilFile && <button className="ctrl-btn" onClick={openCibil}>Open CIBIL File</button>}
          </div>
        </div>

        {!cibil ? (
          <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text-muted)',fontSize:13}}>No CIBIL report analyzed</div>
        ) : cibil.error ? (
          <div style={{background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:10, padding:'12px 16px', fontSize:13, color:'var(--red)'}}>✗ {cibil.error}</div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
            <div className="card" style={{padding:14}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:6}}>Name</div>
              <div style={{fontSize:13,color:'var(--text-primary)'}}>{p.name || '—'}</div>
            </div>
            <div className="card" style={{padding:14}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:6}}>DOB</div>
              <div style={{fontSize:13,color:'var(--text-primary)',fontFamily:'JetBrains Mono,monospace'}}>{p.dob || '—'}</div>
            </div>
            <div className="card" style={{padding:14}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:6}}>PAN</div>
              <div style={{fontSize:13,color:'var(--text-primary)',fontFamily:'JetBrains Mono,monospace'}}>{p.pan || '—'}</div>
            </div>
            <div className="card" style={{padding:14}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:6}}>Gender</div>
              <div style={{fontSize:13,color:'var(--text-primary)'}}>{p.gender || '—'}</div>
            </div>
            <div className="card" style={{padding:14}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:6}}>Mobile</div>
              <div style={{fontSize:13,color:'var(--text-primary)',fontFamily:'JetBrains Mono,monospace'}}>{p.mobile || '—'}</div>
            </div>
            <div className="card" style={{padding:14}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:6}}>Company</div>
              <div style={{fontSize:13,color:'var(--text-primary)'}}>{p.company || '—'}</div>
            </div>
          </div>
        )}

        {addresses.length > 0 && (
          <div className="card" style={{marginTop:12,padding:14}}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:10}}>Residence Address</div>
            <div style={{fontSize:12,color:'var(--text-secondary)',whiteSpace:'pre-wrap'}}>
              {addresses.slice(0, 5).map((a, i) => (
                <div key={i} style={{padding:'6px 0',borderTop:i? '1px solid var(--border)' : 'none'}}>{a}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const ScoreTab = () => {
    const score = cibil && typeof cibil.score === 'number' ? cibil.score : null
    const scoreColor = score === null ? 'gray' : score >= 750 ? 'green' : score >= 650 ? 'amber' : 'red'
    const enq = cibil?.enquiries || {}
    const adverse = Array.isArray(cibil?.adverse_flags) ? cibil.adverse_flags : []
    return (
      <div style={{padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,marginBottom:14,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>CIBIL Score</div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{cibil?.filename || uploadedCibilFile?.name || filename || '—'}</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            {uploadedCibilFile && <button className="ctrl-btn" onClick={openCibil}>Open CIBIL File</button>}
            {score !== null && badge(`Score ${score}`, scoreColor)}
          </div>
        </div>

        {!cibil ? (
          <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text-muted)',fontSize:13}}>No CIBIL report analyzed</div>
        ) : cibil.error ? (
          <div style={{background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:10, padding:'12px 16px', fontSize:13, color:'var(--red)'}}>✗ {cibil.error}</div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
            <div className="card" style={{padding:14}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:6}}>Report Date</div>
              <div style={{fontSize:13,color:'var(--text-primary)',fontFamily:'JetBrains Mono,monospace'}}>{cibil.report_date || '—'}</div>
            </div>
            <div className="card" style={{padding:14}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:6}}>DPD Max</div>
              <div style={{fontSize:13,color:'var(--text-primary)',fontFamily:'JetBrains Mono,monospace'}}>{cibil.dpd_max ?? '—'}</div>
            </div>
            <div className="card" style={{padding:14}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:6}}>Accounts Detected</div>
              <div style={{fontSize:13,color:'var(--text-primary)',fontFamily:'JetBrains Mono,monospace'}}>{Array.isArray(cibil.accounts) ? cibil.accounts.length : 0}</div>
            </div>
            <div className="card" style={{padding:14}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:6}}>Enquiries (total)</div>
              <div style={{fontSize:13,color:'var(--text-primary)',fontFamily:'JetBrains Mono,monospace'}}>{enq.total ?? '—'}</div>
            </div>
          </div>
        )}

        {adverse.length > 0 && (
          <div className="card" style={{marginTop:12,padding:14}}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:10}}>Adverse Flags</div>
            <div style={{fontSize:12,color:'var(--text-secondary)',fontFamily:'JetBrains Mono,monospace',whiteSpace:'pre-wrap'}}>{adverse.join('\n')}</div>
          </div>
        )}
      </div>
    )
  }

  const LoansTab = () => {
    const [query, setQuery] = useState('')
    const [sort, setSort] = useState('opened_desc')

    const accounts = Array.isArray(cibil?.accounts) ? cibil.accounts : []
    const baseRows = useMemo(() => accounts
      .filter(a => a && (a.lender || a.account_type))
      .filter(a => !isClosedAccount(a)), [accounts])

    const sorters = {
      opened_desc: (x, y) => new Date(y.opened_date || 0) - new Date(x.opened_date || 0),
      opened_asc: (x, y) => new Date(x.opened_date || 0) - new Date(y.opened_date || 0),
      lender_asc: (x, y) => norm(x.lender).localeCompare(norm(y.lender)),
      emi_desc: (x, y) => (y.emi || 0) - (x.emi || 0),
      emi_asc: (x, y) => (x.emi || 0) - (y.emi || 0),
      balance_desc: (x, y) => (y.current_balance || 0) - (x.current_balance || 0),
      balance_asc: (x, y) => (x.current_balance || 0) - (y.current_balance || 0),
      overdue_desc: (x, y) => (y.overdue_amount || 0) - (x.overdue_amount || 0),
      overdue_asc: (x, y) => (x.overdue_amount || 0) - (y.overdue_amount || 0),
    }

    const rows = useMemo(() => {
      const q = norm(query).trim()
      return baseRows
        .filter(r => {
          if (!q) return true
          const loanAmt = r.sanctioned_amount || r.high_credit || r.credit_limit || 0
          const dpd = Array.isArray(r.dpd_history) ? r.dpd_history.map(x => `${x.month} ${x.days}`).join(' ') : ''
          const hay = `${r.lender || ''} ${r.account_type || ''} ${r.account_status || ''} ${r.opened_date || ''} ${r.closed_date || ''} ${r.last_payment_date || ''} ${r.account_no || ''} ${r.ownership || ''} ${r.last_update || ''} ${r.emi || ''} ${loanAmt || ''} ${r.current_balance || ''} ${r.overdue_amount || ''} ${r.dpd_max ?? ''} ${dpd}`.toLowerCase()
          const words = q.split(/\s+/)
          return words.every(w => hay.includes(w))
        })
        .slice()
        .sort(sorters[sort] || sorters.opened_desc)
    }, [baseRows, query, sort])

    return (
      <div style={{padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,marginBottom:14,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>Active Loans</div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{rows.length} accounts</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            {uploadedCibilFile && <button className="ctrl-btn" onClick={openCibil}>Open CIBIL File</button>}
          </div>
        </div>

        <Controls
          query={query}
          setQuery={setQuery}
          sort={sort}
          setSort={setSort}
          sortOptions={[
            {id:'opened_desc',label:'Opened ↓'},
            {id:'opened_asc',label:'Opened ↑'},
            {id:'lender_asc',label:'Lender A→Z'},
            {id:'emi_desc',label:'EMI ↓'},
            {id:'emi_asc',label:'EMI ↑'},
            {id:'balance_desc',label:'Balance ↓'},
            {id:'balance_asc',label:'Balance ↑'},
            {id:'overdue_desc',label:'Overdue ↓'},
            {id:'overdue_asc',label:'Overdue ↑'},
          ]}
          onResetControls={() => { setQuery(''); setSort('opened_desc') }}
        />

        {rows.length ? (
          <table>
            <thead><tr><th></th><th>Lender</th><th>Type</th><th>Opened</th><th>Last Payment</th><th style={{textAlign:'right'}}>EMI</th><th style={{textAlign:'right'}}>Loan Amt</th><th style={{textAlign:'right'}}>Balance</th><th style={{textAlign:'right'}}>Overdue</th><th>DPD History</th></tr></thead>
            <tbody>
              {rows.map((x, i) => (
                <tr key={i}>
                  <td className="col-icon"><div className="icon-circle blue">🏦</div></td>
                  <td className="col-name">{x.lender || '—'}<div className="cell-sub">{x.account_type || ''}</div></td>
                  <td className="col-desc" style={{maxWidth:80}}>{x.account_type || '—'}</td>
                  <td className="col-date">{x.opened_date || '—'}</td>
                  <td className="col-date">{x.last_payment_date || '—'}</td>
                  <td className="col-right">{x.emi ? f(x.emi) : '—'}</td>
                  <td className="col-right">{x.sanctioned_amount ? f(x.sanctioned_amount) : (x.high_credit ? f(x.high_credit) : (x.credit_limit ? f(x.credit_limit) : '—'))}</td>
                  <td className="col-right">{x.current_balance ? f(x.current_balance) : '—'}</td>
                  <td className="col-right">{x.overdue_amount ? <span className="amount-debit">{f(x.overdue_amount)}</span> : '—'}</td>
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,maxWidth:220,whiteSpace:'normal'}}>{formatDpdHistory(x)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text-muted)',fontSize:13}}>No active loan accounts detected</div>
        )}
      </div>
    )
  }

  const ClosedLoansTab = () => {
    const [query, setQuery] = useState('')
    const [sort, setSort] = useState('closed_desc')

    const accounts = Array.isArray(cibil?.accounts) ? cibil.accounts : []
    const baseRows = useMemo(() => accounts
      .filter(a => a && (a.lender || a.account_type))
      .filter(a => isClosedAccount(a)), [accounts])

    const sorters = {
      closed_desc: (x, y) => new Date(y.closed_date || y.last_update || 0) - new Date(x.closed_date || x.last_update || 0),
      closed_asc: (x, y) => new Date(x.closed_date || x.last_update || 0) - new Date(y.closed_date || y.last_update || 0),
      lender_asc: (x, y) => norm(x.lender).localeCompare(norm(y.lender)),
      emi_desc: (x, y) => (y.emi || 0) - (x.emi || 0),
      overdue_desc: (x, y) => (y.overdue_amount || 0) - (x.overdue_amount || 0),
    }

    const rows = useMemo(() => {
      const q = norm(query).trim()
      return baseRows
        .filter(r => {
          if (!q) return true
          const dpd = Array.isArray(r.dpd_history) ? r.dpd_history.map(x => `${x.month} ${x.days}`).join(' ') : ''
          const hay = `${r.lender || ''} ${r.account_type || ''} ${r.account_status || ''} ${r.opened_date || ''} ${r.closed_date || ''} ${r.account_no || ''} ${r.emi || ''} ${r.overdue_amount || ''} ${dpd}`.toLowerCase()
          const words = q.split(/\s+/)
          return words.every(w => hay.includes(w))
        })
        .slice()
        .sort(sorters[sort] || sorters.closed_desc)
    }, [baseRows, query, sort])

    return (
      <div style={{padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,marginBottom:14,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>Closed Loans</div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{rows.length} accounts</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            {uploadedCibilFile && <button className="ctrl-btn" onClick={openCibil}>Open CIBIL File</button>}
          </div>
        </div>

        <Controls
          query={query}
          setQuery={setQuery}
          sort={sort}
          setSort={setSort}
          sortOptions={[
            {id:'closed_desc',label:'Closed ↓'},
            {id:'closed_asc',label:'Closed ↑'},
            {id:'lender_asc',label:'Lender A→Z'},
            {id:'emi_desc',label:'EMI ↓'},
            {id:'overdue_desc',label:'Overdue ↓'},
          ]}
          onResetControls={() => { setQuery(''); setSort('closed_desc') }}
        />

        {rows.length ? (
          <table>
            <thead><tr><th></th><th>Lender</th><th>Type</th><th>Status</th><th>Opened</th><th>Closed</th><th style={{textAlign:'right'}}>EMI</th><th style={{textAlign:'right'}}>Overdue</th><th>DPD History</th></tr></thead>
            <tbody>
              {rows.map((x, i) => (
                <tr key={i}>
                  <td className="col-icon"><div className="icon-circle green">✓</div></td>
                  <td className="col-name">{x.lender || '—'}<div className="cell-sub">{x.account_type || ''}</div></td>
                  <td className="col-desc" style={{maxWidth:80}}>{x.account_type || '—'}</td>
                  <td><span className="status-dot green">{x.account_status || 'Closed'}</span></td>
                  <td className="col-date">{x.opened_date || '—'}</td>
                  <td className="col-date">{x.closed_date || x.last_update || '—'}</td>
                  <td className="col-right">{x.emi ? f(x.emi) : '—'}</td>
                  <td className="col-right">{x.overdue_amount ? <span className="amount-debit">{f(x.overdue_amount)}</span> : '—'}</td>
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,maxWidth:220,whiteSpace:'normal'}}>{formatDpdHistory(x)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text-muted)',fontSize:13}}>No closed loan accounts detected</div>
        )}
      </div>
    )
  }

  const InquiryTab = () => {
    const [query, setQuery] = useState('')
    const [sort, setSort] = useState('date_desc')

    const enq = cibil?.enquiries || {}
    const baseRows = Array.isArray(cibil?.enquiry_details) ? cibil.enquiry_details : []

    const sorters = {
      date_desc: (x, y) => new Date(y.date || 0) - new Date(x.date || 0),
      date_asc: (x, y) => new Date(x.date || 0) - new Date(y.date || 0),
      member_asc: (x, y) => norm(x.member).localeCompare(norm(y.member)),
      purpose_asc: (x, y) => norm(x.purpose).localeCompare(norm(y.purpose)),
    }

    const rows = useMemo(() => {
      const q = norm(query).trim()
      return baseRows
        .filter(r => !q || `${r.date || ''} ${r.member || ''} ${r.purpose || ''} ${r.amount || ''} ${r.raw || ''}`.toLowerCase().includes(q))
        .slice()
        .sort(sorters[sort] || sorters.date_desc)
    }, [baseRows, query, sort])

    return (
      <div style={{padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,marginBottom:14,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>Inquiry</div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{rows.length ? `${rows.length} enquiry records` : `Total enquiries: ${enq.total ?? '—'}`}</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            {uploadedCibilFile && <button className="ctrl-btn" onClick={openCibil}>Open CIBIL File</button>}
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          <div className="card" style={{padding:12}}>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>Last 30 Days</div>
            <div style={{fontSize:12,color:'var(--text-secondary)',fontFamily:'JetBrains Mono,monospace'}}>{enq.last_30d ?? '—'}</div>
          </div>
          <div className="card" style={{padding:12}}>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>Last 90 Days</div>
            <div style={{fontSize:12,color:'var(--text-secondary)',fontFamily:'JetBrains Mono,monospace'}}>{enq.last_90d ?? '—'}</div>
          </div>
          <div className="card" style={{padding:12}}>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>Last 180 Days</div>
            <div style={{fontSize:12,color:'var(--text-secondary)',fontFamily:'JetBrains Mono,monospace'}}>{enq.last_180d ?? '—'}</div>
          </div>
          <div className="card" style={{padding:12}}>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>Total</div>
            <div style={{fontSize:12,color:'var(--text-secondary)',fontFamily:'JetBrains Mono,monospace'}}>{enq.total ?? '—'}</div>
          </div>
        </div>

        <div style={{marginTop:12}}>
          <Controls
            query={query}
            setQuery={setQuery}
            sort={sort}
            setSort={setSort}
            sortOptions={[
              {id:'date_desc',label:'Date ↓'},
              {id:'date_asc',label:'Date ↑'},
              {id:'member_asc',label:'Member A→Z'},
              {id:'purpose_asc',label:'Purpose A→Z'},
            ]}
            onResetControls={() => { setQuery(''); setSort('date_desc') }}
          />
        </div>

        {rows.length ? (
          <div style={{marginTop:12}}>
            <table>
              <thead><tr><th></th><th>Member</th><th>Purpose</th><th>Date</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
              <tbody>
                {rows.slice(0, 200).map((x, i) => (
                  <tr key={i}>
                    <td className="col-icon"><div className="icon-circle purple">🔎</div></td>
                    <td className="col-name">{x.member || '—'}<div className="cell-sub">Credit Inquiry</div></td>
                    <td className="col-desc">{x.purpose || '—'}</td>
                    <td className="col-date">{x.date || '—'}</td>
                    <td className="col-right">{x.amount ? f(x.amount) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    )
  }

  const StockMarketTab = () => {
    const [query, setQuery] = useState('')
    const [sort, setSort] = useState('date_desc')
    const [dir, setDir] = useState('ALL')
    const [platform, setPlatform] = useState('ALL')

    const sorters = {
      date_desc: (x, y) => new Date(y.date) - new Date(x.date),
      date_asc: (x, y) => new Date(x.date) - new Date(y.date),
      amount_desc: (x, y) => (y.amount || 0) - (x.amount || 0),
      amount_asc: (x, y) => (x.amount || 0) - (y.amount || 0),
      platform_asc: (x, y) => norm(x.platform).localeCompare(norm(y.platform)),
    }

    const base = a.stock_market || []
    const platforms = useMemo(() => Array.from(new Set(base.map(x => x.platform || 'Stock Market'))).sort(), [base])

    const rows = useMemo(() => {
      const q = norm(query).trim()
      return base
        .filter(r => dir === 'ALL' ? true : (r.direction || '') === dir)
        .filter(r => platform === 'ALL' ? true : (r.platform || 'Stock Market') === platform)
        .filter(r => !q || `${r.date} ${r.direction} ${r.platform} ${r.description} ${r.utr} ${r.reference_id}`.toLowerCase().includes(q))
        .slice()
        .sort(sorters[sort] || sorters.date_desc)
    }, [base, query, sort, dir, platform])

    const debitTotal = useMemo(() => rows.filter(r => r.direction === 'debit').reduce((s, r) => s + (r.amount || 0), 0), [rows])
    const creditTotal = useMemo(() => rows.filter(r => r.direction === 'credit').reduce((s, r) => s + (r.amount || 0), 0), [rows])

    return (
      <div style={{padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>Stock Market Transactions</div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{rows.length} transactions</div>
          </div>
          <div style={{display:'flex',gap:14,alignItems:'baseline'}}>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:11,color:'var(--text-muted)'}}>Credits</div>
              <div style={{fontSize:16,fontWeight:700,color:'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>{f(creditTotal)}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:11,color:'var(--text-muted)'}}>Debits</div>
              <div style={{fontSize:16,fontWeight:700,color:'var(--red)',fontFamily:'JetBrains Mono,monospace'}}>{f(debitTotal)}</div>
            </div>
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
            {id:'platform_asc',label:'Platform A→Z'},
          ]}
          extra={(
            <>
              <select className="ctrl" value={dir} onChange={e=>setDir(e.target.value)}>
                <option value="ALL">All directions</option>
                <option value="debit">debit</option>
                <option value="credit">credit</option>
              </select>
              <select className="ctrl" value={platform} onChange={e=>setPlatform(e.target.value)}>
                <option value="ALL">All platforms</option>
                {platforms.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </>
          )}
          onResetControls={()=>{ setQuery(''); setSort('date_desc'); setDir('ALL'); setPlatform('ALL') }}
        />

        {rows.length ? (
          <table>
            <thead><tr><th></th><th>Platform</th><th>Direction</th><th>Description</th><th>Date</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {rows.map((x,i)=>(
                <tr key={i} onClick={()=>openTx(x)} style={{cursor:'pointer'}}>
                  <td className="col-icon"><div className="icon-circle amber">📈</div></td>
                  <td className="col-name">{x.platform || 'Stock Market'}<div className="cell-sub">{x.direction==='credit' ? 'Credit Received' : 'Debit Sent'}</div></td>
                  <td><span className={`status-dot ${x.direction==='credit' ? 'green' : x.direction==='debit' ? 'red' : 'gray'}`}>{x.direction || '—'}</span></td>
                  <td className="col-desc">{(x.description || '').slice(0, 110)}</td>
                  <td className="col-date">{x.date}</td>
                  <td className="col-right"><span className={x.direction==='credit'?'amount-credit':'amount-debit'}>{f(x.amount)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text-muted)',fontSize:13}}>No stock market transactions found</div>}
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
            <thead><tr><th></th><th>Lender</th><th>Type</th><th>Description</th><th>Date</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {rows.map((l,i)=>(
                <tr key={i} onClick={()=>openTx(l)} style={{cursor:'pointer'}}>
                  <td className="col-icon"><div className="icon-circle red">🏦</div></td>
                  <td className="col-name">{l.bank}<div className="cell-sub">{l.type || 'EMI'}</div></td>
                  <td>{badge(l.type || 'OTHER', typeColor(l.type))}</td>
                  <td className="col-desc">{(l.description||'').slice(0,80)}</td>
                  <td className="col-date">{l.date}</td>
                  <td className="col-right"><span className="amount-debit">{f(l.emi_amount)}</span></td>
                </tr>
              ))}
              {apy.map((x,i)=>(
                <tr key={`apy-${i}`} onClick={()=>openTx(x)} style={{cursor:'pointer'}}>
                  <td className="col-icon"><div className="icon-circle amber">💰</div></td>
                  <td className="col-name">Atal Pension Yojana<div className="cell-sub">Pension</div></td>
                  <td><span className="badge badge-amber">APY</span></td>
                  <td className="col-desc">{(x.description||'').slice(0,80)}</td>
                  <td className="col-date">{x.date}</td>
                  <td className="col-right"><span className="amount-invest">{f(x.amount)}</span></td>
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
          <div style={{ fontSize:19, fontWeight:600, color:'var(--text-primary)' }}>{isBoth ? 'Combined Analysis' : isCibil ? 'CIBIL Analysis' : 'Statement Analysis'}</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'JetBrains Mono,monospace', marginTop:2 }}>
            {isBoth ? `${result?.cibil_filename || 'CIBIL'} + ${result?.statement_filename || 'Statement'} · ${transaction_count} transactions` : isCibil ? (cibil?.filename || filename || '—') : `${filename} · ${transaction_count} transactions ${as?.period ? `· ${as.period}` : ''}`}
          </div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          {isCibil && (
            <>
              <button
                onClick={()=>exportCibil('xlsx')}
                disabled={exporting}
                style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', padding:'6px 12px', borderRadius:8, fontSize:12, cursor:exporting?'not-allowed':'pointer', opacity:exporting?.6:1 }}
              >
                {exporting ? 'Exporting...' : 'Export XLSX'}
              </button>
              <button
                onClick={()=>exportCibil('csv')}
                disabled={exporting}
                style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', padding:'6px 12px', borderRadius:8, fontSize:12, cursor:exporting?'not-allowed':'pointer', opacity:exporting?.6:1 }}
              >
                Export CSV
              </button>
            </>
          )}
          {!isCibil && (
            <>
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
            </>
          )}
          {isBoth && (
            <>
              <button
                onClick={()=>exportCibil('xlsx')}
                disabled={exporting}
                style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', padding:'6px 12px', borderRadius:8, fontSize:12, cursor:exporting?'not-allowed':'pointer', opacity:exporting?.6:1 }}
              >
                {exporting ? 'Exporting...' : 'Export CIBIL XLSX'}
              </button>
            </>
          )}
          <button onClick={onReset} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', padding:'6px 14px', borderRadius:8, fontSize:12, cursor:'pointer' }}>← New Analysis</button>
        </div>
      </div>

      {!isCibil && !isBoth && <SummaryCards a={a} />}

      <div className="tab-wrapper">
        {!canScrollLeft && <div className="tab-arrow left hidden">‹</div>}
        {canScrollLeft && <div className="tab-arrow left" onClick={()=>scrollTabs(-1)}>‹</div>}
        <div className="tab-bar" ref={tabBarRef} onScroll={checkScroll}>
          {tabs.map(t => (
            <button key={t.id} className={`tab-btn ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        {!canScrollRight && <div className="tab-arrow right hidden">›</div>}
        {canScrollRight && <div className="tab-arrow right" onClick={()=>scrollTabs(1)}>›</div>}
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {isBoth ? (
          <>
            {tab==='obligations' && <ObligationsEligibilityTab a={a} />}
            {tab==='profile' && <ProfileTab a={a} />}
            {tab==='emiLoans' && <EmiLoansTab a={a} />}
            {tab==='creditCards' && <CreditCardsCombinedTab a={a} />}
            {tab==='bounces' && <BouncesChargesTab a={a} />}
            {tab==='insights' && <InsightsCombinedTab a={a} />}
          </>
        ) : isCibil ? (
          <>
            {tab==='personal' && <PersonalTab />}
            {tab==='score' && <ScoreTab />}
            {tab==='eligibility' && <LoanEligibilityTab underwriting={a.underwriting} />}
            {tab==='loans' && <LoansTab />}
            {tab==='closedLoans' && <ClosedLoansTab />}
            {tab==='inquiry' && <InquiryTab />}
          </>
        ) : (
          <>
            {tab==='overview' && <OverviewTab a={a} />}
            {tab==='salary' && <SalaryTab />}
            {tab==='pf' && <PFTab />}
            {tab==='emi' && <EMITab />}
            {tab==='disbursement' && <DisbursementTab />}
            {tab==='creditCard' && <CreditCardTab />}
            {tab==='bounces' && <BouncesTab />}
            {tab==='stock' && <StockMarketTab />}
            {tab==='investments' && <InvestmentsTab a={a} onTx={openTx} />}
            {tab==='appLoans' && <AppLoansTab a={a} onTx={openTx} />}
            {tab==='transfers' && <TransfersTab a={a} onTx={openTx} />}
            {tab==='monthly' && <MonthlyTab a={a} />}
            {tab==='insights' && <InsightsTab a={a} onTx={openTx} />}
          </>
        )}
      </div>

      {!isCibil && <TxModal open={txOpen} tx={selectedTx} file={uploadedStatementFile} filename={filename} onClose={() => { setTxOpen(false); setSelectedTx(null) }} />}
    </div>
  )
}
