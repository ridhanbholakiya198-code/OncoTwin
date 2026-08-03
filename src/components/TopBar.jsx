import { useAuth } from '../context/AuthContext.jsx'

export default function TopBar({ title, subtitle, onMenuClick }) {
  const { user, logout } = useAuth()

  return (
    <header className="h-16 shrink-0 border-b border-border bg-bg/80 backdrop-blur flex items-center justify-between px-3 sm:px-6 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="md:hidden shrink-0 text-ink w-8 h-8 flex items-center justify-center rounded hover:bg-surface2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-sm sm:text-base font-semibold text-ink truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted hidden sm:block truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {user ? (
          <>
            <span className="text-xs text-muted font-mono hidden sm:inline max-w-[160px] truncate">
              {user.email}
            </span>
            <button
              onClick={logout}
              className="text-xs px-2.5 sm:px-3 py-1.5 rounded border border-border text-ink/80 hover:border-accent hover:text-accent transition-colors whitespace-nowrap"
            >
              Sign out
            </button>
          </>
        ) : (
          <span className="text-xs text-muted">Not signed in</span>
        )}
      </div>
    </header>
  )
}
