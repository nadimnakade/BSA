import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
const f = n => n>=100000?`₹${(n/100000).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(1)}K`:`₹${n.toFixed(0)}`
const COLORS = ['#22c55e','#ef4444','#f59e0b','#3b82f6','#a855f7','#14b8a6','#f97316','#ec4899']
const Tip = ({active,payload}) => active&&payload?.length ? (
  <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px',fontSize:12}}>
    <div style={{color:'var(--text-primary)',fontWeight:500}}>{payload[0].name}</div>
    <div style={{color:payload[0].fill||'var(--blue)',fontFamily:'JetBrains Mono'}}>{f(payload[0].value)}</div>
  </div>
) : null

export default function OverviewTab({ a }) {
  const loanT = a.loans.reduce((s,x)=>s+(x.emi_amount||0),0)
  const rentT = a.rent.reduce((s,x)=>s+x.amount,0)
  const sipT = a.sip_investments.reduce((s,x)=>s+x.amount,0)
  const insT = a.insurance.reduce((s,x)=>s+x.amount,0)
  const appT = a.app_loans.reduce((s,x)=>s+x.amount,0)
  const utilT = a.utilities.reduce((s,x)=>s+x.amount,0)
  const apyT = (a.apy_pension||[]).reduce((s,x)=>s+x.amount,0)
  const salT = a.salary.reduce((s,x)=>s+x.amount,0)
  const pfT = (a.pf_credits||[]).reduce((s,x)=>s+x.amount,0)
  const transOut = (a.family_transfers?.out||[]).reduce((s,x)=>s+x.amount,0)

  const pie = [
    loanT>0&&{name:'Loan EMIs',value:loanT},
    rentT>0&&{name:'Rent',value:rentT},
    sipT>0&&{name:'SIP/Invest',value:sipT},
    insT>0&&{name:'Insurance',value:insT},
    appT>0&&{name:'App Loans',value:appT},
    apyT>0&&{name:'APY Pension',value:apyT},
    utilT>0&&{name:'Utilities',value:utilT},
  ].filter(Boolean)

  const bar = [
    {name:'Salary',value:salT,fill:'#22c55e'},
    {name:'PF Credit',value:pfT,fill:'#14b8a6'},
    {name:'Loan EMIs',value:loanT,fill:'#ef4444'},
    {name:'Family Transfer',value:transOut,fill:'#a855f7'},
    {name:'Investments',value:sipT+insT,fill:'#f59e0b'},
    {name:'Utilities',value:utilT,fill:'#3b82f6'},
  ].filter(d=>d.value>0)

  return (
    <div style={{padding:24}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:32}}>
        <div>
          <div style={{fontSize:13,fontWeight:500,color:'var(--text-secondary)',marginBottom:14}}>Expense Breakdown</div>
          {pie.length>0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pie} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value" stroke="none">
                  {pie.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip content={<Tip />} />
                <Legend formatter={v=><span style={{fontSize:11,color:'var(--text-secondary)'}}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{height:240,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-muted)',fontSize:13}}>No expense data</div>}
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:500,color:'var(--text-secondary)',marginBottom:14}}>Income vs Obligations</div>
          {bar.length>0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={bar} barSize={36}>
                <XAxis dataKey="name" tick={{fontSize:10,fill:'var(--text-secondary)'}} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={f} tick={{fontSize:10,fill:'var(--text-secondary)'}} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} cursor={{fill:'rgba(255,255,255,.04)'}} />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {bar.map((d,i)=><Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </div>
      <div style={{marginTop:20,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        {[
          {l:'Salary',v:salT,c:'var(--green)'},{l:'PF Credits',v:pfT,c:'var(--teal)'},
          {l:'Loan EMIs',v:loanT,c:'var(--red)'},{l:'APY Pension',v:apyT,c:'var(--amber)'},
          {l:'App Loans',v:appT,c:'var(--purple)'},{l:'SIP/MF',v:sipT,c:'var(--amber)'},
          {l:'Insurance',v:insT,c:'var(--teal)'},{l:'Utilities',v:utilT,c:'var(--blue)'},
        ].map(x=>(
          <div key={x.l} style={{background:'var(--bg-secondary)',borderRadius:8,padding:'10px 12px'}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>{x.l}</div>
            <div style={{fontSize:14,fontWeight:600,color:x.c,fontFamily:'JetBrains Mono,monospace'}}>{f(x.v)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
