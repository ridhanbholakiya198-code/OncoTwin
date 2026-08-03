import { useEffect, useState } from 'react'
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { runBenchmark, SAMPLE_BENCHMARK_CASES } from '../lib/benchmarkEngine.js'
import Card from '../components/Card.jsx'
import ErrorDetails from '../components/ErrorDetails.jsx'
import AnchorDot from '../components/AnchorDot.jsx'

const SCORE_STYLES = {
  match: { label: 'MATCH', color: 'text-established' },
  partial: { label: 'PARTIAL MATCH', color: 'text-theoretical' },
  miss: { label: 'MISS', color: 'text-speculative' },
}

export default function CaseWorkspaceBenchmark() {
  const { user } = useAuth()
  const [caseId, setCaseId] = useState('')
  const [settings, setSettings] = useState(null)
  const [status, setStatus] = useState('idle')
  const [logs, setLogs] = useState([])
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [fullError, setFullError] = useState(null)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (snap.exists()) setSettings(snap.data().settings || null)
    })
  }, [user])

  async function handleRun() {
    const benchmarkCase = SAMPLE_BENCHMARK_CASES.find((c) => c.id === caseId)
    if (!benchmarkCase) {
      setErrorMsg('Select a historical case first.')
      return
    }

    setStatus('running')
    setErrorMsg('')
    setLogs([])
    setResult(null)

    const provider = settings?.defaultModel || 'claude'
    const apiKey = settings?.byokKeys?.[provider]

    try {
      const benchResult = await runBenchmark({
        benchmarkCase,
        provider,
        apiKey,
        onLog: (entry) => setLogs((prev) => [...prev, entry]),
      })
      setResult(benchResult)
      if (user) {
        await addDoc(collection(db, 'users', user.uid, 'runs'), {
          type: 'benchmark',
          benchmarkCaseId: caseId,
          provider: provider,
          realOutcome: benchResult.realOutcome,
          hypotheses: benchResult.hypotheses,
          score: benchResult.score.level,
          createdAt: serverTimestamp(),
        })
      }
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message)
      setFullError(err)
    }
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <Card title="Blind validation">
        <p className="text-sm text-muted leading-relaxed mb-4">
          The engine receives only the pre-treatment data below — the real outcome is withheld
          until after it produces its ranked hypotheses.
        </p>
        <select
          value={caseId}
          onChange={(e) => setCaseId(e.target.value)}
          className="w-full bg-surface2 border border-border rounded px-3 py-2 text-sm text-ink mb-4"
        >
          <option value="">No historical case loaded</option>
          {SAMPLE_BENCHMARK_CASES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <button
          onClick={handleRun}
          disabled={status === 'running'}
          className="px-4 py-2 rounded bg-accent text-bg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {status === 'running' ? 'Running blind prediction…' : 'Run blind prediction'}
        </button>
      </Card>

      <Card title="Scoring key">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="border border-border rounded p-3">
            <p className="text-established font-mono text-xs mb-1">MATCH</p>
            <p className="text-muted text-xs">Top prediction aligns with the real treatment used</p>
          </div>
          <div className="border border-border rounded p-3">
            <p className="text-theoretical font-mono text-xs mb-1">PARTIAL MATCH</p>
            <p className="text-muted text-xs">Overlapping mechanism, different specifics</p>
          </div>
          <div className="border border-border rounded p-3">
            <p className="text-speculative font-mono text-xs mb-1">MISS</p>
            <p className="text-muted text-xs">No meaningful overlap with the real outcome</p>
          </div>
        </div>
      </Card>

      {logs.length > 0 && (
        <Card title="Run log">
          <div className="space-y-1 font-mono text-xs text-muted">
            {logs.map((l, i) => <div key={i}>[{l.step}] {l.message}</div>)}
          </div>
        </Card>
      )}

      {errorMsg && (
        <Card>
          <p className="text-sm text-speculative">{errorMsg}</p>
          <ErrorDetails error={fullError} />
        </Card>
      )}

      {result && (
        <>
          <Card title="Result">
            {(() => {
              const provider = settings?.defaultModel || 'claude';
              const hasKey = !!settings?.byokKeys?.[provider]?.trim();
              return (
                <p className={`text-[11px] mb-3 font-mono ${hasKey ? 'text-muted' : 'text-speculative'}`}>
                  {hasKey 
                    ? `Using: ${provider}`
                    : `Using: Gemini (shared free tier — no ${provider} key configured)`}
                </p>
              );
            })()}
            <p className={`font-mono text-sm mb-3 ${SCORE_STYLES[result.score.level].color}`}>
              {SCORE_STYLES[result.score.level].label}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[11px] text-muted uppercase font-mono mb-1">Engine's top hypothesis</p>
                <p className="text-ink/90">{result.hypotheses[0]?.title || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted uppercase font-mono mb-1">Real historical outcome</p>
                <p className="text-ink/90">{result.realOutcome.treatmentUsed}</p>
              </div>
            </div>
          </Card>

          <Card title="Full ranked hypotheses">
            <div className="space-y-3">
              {result.hypotheses.map((h, i) => (
                <div key={i} className="border border-border rounded p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-ink">{h.title}</p>
                    <AnchorDot status={h.anchor} withLabel />
                  </div>
                  <p className="text-xs text-ink/80">{h.mechanism}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
