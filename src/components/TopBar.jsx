import { useAuth } from '../context/AuthContext.jsx'

export default function TopBar({ title, subtitle }) {
  const { user, logout } = useAuth()

  return (
    <header className="h-16 shrink-0 border-b border-border bg-bg/80 backdrop-blur flex items-center justify-between px-6">
      <div>
        <h1 className="font-display text-base font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-xs text-muted font-mono">{user.email}</span>
            <button
              onClick={logout}
              className="text-xs px-3 py-1.5 rounded border border-border text-ink/80 hover:border-accent hover:text-accent transition-colors"
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
