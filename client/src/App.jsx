import { useState } from 'react'
import UploadZone from './components/UploadZone'
import Dashboard from './components/Dashboard'
import Header from './components/Header'
import LoadingScreen from './components/LoadingScreen'

export default function App() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadedCibilFile, setUploadedCibilFile] = useState(null)

  async function handleAnalyze(file, cibilFile, cibilPassword) {
    setUploadedFile(file)
    setUploadedCibilFile(cibilFile || null)
    setLoading(true); setError(null); setResult(null)
    const formData = new FormData()
    let endpoint = '/api/analyze'
    if (file) formData.append('statement', file)
    if (cibilFile) formData.append('cibil', cibilFile)
    if (cibilPassword) formData.append('cibil_password', cibilPassword)
    if (!file && cibilFile) endpoint = '/api/analyze-cibil'
    try {
      const res = await fetch(endpoint, { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleTextAnalyze(text) {
    setUploadedFile(null)
    setUploadedCibilFile(null)
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch('/api/analyze-text', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult({ ...data, filename: 'Pasted Text' })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Header onReset={result ? () => { setResult(null); setError(null); setUploadedFile(null); setUploadedCibilFile(null) } : null} />
      <main style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
        {loading && <LoadingScreen />}
        {!loading && !result && <UploadZone onAnalyze={handleAnalyze} onTextAnalyze={handleTextAnalyze} error={error} />}
        {!loading && result && <Dashboard result={result} uploadedFile={uploadedFile} uploadedCibilFile={uploadedCibilFile} onReset={() => { setResult(null); setError(null); setUploadedFile(null); setUploadedCibilFile(null) }} />}
      </main>
    </div>
  )
}
