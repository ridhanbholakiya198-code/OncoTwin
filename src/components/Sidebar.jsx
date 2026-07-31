import { NavLink } from 'react-router-dom'
import Logo from './Logo.jsx'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard' }],
  },
  {
    label: 'Research Engine',
    items: [
      { to: '/literature', label: 'Literature Explorer' },
      { to: '/ranking', label: 'Drug Ranking' },
      { to: '/agents', label: 'Multi-Agent Reasoning' },
    ],
  },
  {
    label: 'Cases',
    items: [
      { to: '/case/open', label: 'Open Case' },
      { to: '/case/benchmark', label: 'Benchmark (Solved Case)' },
    ],
  },
  {
    label: 'Output',
    items: [{ to: '/reports', label: 'Reports' }],
  },
  {
    label: 'Account',
    items: [{ to: '/settings', label: 'Settings' }],
  },
]

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 h-full border-r border-border bg-surface flex flex-col">
      <div className="px-5 py-5 border-b border-border">
        <Logo />
        <p className="text-[11px] text-muted mt-1 font-mono">EGFR-mutant NSCLC · v0.1</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-2 mb-1.5 text-[11px] uppercase tracking-wider text-muted font-mono">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `block px-2.5 py-1.5 rounded text-sm transition-colors ${
                      isActive
                        ? 'bg-accentSoft text-accent'
                        : 'text-ink/80 hover:bg-surface2 hover:text-ink'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-border text-[11px] text-muted leading-relaxed">
        Research-support tool only.<br />Not a medical device.
      </div>
    </aside>
  )
}
