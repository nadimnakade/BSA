import { useEffect, useState } from 'react'

export default function Header({ onReset, mode = 'statement', onModeChange }) {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('theme')
      return stored === 'light' || stored === 'dark' ? stored : 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <header style={{
      background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)',
      padding:'0 20px', height:52, display:'flex', alignItems:'center',
      justifyContent:'space-between', position:'sticky', top:0, zIndex:100
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20 }}>{mode === 'cibil' ? '🧾' : '🏦'}</span>
        <div>
          <div style={{ fontWeight:600, fontSize:14, color:'var(--text-primary)', lineHeight:1 }}>{mode === 'cibil' ? 'CIBIL Analyzer' : 'Bank Statement Analyzer'}</div>
          <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'JetBrains Mono,monospace' }}>Rule-Based · No AI · Instant Results</div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {onModeChange && (
          <div style={{ display:'flex', gap:6 }}>
            <button
              onClick={() => onModeChange('statement')}
              style={{
                background: mode === 'statement' ? 'var(--bg-card)' : 'transparent',
                border:'1px solid var(--border)',
                color:'var(--text-secondary)',
                padding:'5px 10px',
                borderRadius:6,
                fontSize:12,
                cursor:'pointer'
              }}
            >
              Statement
            </button>
            <button
              onClick={() => onModeChange('cibil')}
              style={{
                background: mode === 'cibil' ? 'var(--bg-card)' : 'transparent',
                border:'1px solid var(--border)',
                color:'var(--text-secondary)',
                padding:'5px 10px',
                borderRadius:6,
                fontSize:12,
                cursor:'pointer'
              }}
            >
              CIBIL
            </button>
          </div>
        )}
        <button
          onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
          style={{
            background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)',
            padding:'5px 10px', borderRadius:6, fontSize:12, cursor:'pointer'
          }}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          title={theme === 'light' ? 'Dark mode' : 'Light mode'}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        {onReset && (
          <button onClick={onReset} style={{
            background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)',
            padding:'5px 14px', borderRadius:6, fontSize:12, cursor:'pointer'
          }}>← New Analysis</button>
        )}
      </div>
    </header>
  )
}
