import { useState } from 'react'
import Sidebar from './components/Sidebar'
import UploadZone from './components/UploadZone'
import CombinedUpload from './components/CombinedUpload'
import Dashboard from './components/Dashboard'
import LoadingScreen from './components/LoadingScreen'

export default function App() {
  const [mode, setMode] = useState('statement')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [uploadedStatementFile, setUploadedStatementFile] = useState(null)
  const [uploadedCibilFile, setUploadedCibilFile] = useState(null)
  const apiUrl = 'http://localhost:5000/api/';

  async function handleAnalyzeStatement(file, statementPassword) {
    setUploadedStatementFile(file)
    setUploadedCibilFile(null)
    setLoading(true); setError(null); setResult(null)
    const formData = new FormData()
    if (file) formData.append('statement', file)
    if (statementPassword) formData.append('statement_password', statementPassword)
    try {
      const res = await fetch(apiUrl + 'analyze', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleAnalyzeCibil(cibilFile, cibilPassword) {
    setUploadedStatementFile(null)
    setUploadedCibilFile(cibilFile || null)
    setLoading(true); setError(null); setResult(null)
    const formData = new FormData()
    if (cibilFile) formData.append('cibil', cibilFile)
    if (cibilPassword) formData.append('cibil_password', cibilPassword)
    try {
      const res = await fetch(apiUrl + 'analyze-cibil', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleAnalyzeBoth(cibilFile, stmtFile, cibilPassword, stmtPassword) {
    setUploadedCibilFile(cibilFile || null)
    setUploadedStatementFile(stmtFile || null)
    setLoading(true); setError(null); setResult(null)
    const formData = new FormData()
    if (cibilFile) formData.append('cibil', cibilFile)
    if (stmtFile) formData.append('statement', stmtFile)
    if (cibilPassword) formData.append('cibil_password', cibilPassword)
    if (stmtPassword) formData.append('statement_password', stmtPassword)
    try {
      const res = await fetch(apiUrl + 'analyze-both', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleTextAnalyze(text) {
    setUploadedStatementFile(null)
    setUploadedCibilFile(null)
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch(apiUrl + 'analyze-text', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult({ ...data, filename: 'Pasted Text' })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const resetAll = () => { setResult(null); setError(null); setUploadedStatementFile(null); setUploadedCibilFile(null) }

  const handleModeChange = (next) => {
    setMode(next)
    setResult(null)
    setError(null)
    setUploadedStatementFile(null)
    setUploadedCibilFile(null)
  }

  const isCibilMode = mode === 'cibil'

  return (
    <div className="app-layout">
      <Sidebar mode={mode} onModeChange={handleModeChange} />
      <div className="app-main">
        <div className="app-main-header">
          <div style={{fontSize:12, color:'var(--text-muted)'}}>
            {result ? (mode === 'both' ? 'Combined Analysis' : isCibilMode ? 'CIBIL Analysis' : 'Statement Analysis') : mode === 'both' ? 'Combined Mode' : mode === 'cibil' ? 'CIBIL Mode' : 'Statement Mode'}
          </div>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            {result && (
              <button onClick={resetAll} style={{
                background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)',
                padding:'5px 14px', borderRadius:6, fontSize:12, cursor:'pointer'
              }}>← New Analysis</button>
            )}
          </div>
        </div>
        <div className="app-content">
          {loading && <LoadingScreen />}
          {!loading && !result && mode === 'both' && (
            <CombinedUpload onAnalyze={handleAnalyzeBoth} error={error} />
          )}
          {!loading && !result && mode !== 'both' && (
            <UploadZone
              mode={mode}
              onAnalyze={mode === 'cibil' ? handleAnalyzeCibil : handleAnalyzeStatement}
              onTextAnalyze={mode === 'statement' ? handleTextAnalyze : null}
              error={error}
            />
          )}
          {!loading && result && (
            <Dashboard
              mode={mode}
              result={result}
              uploadedStatementFile={uploadedStatementFile}
              uploadedCibilFile={uploadedCibilFile}
              onReset={resetAll}
            />
          )}
        </div>
      </div>
    </div>
  )
}

