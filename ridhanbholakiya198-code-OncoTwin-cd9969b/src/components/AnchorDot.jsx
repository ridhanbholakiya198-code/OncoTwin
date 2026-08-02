// The reality-anchor indicator: every module, case, and hypothesis in
// OncoTwin carries one of these three states so the interface never lets
// speculative output masquerade as established evidence.
const LABELS = {
  established: 'Established',
  theoretical: 'Theoretical',
  speculative: 'Speculative',
}

export default function AnchorDot({ status = 'theoretical', withLabel = false }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`anchor-dot anchor-dot--${status}`} />
      {withLabel && <span className="text-xs text-muted font-mono">{LABELS[status]}</span>}
    </span>
  )
}
