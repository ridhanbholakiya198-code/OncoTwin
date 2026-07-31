export default function Card({ title, action, children, className = '' }) {
  return (
    <div className={`border border-border bg-surface rounded ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          {title && <h3 className="font-display text-sm font-medium text-ink">{title}</h3>}
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
}
