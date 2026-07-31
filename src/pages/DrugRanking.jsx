import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import Card from '../components/Card.jsx'
import AnchorDot from '../components/AnchorDot.jsx'
import EmptyState from '../components/EmptyState.jsx'
import BarChart from '../components/BarChart.jsx'

export default function DrugRanking() {
  const { user } = useAuth()
  const [rankedData, setRankedData] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    async function load() {
      try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'runs'))
        const allHypotheses = []
        snap.forEach(doc => {
          const d = doc.data()
          const hyps = d.hypotheses || d.consensus?.hypotheses || []
          hyps.forEach(h => allHypotheses.push(h))
        })
        
        const counts = {}
        allHypotheses.forEach(h => {
          const key = h.title.trim()
          if (!counts[key]) {
             counts[key] = { combo: key, status: h.anchor || 'speculative', evidenceStrength: h.evidenceStrength || 'low', mentions: 0 }
          }
          counts[key].mentions++
          // prefer higher evidence strength
          const strengthScore = { low: 1, medium: 2, high: 3, unknown: 0 }
          if (strengthScore[h.evidenceStrength] > strengthScore[counts[key].evidenceStrength]) {
             counts[key].evidenceStrength = h.evidenceStrength
          }
        })
        
        const sorted = Object.values(counts).sort((a, b) => b.mentions - a.mentions).slice(0, 5)
        
        const finalChart = sorted.map(s => {
          let val = 30
          if (s.evidenceStrength === 'high') val = 90
          else if (s.evidenceStrength === 'medium') val = 60
          return { label: s.combo, value: val }
        })
        
        setRankedData(sorted)
        setChartData(finalChart)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (loading) {
    return <div className="p-4 text-sm text-muted">Loading rankings...</div>
  }

  if (rankedData.length === 0) {
    return (
      <div className="space-y-4 max-w-4xl">
        <EmptyState
          title="No data yet"
          description="Run some cases in the Open Case or Multi-Agent workspaces to populate drug rankings and evidence strengths."
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <Card title="Ranked combinations — EGFR-mutant NSCLC">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted font-mono border-b border-border">
              <th className="pb-2 font-normal">Combination</th>
              <th className="pb-2 font-normal">Anchor</th>
              <th className="pb-2 font-normal">Evidence strength</th>
            </tr>
          </thead>
          <tbody>
            {rankedData.map((row) => (
              <tr key={row.combo} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 text-ink/90">{row.combo}</td>
                <td className="py-2.5"><AnchorDot status={row.status} withLabel /></td>
                <td className="py-2.5 text-muted font-mono">{row.evidenceStrength || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      
      <Card title="Evidence strength overview">
        <BarChart data={chartData} />
        <p className="text-[11px] text-muted mt-2">
          Aggregated evidence strength from recent engine runs.
        </p>
      </Card>
    </div>
  )
}
