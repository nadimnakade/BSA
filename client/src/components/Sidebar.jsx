const modes = [
  { id: 'statement', icon: '🏦', label: 'Statement', desc: 'Bank statement analysis' },
  { id: 'cibil', icon: '🧾', label: 'CIBIL', desc: 'Credit report analysis' },
  { id: 'both', icon: '🔗', label: 'Both', desc: 'Combined underwriting' },
]

export default function Sidebar({ mode, onModeChange }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="https://1up.co.in/images/1up.png" alt="1UP" style={{width:36, height:36}} />
        <div>
          <div style={{fontWeight:600, fontSize:13, color:'var(--text-primary)', lineHeight:1.2}}>AI UNDERWRITING</div>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">Analysis Mode</div>
        {modes.map(m => (
          <button
            key={m.id}
            className={`sidebar-item ${mode === m.id ? 'active' : ''}`}
            onClick={() => onModeChange(m.id)}
          >
            <span className="sidebar-item-icon">{m.icon}</span>
            <div>
              <div className="sidebar-item-label">{m.label}</div>
              <div className="sidebar-item-desc">{m.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-label">Info</div>
        <div className="sidebar-info">
          <div>🔒 100% Private</div>
          <div>⚡ No AI · Rule-Based</div>
          <div>📂 Files saved locally</div>
        </div>
      </div>
    </aside>
  )
}
