// Part 10 — Visualization (kept dependency-free: plain SVG, no chart library)
export default function BarChart({ data, height = 140 }) {
  // data: [{ label, value (0-100) }]
  if (!data || data.length === 0) return null
  const barWidth = 100 / data.length

  return (
    <div>
      <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
        {data.map((d, i) => {
          const barHeight = (d.value / 100) * (height - 20)
          const x = i * barWidth + barWidth * 0.15
          const w = barWidth * 0.7
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={height - 20 - barHeight}
                width={w}
                height={barHeight}
                fill="#3FA9A0"
                opacity="0.85"
              />
            </g>
          )
        })}
        <line x1="0" y1={height - 20} x2="100" y2={height - 20} stroke="#1C2226" strokeWidth="0.5" />
      </svg>
      <div className="flex mt-1">
        {data.map((d) => (
          <div key={d.label} style={{ width: `${barWidth}%` }} className="text-center">
            <span className="text-[10px] text-muted font-mono">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
