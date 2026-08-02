import { useEffect, useState } from 'react'
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { runMultiAgentEngine, AGENT_DEFS } from '../lib/multiAgentEngine.js'
import Card from '../components/Card.jsx'
import ErrorDetails from '../components/ErrorDetails.jsx'
import AnchorDot from '../components/AnchorDot.jsx'

const FIELD_KEYS = [
  { key: 'mutationProfile', label: 'Mutation profile', placeholder: 'e.g. EGFR Exon 19 deletion' },
  { key: 'stage', label: 'Stage', placeholder: 'e.g. Stage IV' },
  { key: 'priorTreatment', label: 'Prior treatment', placeholder: 'e.g. none / 1st-line TKI' },
  { key: 'biomarkers', label: 'Relevant biomarkers', placeholder: 'e.g. PD-L1 TPS %' },
]

export default function MultiAgentReasoning() {
  const { user } = useAuth()
  const [form, setForm] = useState({ mutationProfile: '', stage: '', priorTreatment: '', biomarkers: '' })
  const [settings, setSettings] = useState(null)
  const [status, setStatus] = useState('idle')
  const [agentOutputs, setAgentOutputs] = useState({})
  const [consensus, setConsensus] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [fullError, setFullError] = useState(null)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (snap.exists()) setSettings(snap.data().settings || null)
    })
  }, [user])

  async function handleRun() {
    setStatus('running')
    setErrorMsg('')
    setAgentOutputs({})
    setConsensus(null)

    const agentModels = settings?.agentModels || {}
    const apiKeys = settings?.byokKeys || {}

    try {
      const result = await runMultiAgentEngine({
        caseInput: form,
        agentModels,
        apiKeys,
        onAgentDone: (agentId, output) => {
          setAgentOutputs((prev) => ({ ...prev, [agentId]: output }))
        },
      })
      setConsensus(result.consensus)
      if (result.consensusError) setErrorMsg(result.consensusError)
      if (user) {
        await addDoc(collection(db, 'users', user.uid, 'runs'), {
          type: 'multi_agent',
          caseInput: form,
          agentModels,
          transcript: result.transcript,
          consensus: result.consensus,
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
      <Card title="Case input">
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          {FIELD_KEYS.map((f) => (
            <div key={f.key}>
              <label className="text-xs text-muted mb-1 block">{f.label}</label>
              <input
                value={form[f.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full bg-surface2 border border-border rounded px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-accent outline-none"
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleRun}
          disabled={status === 'running'}
          className="mt-4 px-4 py-2 rounded bg-accent text-bg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {status === 'running' ? 'Agents running…' : 'Run all agents'}
        </button>
        <p className="text-[11px] text-muted mt-2">
          Assign each agent's model in <span className="text-accent">Settings → Multi-agent model assignment</span> first.
        </p>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-[380px]:grid-cols-1">
        {AGENT_DEFS.filter((a) => a.id !== 'consensus').map((a) => {
          const provider = settings?.agentModels?.[a.id] || 'claude';
          const hasKey = !!settings?.byokKeys?.[provider]?.trim();
          // The engine skips if it's not the default provider (Gemini).
          // Assuming defaultProvider is 'gemini' for the shared key check:
          const isDefault = provider === 'gemini';
          
          return (
            <Card key={a.id} title={a.name}>
              {status === 'done' || agentOutputs[a.id] ? (
                 <p className={`text-[10px] mb-2 font-mono ${hasKey ? 'text-muted' : 'text-speculative'}`}>
                   {hasKey 
                     ? `Using: ${provider}` 
                     : (isDefault 
                         ? `Using: Gemini (shared free tier — no ${provider} key configured)`
                         : `Skipped — no API key configured for ${provider}`)}
                 </p>
              ) : null}
              <p className="text-xs text-ink/80 whitespace-pre-wrap min-h-[2rem]">
                {agentOutputs[a.id] || (status === 'running' ? '…thinking' : '—')}
              </p>
            </Card>
          );
        })}
      </div>

      {errorMsg && (
        <Card>
          <p className="text-sm text-speculative">{errorMsg}</p>
          <ErrorDetails error={fullError} />
        </Card>
      )}

      {consensus && (
        <Card title="Consensus — final ranked hypotheses">
          {(() => {
            const provider = settings?.agentModels?.consensus || 'claude';
            const hasKey = !!settings?.byokKeys?.[provider]?.trim();
            const isDefault = provider === 'gemini';
            return (
              <p className={`text-[10px] mb-4 font-mono ${hasKey ? 'text-muted' : 'text-speculative'}`}>
                {hasKey 
                  ? `Using: ${provider}` 
                  : (isDefault 
                      ? `Using: Gemini (shared free tier — no ${provider} key configured)`
                      : `Skipped — no API key configured for ${provider}`)}
              </p>
            );
          })()}
          <div className="space-y-4">
            {consensus.hypotheses?.map((h, i) => (
              <div key={i} className="border border-border rounded p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium text-ink">{h.title}</p>
                  <AnchorDot status={h.anchor} withLabel />
                </div>
                <p className="text-xs text-ink/80 mb-2">{h.mechanism}</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted font-mono mb-2 max-sm:grid-cols-1">
                  <span>Evidence strength: {h.evidenceStrength}</span>
                  <span>Supporting studies: {h.supportingStudies}</span>
                </div>
                {h.criticNote && <p className="text-[11px] text-theoretical/90 mb-1">Critic note: {h.criticNote}</p>}
                <p className="text-[11px] text-speculative/90">Limitations: {h.limitations}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
