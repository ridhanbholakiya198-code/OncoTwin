import { useState } from 'react'

// Shows a full, unclipped technical diagnostic panel under any error message,
// wherever a run fails. Always available — no separate "dev mode" toggle to
// remember to turn on beforehand — collapsed by default so it doesn't clutter
// the normal view, but one tap away whenever something goes wrong.
export default function ErrorDetails({ error }) {
  const [open, setOpen] = useState(false)
  if (!error) return null

  const debugInfo = error.debugInfo || null
  const httpStatus = error.httpStatus || null

  const fullDump = JSON.stringify(
    {
      message: error.message,
      httpStatus,
      ...debugInfo,
    },
    null,
    2
  )

  function copyToClipboard() {
    navigator.clipboard?.writeText(fullDump)
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-[11px] text-muted hover:text-accent font-mono underline"
      >
        {open ? 'Hide' : 'Show'} technical details
      </button>
      {open && (
        <div className="mt-2 bg-surface2 border border-border rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted font-mono uppercase">Full diagnostic log</span>
            <button
              onClick={copyToClipboard}
              className="text-[10px] text-accent font-mono hover:underline"
            >
              Copy
            </button>
          </div>
          <pre className="text-[10px] text-ink/80 font-mono whitespace-pre-wrap break-all leading-relaxed">
            {fullDump}
          </pre>
        </div>
      )}
    </div>
  )
}
