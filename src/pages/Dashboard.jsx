import { useEffect, useState } from 'react'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import Card from '../components/Card.jsx'
import AnchorDot from '../components/AnchorDot.jsx'
import RunHistory from '../components/RunHistory.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  const [openCaseCount, setOpenCaseCount] = useState('0')
  const [benchmarkAccuracy, setBenchmarkAccuracy] = useState('—')
  const [modelsConfigured, setModelsConfigured] = useState('0 / 4')

  useEffect(() => {
    if (!user) return
    
    async function loadStats() {
      try {
        const settingsSnap = await getDoc(doc(db, 'users', user.uid))
        if (settingsSnap.exists()) {
          const data = settingsSnap.data()
          const keys = data.settings?.byokKeys || {}
          let count = 0
          if (keys.claude?.trim()) count++
          if (keys.gpt?.trim()) count++
          if (keys.gemini?.trim()) count++
          if (keys.grok?.trim()) count++
          setModelsConfigured(`${count} / 4`)
        }

        const runsSnap = await getDocs(collection(db, 'users', user.uid, 'runs'))
        let openCases = 0
        let benchmarkTotal = 0
        let benchmarkMatches = 0
        
        runsSnap.forEach(doc => {
          const d = doc.data()
          if (d.type === 'open_case' || d.type === 'multi_agent') {
            openCases++
          } else if (d.type === 'benchmark') {
            benchmarkTotal++
            if (d.score === 'match') {
              benchmarkMatches++
            }
          }
        })
        setOpenCaseCount(openCases.toString())
        if (benchmarkTotal > 0) {
          setBenchmarkAccuracy(`${Math.round((benchmarkMatches / benchmarkTotal) * 100)}%`)
        }
      } catch (e) {
        console.error(e)
      }
    }
    
    loadStats()
  }, [user])

  const STAT_CARDS = [
    { label: 'Active focus', value: 'EGFR-mutant NSCLC', mono: false },
    { label: 'Open case runs', value: openCaseCount, mono: true },
    { label: 'Benchmark match', value: benchmarkAccuracy, mono: true },
    { label: 'Models configured', value: modelsConfigured, mono: true },
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((s) => (
          <Card key={s.label}>
            <p className="text-[11px] uppercase tracking-wider text-muted font-mono mb-1">{s.label}</p>
            <p className={`text-lg text-ink ${s.mono ? 'font-mono' : 'font-display font-medium'}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <Card title="Reality Anchor System">
        <p className="text-sm text-muted mb-3 leading-relaxed">
          Every hypothesis this engine produces is tagged with one of three states.
          Nothing speculative is ever presented as confirmed.
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2"><AnchorDot status="established" /><span className="text-sm text-ink">Established — direct experimental / clinical support</span></div>
          <div className="flex items-center gap-2"><AnchorDot status="theoretical" /><span className="text-sm text-ink">Theoretical — plausible, not yet verified at this scale</span></div>
          <div className="flex items-center gap-2"><AnchorDot status="speculative" /><span className="text-sm text-ink">Speculative — depends on mechanisms not yet confirmed</span></div>
        </div>
      </Card>

      <Card title="Getting started">
        <ol className="text-sm text-ink/90 space-y-2 list-decimal list-inside">
          <li>Add at least one AI provider key in <span className="text-accent">Settings</span>.</li>
          <li>Open a real case in <span className="text-accent">Open Case Workspace</span> to generate hypotheses.</li>
          <li>Run the same case type through <span className="text-accent">Benchmark Workspace</span> to see how the engine performs against a known, solved outcome.</li>
        </ol>
      </Card>

      <RunHistory />
    </div>
  )
}
