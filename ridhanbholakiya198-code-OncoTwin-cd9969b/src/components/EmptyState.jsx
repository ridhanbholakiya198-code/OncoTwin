export default function EmptyState({ title, description, partLabel }) {
  return (
    <div className="border border-dashed border-border rounded p-8 text-center">
      <p className="font-display text-sm text-ink mb-1">{title}</p>
      <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">{description}</p>
      {partLabel && (
        <p className="text-[11px] text-accent font-mono mt-3">{partLabel}</p>
      )}
    </div>
  )
}
