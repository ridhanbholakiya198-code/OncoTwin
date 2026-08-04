import { useEffect, useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import Card from '../components/Card.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { AGENT_DEFS } from '../lib/multiAgentEngine.js'

const PROVIDERS = [
  { id: 'claude', label: 'Claude', free: true },
  { id: 'gpt', label: 'GPT', free: true },
  { id: 'gemini', label: 'Gemini', free: false },
  { id: 'grok', label: 'Grok', free: false },
]

export default function Settings() {
  const { user, getUserDoc } = useAuth()
  const [keys, setKeys] = useState({})
  const [defaultModel, setDefaultModel] = useState('gemini')
  const [maxIterations, setMaxIterations] = useState(25)
  const [agentModels, setAgentModels] = useState({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    getUserDoc(user.uid).then((data) => {
      if (data?.settings) {
        setKeys(data.settings.byokKeys || {})
        setDefaultModel(data.settings.defaultModel || 'claude')
        setMaxIterations(data.settings.maxIterations || 25)
        setAgentModels(data.settings.agentModels || {})
      }
    }).catch(console.error)
  }, [user])

  async function save() {
    if (!user) return
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { settings: { byokKeys: keys, defaultModel, maxIterations, agentModels } },
        { merge: true }
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
      alert("Failed to save settings: " + e.message)
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <Card title="AI providers — bring your own key">
        <p className="text-xs text-muted mb-4 leading-relaxed">
          Keys are stored on your account only and used to call each provider directly for your
          runs. Free tier: 8 runs/day using the shared default model. Add your own API key for unlimited use.
        </p>
        <div className="space-y-3">
          {PROVIDERS.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <label className="w-20 text-sm text-ink shrink-0">{p.label}</label>
              <input
                type="password"
                value={keys[p.id] || ''}
                onChange={(e) => setKeys((k) => ({ ...k, [p.id]: e.target.value }))}
                placeholder={'Optional — falls back to free tier'}
                className="flex-1 bg-surface2 border border-border rounded px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-accent outline-none"
              />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Default reasoning model">
        <select
          value={defaultModel}
          onChange={(e) => setDefaultModel(e.target.value)}
          className="w-full bg-surface2 border border-border rounded px-3 py-2 text-sm text-ink"
        >
          {PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </Card>

      <Card title="Usage limit">
        <label className="text-xs text-muted mb-1 block">Max iterations per run</label>
        <input
          type="number"
          min={1}
          max={200}
          value={maxIterations}
          onChange={(e) => setMaxIterations(Number(e.target.value))}
          className="w-32 bg-surface2 border border-border rounded px-3 py-2 text-sm text-ink"
        />
        <p className="text-xs text-muted mt-2">
          Caps how many hypothesis attempts a single run can make, so a run stops on its own
          rather than running (and billing your key) indefinitely.
        </p>
      </Card>

      <Card title="Multi-agent model assignment">
        <p className="text-xs text-muted mb-4 leading-relaxed">
          Assign a different model per agent role. Leave any agent unset to skip it during a
          multi-agent run.
        </p>
        <div className="space-y-2">
          {AGENT_DEFS.map((a) => (
            <div key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <label className="sm:w-44 text-sm text-ink shrink-0">{a.name}</label>
              <select
                value={agentModels[a.id] || ''}
                onChange={(e) => setAgentModels((prev) => ({ ...prev, [a.id]: e.target.value }))}
                className="flex-1 bg-surface2 border border-border rounded px-3 py-2 text-sm text-ink"
              >
                <option value="">Not assigned</option>
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          className="px-4 py-2 rounded bg-accent text-bg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Save settings
        </button>
        {saved && <span className="text-xs text-established font-mono">Saved</span>}
      </div>

      <Card title="Appearance">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink">Theme</p>
            <p className="text-xs text-muted mt-0.5">Follows your device by default — override it here.</p>
          </div>
          <ThemeToggle />
        </div>
      </Card>

      <Card title="About">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">Version</span>
            <span className="text-ink font-mono text-xs">v0.1 · AGPL-3.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Source code</span>
            <a
              href="https://github.com/ridhanbholakiya198-code/OncoTwin"
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline text-xs"
            >
              GitHub repository
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Developer</span>
            <a
              href="https://github.com/ridhanbholakiya198-code"
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline text-xs"
            >
              ridhanbholakiya198-code
            </a>
          </div>
          <div className="flex items-center gap-4 pt-2 border-t border-border mt-2">
            <a href="/privacy" className="text-xs text-muted hover:text-accent transition-colors">Privacy Policy</a>
            <a href="/terms" className="text-xs text-muted hover:text-accent transition-colors">Terms</a>
            <a href="/disclaimer" className="text-xs text-muted hover:text-accent transition-colors">Disclaimer</a>
          </div>
        </div>
      </Card>
    </div>
  )
}
