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

  async function handleAnalyze(file) {
    setUploadedFile(file)
    setLoading(true); setError(null); setResult(null)
    const formData = new FormData()
    formData.append('statement', file)
    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleTextAnalyze(text) {
    setUploadedFile(null)
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
      <Header onReset={result ? () => { setResult(null); setError(null); setUploadedFile(null) } : null} />
      <main style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
        {loading && <LoadingScreen />}
        {!loading && !result && <UploadZone onAnalyze={handleAnalyze} onTextAnalyze={handleTextAnalyze} error={error} />}
        {!loading && result && <Dashboard result={result} uploadedFile={uploadedFile} onReset={() => { setResult(null); setError(null); setUploadedFile(null) }} />}
      </main>
    </div>
  )
}
