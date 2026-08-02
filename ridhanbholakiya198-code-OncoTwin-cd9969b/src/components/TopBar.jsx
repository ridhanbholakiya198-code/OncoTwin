import { useAuth } from '../context/AuthContext.jsx'

export default function TopBar({ title, subtitle, onMenu }) {
  const { user, logout } = useAuth()

  return (
    <header className="min-h-16 shrink-0 border-b border-border bg-bg/80 backdrop-blur flex items-center justify-between gap-3 px-6 max-md:px-4 max-sm:px-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenu}
          className="hidden max-md:inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-border text-muted hover:text-ink hover:border-accent"
          aria-label="Open navigation"
        >
          <span className="text-lg leading-none">☰</span>
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-base font-semibold text-ink truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted truncate max-sm:max-w-[58vw]">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {user ? (
          <>
            <span className="text-xs text-muted font-mono max-lg:hidden">{user.email}</span>
            <button
              onClick={logout}
              className="text-xs px-3 py-1.5 rounded border border-border text-ink/80 hover:border-accent hover:text-accent transition-colors whitespace-nowrap"
            >
              Sign out
            </button>
          </>
        ) : (
          <span className="text-xs text-muted max-sm:hidden">Not signed in</span>
        )}
      </div>
    </header>
  )
}
