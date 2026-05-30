import { useState, useEffect } from 'react'
const STEPS = [
  'Extracting transactions from file...',
  'Parsing dates, amounts and descriptions...',
  'Detecting salary and income patterns...',
  'Identifying loan EMIs and NACH debits...',
  'Scanning for SIPs, insurance, app loans...',
  'Computing financial health metrics...',
  'Building your dashboard...'
]
export default function LoadingScreen() {
  const [step, setStep] = useState(0)
  const [dots, setDots] = useState('')
  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s+1, STEPS.length-1)), 600)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length>=3?'':d+'.'), 400)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:28 }}>
      <div style={{ width:64, height:64, borderRadius:'50%', border:'3px solid var(--border)', borderTopColor:'var(--blue)', animation:'spin 0.8s linear infinite', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>🏦</div>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:17, fontWeight:600, color:'var(--text-primary)', marginBottom:6 }}>Analyzing{dots}</div>
        <div style={{ fontSize:13, color:'var(--text-secondary)', fontFamily:'JetBrains Mono,monospace' }}>{STEPS[step]}</div>
      </div>
      <div style={{ width:280 }}>
        {STEPS.map((s,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'3px 0', opacity:i<=step?1:0.2, transition:'opacity 0.3s' }}>
            <div style={{ width:14, height:14, borderRadius:'50%', flexShrink:0, background:i<step?'var(--green)':i===step?'var(--blue)':'var(--bg-hover)', border:`2px solid ${i<step?'var(--green)':i===step?'var(--blue)':'var(--border)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, color:'#fff' }}>{i<step?'✓':''}</div>
            <span style={{ fontSize:11, color:i===step?'var(--text-primary)':'var(--text-muted)' }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
