import { useEffect, useState } from 'react'
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { runReasoningEngine } from '../lib/reasoningEngine.js'
import Card from '../components/Card.jsx'
import AnchorDot from '../components/AnchorDot.jsx'
import ErrorDetails from '../components/ErrorDetails.jsx'

const FIELD_KEYS = [
  { key: 'mutationProfile', label: 'Mutation profile', placeholder: 'e.g. EGFR Exon 19 deletion' },
  { key: 'stage', label: 'Stage', placeholder: 'e.g. Stage IV' },
  { key: 'priorTreatment', label: 'Prior treatment', placeholder: 'e.g. none / 1st-line TKI' },
  { key: 'biomarkers', label: 'Relevant biomarkers', placeholder: 'e.g. PD-L1 TPS %' },
]

export default function CaseWorkspaceOpen() {
  const { user } = useAuth()
  const [form, setForm] = useState({ mutationProfile: '', stage: '', priorTreatment: '', biomarkers: '' })
  const [settings, setSettings] = useState(null)
  const [status, setStatus] = useState('idle')
  const [logs, setLogs] = useState([])
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [fullError, setFullError] = useState(null)
  const [isConsistencyMode, setIsConsistencyMode] = useState(false)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (snap.exists()) setSettings(snap.data().settings || null)
    })
  }, [user])

  async function handleRun() {
    setStatus('running')
    setErrorMsg('')
    setFullError(null)
    setLogs([])
    setResult(null)

    const provider = settings?.defaultModel || 'claude'
    const apiKey = settings?.byokKeys?.[provider]

    const runsCount = isConsistencyMode ? 3 : 1

    try {
      const allRuns = []
      for (let i = 0; i < runsCount; i++) {
        if (isConsistencyMode) {
          setLogs((prev) => [...prev, { step: 'info', message: `Starting run ${i + 1} of ${runsCount}…` }])
        }
        const engineResult = await runReasoningEngine({
          caseInput: form,
          provider,
          apiKey,
          onLog: (entry) => setLogs((prev) => [...prev, entry]),
        })
        allRuns.push(engineResult)
      }

      let finalResult
      if (runsCount === 1) {
        finalResult = allRuns[0]
      } else {
        const groups = []
        
        const COMMON_WORDS = new Set([
          'the', 'and', 'for', 'with', 'combined', 'therapy', 'monotherapy', 'targeted', 'first', 'line', 'frontline'
        ])
        
        const KEY_DRUGS = [
          'amivantamab', 'sunvozertinib', 'zipalertinib', 'furmonertinib', 'patritumab', 'deruxtecan', 'bevacizumab', 'lazertinib', 'osimertinib', 'chemotherapy', 'chemo', 'carboplatin', 'pemetrexed'
        ]

        const normalize = (t) => (t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ')
        const tokenize = (t) => normalize(t).split(' ').filter(w => w.length > 3 && !COMMON_WORDS.has(w))

        const isMatch = (group, hyp) => {
          const hypTokens = tokenize(`${hyp.title} ${hyp.mechanism}`)
          const groupTokensArr = Array.from(group.allTokens)
          
          if (hypTokens.length === 0 || groupTokensArr.length === 0) {
             return hyp.title.toLowerCase() === group.title.toLowerCase()
          }

          let hits = 0
          for (const term of hypTokens) {
            if (groupTokensArr.some(tok => tok.startsWith(term.slice(0, 7)) || term.startsWith(tok.slice(0, 7)))) {
              hits++
            }
          }
          
          let reverseHits = 0
          for (const term of groupTokensArr) {
            if (hypTokens.some(tok => tok.startsWith(term.slice(0, 7)) || term.startsWith(tok.slice(0, 7)))) {
              reverseHits++
            }
          }
          
          const hypDrugs = hypTokens.filter(t => KEY_DRUGS.some(d => d.startsWith(t.slice(0, 7)) || t.startsWith(d.slice(0, 7))))
          const groupDrugs = groupTokensArr.filter(t => KEY_DRUGS.some(d => d.startsWith(t.slice(0, 7)) || t.startsWith(d.slice(0, 7))))
          
          const sharedDrug = hypDrugs.some(hd => groupDrugs.some(gd => gd.startsWith(hd.slice(0, 7)) || hd.startsWith(gd.slice(0, 7))))
          const unsharedHypDrugs = hypDrugs.filter(hd => !groupDrugs.some(gd => gd.startsWith(hd.slice(0, 7)) || hd.startsWith(gd.slice(0, 7))))
          const unsharedGroupDrugs = groupDrugs.filter(gd => !hypDrugs.some(hd => hd.startsWith(gd.slice(0, 7)) || gd.startsWith(hd.slice(0, 7))))
          
          const ratio1 = hits / hypTokens.length
          const ratio2 = reverseHits / groupTokensArr.length
          
          const boost = sharedDrug ? 0.3 : 0
          const penalty = (unsharedHypDrugs.length > 0 || unsharedGroupDrugs.length > 0) ? 1.0 : 0
          
          return (ratio1 + boost - penalty) >= 0.5 || (ratio2 + boost - penalty) >= 0.5
        }

        allRuns.forEach((run) => {
          run.hypotheses.forEach((h) => {
            let matchedGroup = groups.find(g => isMatch(g, h))
            
            const hypTokens = tokenize(`${h.title} ${h.mechanism}`)
            if (!matchedGroup) {
              matchedGroup = { 
                ...h, 
                appearances: 0, 
                anchorsSeen: new Set(), 
                anchorCounts: {},
                allTokens: new Set(hypTokens)
              }
              groups.push(matchedGroup)
            } else {
              hypTokens.forEach(t => matchedGroup.allTokens.add(t))
            }
            
            matchedGroup.appearances++
            matchedGroup.anchorsSeen.add(h.anchor)
            matchedGroup.anchorCounts[h.anchor] = (matchedGroup.anchorCounts[h.anchor] || 0) + 1
          })
        })

        const mergedHypotheses = groups.map((g) => {
          // eslint-disable-next-line no-unused-vars
          const { anchorsSeen, anchorCounts, allTokens, ...rest } = g
          const anchorsArr = Array.from(anchorsSeen)
          return {
            ...rest,
            anchorChanged: anchorsArr.length > 1,
            isConsistent: rest.appearances === runsCount,
            anchors: anchorsArr,
            anchorCounts: anchorCounts,
          }
        })
        mergedHypotheses.sort((a, b) => b.appearances - a.appearances)
        
        finalResult = {
          hypotheses: mergedHypotheses,
          rejected: allRuns[0].rejected, // just take the first run's rejected
          runsCount,
        }
      }

      setResult(finalResult)
      if (user) {
        await addDoc(collection(db, 'users', user.uid, 'runs'), {
          type: 'open_case',
          caseInput: form,
          provider,
          hypotheses: finalResult.hypotheses,
          rejected: finalResult.rejected,
          runsCount: runsCount,
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
      <Card title="Case input — structured fields, not free text">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            onClick={handleRun}
            disabled={status === 'running'}
            className="px-4 py-2 rounded bg-accent text-bg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {status === 'running' ? 'Running…' : 'Run engine'}
          </button>
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={isConsistencyMode}
              onChange={(e) => setIsConsistencyMode(e.target.checked)}
              disabled={status === 'running'}
            />
            Consistency Check Mode (Run 3 times)
          </label>
        </div>
        {settings && (() => {
          const provider = settings.defaultModel || 'claude';
          const hasKey = !!settings.byokKeys?.[provider]?.trim();
          return (
            <p className={`text-[11px] mt-2 font-mono ${hasKey ? 'text-muted' : 'text-speculative'}`}>
              {hasKey 
                ? `Using: ${provider} (change in Settings)`
                : `Using: Gemini (shared free tier — no ${provider} key configured)`}
            </p>
          );
        })()}
      </Card>

      {logs.length > 0 && (
        <Card title="Run log">
          <div className="space-y-1 font-mono text-xs text-muted">
            {logs.map((l, i) => (
              <div key={i}>[{l.step}] {l.message}</div>
            ))}
          </div>
        </Card>
      )}

      {status === 'error' && (
        <Card>
          <p className="text-sm text-speculative">{errorMsg}</p>
          <ErrorDetails error={fullError} />
        </Card>
      )}

      {result && (
        <>
          <Card title={result.runsCount > 1 ? `Hypotheses (Consistency Check across ${result.runsCount} runs)` : "Hypotheses"}>
            <div className="space-y-4">
              {result.hypotheses.map((h, i) => (
                <div key={i} className={`border ${h.anchorChanged ? 'border-theoretical' : 'border-border'} rounded p-3`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-ink flex items-center gap-2">
                      {h.title}
                      {result.runsCount > 1 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${h.isConsistent ? 'bg-established/10 text-established' : 'bg-muted/10 text-muted'}`}>
                          {h.appearances}/{result.runsCount} runs
                        </span>
                      )}
                    </p>
                    <AnchorDot status={h.anchor} withLabel />
                  </div>
                  {h.anchorChanged && (
                    <p className="text-[11px] text-theoretical font-mono mb-2">
                      ⚠️ Anchor status varied: {Object.entries(h.anchorCounts).map(([anchor, count]) => `${anchor || 'unspecified'} in ${count}/${result.runsCount} runs`).join(', ')} — INCONSISTENT
                    </p>
                  )}
                  <p className="text-xs text-ink/80 mb-2">{h.mechanism}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted font-mono">
                    <span>Evidence strength: {h.evidenceStrength}</span>
                    <span>Supporting studies: {h.supportingStudies}</span>
                  </div>
                  <p className="text-[11px] text-speculative/90 mt-2">Limitations: {h.limitations}</p>
                </div>
              ))}
            </div>
          </Card>

          {result.rejected?.length > 0 && (
            <Card title="Rejected combinations (Why not?)">
              <div className="space-y-2">
                {result.rejected.map((r, i) => (
                  <div key={i} className="text-xs">
                    <span className="text-ink/90">{r.title}</span>
                    <span className="text-muted"> — {r.reason}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
