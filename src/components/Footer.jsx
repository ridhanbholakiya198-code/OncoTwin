// Minimal, restrained footer — matches how real production tools present
// credit and legal links: small, muted, out of the way. No banners, no
// "Made with love by" styling.
export default function Footer() {
  return (
    <footer className="border-t border-border px-4 sm:px-6 py-4 mt-auto">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-muted">
        <span>© {new Date().getFullYear()} OncoTwin</span>
        <span className="text-border">·</span>
        <a
          href="https://github.com/ridhanbholakiya198-code/OncoTwin"
          target="_blank"
          rel="noreferrer"
          className="hover:text-accent transition-colors"
        >
          Source (GitHub)
        </a>
        <span className="text-border">·</span>
        <a
          href="https://github.com/ridhanbholakiya198-code"
          target="_blank"
          rel="noreferrer"
          className="hover:text-accent transition-colors"
        >
          Developer
        </a>
        <span className="text-border">·</span>
        <a href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</a>
        <span className="text-border">·</span>
        <a href="/terms" className="hover:text-accent transition-colors">Terms</a>
        <span className="text-border">·</span>
        <a href="/disclaimer" className="hover:text-accent transition-colors">Disclaimer</a>
        <span className="text-border">·</span>
        <span>AGPL-3.0</span>
      </div>
    </footer>
  )
}
