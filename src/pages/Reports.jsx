import { useEffect, useState } from 'react'
import { collection, query, orderBy, limit, getDocs, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { downloadReport } from '../lib/reportExport.js'
import Card from '../components/Card.jsx'
import EmptyState from '../components/EmptyState.jsx'

function formatTimestamp(ts) {
  if (!ts?.toDate) return '—'
  return ts.toDate().toLocaleString()
}

export default function Reports() {
  const { user } = useAuth()
  const [runs, setRuns] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'runs'), orderBy('createdAt', 'desc'), limit(20))
    getDocs(q).then((snap) => setRuns(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }, [user])

  const handleDelete = async (runId) => {
    if (confirmDelete !== runId) {
      setConfirmDelete(runId)
      return
    }
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'runs', runId))
      setRuns((prev) => prev.filter((r) => r.id !== runId))
      setConfirmDelete(null)
    } catch (err) {
      console.error("Failed to delete run:", err)
    }
  }

  if (runs === null) {
    return <Card title="Reports"><p className="text-xs text-muted">Loading…</p></Card>
  }

  if (runs.length === 0) {
    return (
      <div className="max-w-4xl">
        <EmptyState
          title="No runs to export yet"
          description="Run an Open Case, Multi-Agent, or Benchmark analysis first — every completed run can be exported here as a researcher-style markdown document."
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <Card title="Exportable runs">
        <div className="space-y-2">
          {runs.map((run) => {
            const count = (run.hypotheses || run.consensus?.hypotheses || []).length
            return (
              <div key={run.id} className="flex items-center justify-between border border-border rounded px-3 py-2">
                <div>
                  <p className="text-sm text-ink">
                    {run.type === 'multi_agent' ? 'Multi-Agent Run' : run.type === 'benchmark' ? 'Benchmark Run' : 'Open Case Run'}
                  </p>
                  <p className="text-[11px] text-muted font-mono">
                    {formatTimestamp(run.createdAt)} · {count} hypotheses
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadReport(run, `oncotwin-${run.type}-${run.id}.md`)}
                    className="text-xs px-3 py-1.5 rounded border border-border text-ink/80 hover:border-accent hover:text-accent transition-colors"
                  >
                    Export .md
                  </button>
                  <button
                    onClick={() => handleDelete(run.id)}
                    onMouseLeave={() => setConfirmDelete(null)}
                    className={`text-xs px-3 py-1.5 rounded border transition-colors ${confirmDelete === run.id ? 'border-theoretical text-theoretical font-bold' : 'border-speculative text-speculative hover:bg-speculative/10'}`}
                  >
                    {confirmDelete === run.id ? 'Confirm Delete' : 'Delete'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
