import { useEffect, useState } from 'react'
import { collection, query, orderBy, limit, getDocs, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import Card from '../components/Card.jsx'
import AnchorDot from '../components/AnchorDot.jsx'

function formatTimestamp(ts) {
  if (!ts?.toDate) return '—'
  return ts.toDate().toLocaleString()
}

export default function RunHistory() {
  const { user } = useAuth()
  const [runs, setRuns] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'runs'), orderBy('createdAt', 'desc'), limit(20))
    getDocs(q).then((snap) => {
      setRuns(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [user])

  const handleDelete = async (e, runId) => {
    e.stopPropagation()
    setDeleteError(null)
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
      setDeleteError("Failed to delete run: " + err.message)
    }
  }

  if (runs === null) {
    return <Card title="Run history"><p className="text-xs text-muted">Loading…</p></Card>
  }

  if (runs.length === 0) {
    return (
      <Card title="Run history">
        <p className="text-xs text-muted">
          No runs logged yet. Every hypothesis generation — open case or multi-agent — is
          recorded here permanently, whether it succeeds or fails, so the track record stays honest.
        </p>
      </Card>
    )
  }

  return (
    <Card title="Run history">
      <div className="space-y-2">
        {runs.map((run) => {
          const hypotheses = run.hypotheses || run.consensus?.hypotheses || []
          const isOpen = expanded === run.id
          return (
            <div key={run.id} className="border border-border rounded">
              <div
                onClick={() => setExpanded(isOpen ? null : run.id)}
                className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-2 text-left cursor-pointer"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-[11px] font-mono text-muted">{formatTimestamp(run.createdAt)}</span>
                  <span className="text-xs text-ink">
                    {run.type === 'multi_agent' ? 'Multi-Agent Run' : run.type === 'benchmark' ? 'Benchmark Run' : 'Open Case Run'}
                  </span>
                  <span className="text-[11px] text-muted font-mono">{hypotheses.length} hypotheses</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    onClick={(e) => handleDelete(e, run.id)}
                    onMouseLeave={() => setConfirmDelete(null)}
                    className={`text-xs hover:underline cursor-pointer ${confirmDelete === run.id ? 'text-theoretical font-bold' : 'text-speculative'}`}
                  >
                    {confirmDelete === run.id ? 'Confirm Delete' : 'Delete'}
                  </span>
                  <span className="text-xs text-muted">{isOpen ? '−' : '+'}</span>
                </div>
              </div>
              {isOpen && (
                <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                  {deleteError && confirmDelete === run.id && (
                    <p className="text-[11px] text-speculative font-medium mb-1">{deleteError}</p>
                  )}
                  <p className="text-[11px] text-muted font-mono">
                    Input: {Object.entries(run.caseInput || {}).map(([k, v]) => `${k}=${v || '—'}`).join(', ')}
                  </p>
                  {hypotheses.map((h, i) => {
                    let anchorDisplay = <AnchorDot status={h.anchor} />;
                    if (h.anchorChanged) {
                      let details;
                      if (h.anchorCounts) {
                        details = Object.entries(h.anchorCounts).map(([anchor, count]) => `${anchor || 'unspecified'} (${count})`).join(', ');
                      } else {
                        details = h.anchors ? h.anchors.join(', ') : 'unknown';
                      }
                      anchorDisplay = (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-theoretical font-bold px-1 border border-theoretical rounded">INCONSISTENT</span>
                          <span className="text-[10px] text-muted">{details}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="flex flex-col gap-1 text-xs">
                        <div className="flex items-start gap-2">
                          <div className="mt-[2px]">{!h.anchorChanged && anchorDisplay}</div>
                          <span className="text-ink/90 leading-tight">{h.title}</span>
                        </div>
                        {h.anchorChanged && <div className="ml-5">{anchorDisplay}</div>}
                      </div>
                    );
                  })}
                  {run.rejected?.length > 0 && (
                    <div className="pt-1">
                      <p className="text-[11px] text-muted mb-1">Rejected:</p>
                      {run.rejected.map((r, i) => (
                        <p key={i} className="text-[11px] text-muted">— {r.title}: {r.reason}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
