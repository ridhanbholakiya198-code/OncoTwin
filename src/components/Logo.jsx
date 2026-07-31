// Signature mark: two thin overlapping rings ("twin" orbits), rendered in
// the accent teal against true black — a quiet nod to "digital twin"
// without literally drawing a cell or a DNA strand (avoids the generic
// stock-medical-icon look).
export default function Logo({ size = 28, showWordmark = true }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <circle cx="16" cy="20" r="11" stroke="#3FA9A0" strokeWidth="1.6" />
        <circle cx="24" cy="20" r="11" stroke="#E6EDEF" strokeWidth="1.6" strokeOpacity="0.35" />
      </svg>
      {showWordmark && (
        <span className="font-display font-semibold tracking-tight text-ink text-lg">
          Onco<span className="text-accent">Twin</span>
        </span>
      )}
    </div>
  )
}
