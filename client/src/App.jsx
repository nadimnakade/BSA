import { useState } from 'react'
import UploadZone from './components/UploadZone'
import CombinedUpload from './components/CombinedUpload'
import Dashboard from './components/Dashboard'
import Header from './components/Header'
import LoadingScreen from './components/LoadingScreen'

export default function App() {
  const [mode, setMode] = useState('statement')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [uploadedStatementFile, setUploadedStatementFile] = useState(null)
  const [uploadedCibilFile, setUploadedCibilFile] = useState(null)
  const apiUrl = 'http://localhost:5000/api/';
  //const apiUrl = "http://10.10.10.99:5000/api/";

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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Header
        mode={mode}
        onModeChange={(next) => {
          setMode(next)
          setResult(null)
          setError(null)
          setUploadedStatementFile(null)
          setUploadedCibilFile(null)
        }}
        onReset={result ? resetAll : null}
      />
      <main style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
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
            mode={result.mode === 'both' ? 'cibil' : mode}
            result={result}
            uploadedStatementFile={uploadedStatementFile}
            uploadedCibilFile={uploadedCibilFile}
            onReset={resetAll}
          />
        )}
      </main>
    </div>
  )
}
