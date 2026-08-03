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

// On mobile this renders as a slide-in drawer (controlled by isOpen/onClose).
// On md+ screens it's always visible as a permanent sidebar, and isOpen/onClose
// are simply ignored.
export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  return (
    <>
      {/* Backdrop — mobile only, shown while the drawer is open */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw]
          border-r border-border bg-surface flex flex-col
          transition-transform duration-200 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:static md:translate-x-0 md:z-auto md:w-64 md:max-w-none md:h-full
        `}
      >
        <div className="px-5 py-5 border-b border-border flex items-center justify-between">
          <div>
            <Logo />
            <p className="text-[11px] text-muted mt-1 font-mono">EGFR-mutant NSCLC · v0.1</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="md:hidden text-muted hover:text-ink text-xl leading-none px-2"
          >
            ✕
          </button>
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
                    onClick={onClose}
                    className={({ isActive }) =>
                      `block px-2.5 py-2 md:py-1.5 rounded text-sm transition-colors ${
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
    </>
  )
}
