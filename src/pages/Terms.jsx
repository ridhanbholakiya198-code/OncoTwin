export default function Terms() {
  return (
    <div className="min-h-screen bg-bg text-ink px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-5">
        <h1 className="font-display text-2xl font-semibold">Terms of Service</h1>
        <p className="text-xs text-muted">Draft — v0.1. Replace with counsel-reviewed text before public launch if needed.</p>

        <section>
          <h2 className="font-display text-sm font-semibold mb-1">Nature of the service</h2>
          <p className="text-sm text-ink/90 leading-relaxed">
            OncoTwin is provided "as is," as an open-source research-support tool, with no warranty
            of accuracy, fitness for a particular purpose, or medical validity. See the
            <a href="/disclaimer" className="text-accent"> Research Use Disclaimer</a> for details.
          </p>
        </section>

        <section>
          <h2 className="font-display text-sm font-semibold mb-1">Your API keys</h2>
          <p className="text-sm text-ink/90 leading-relaxed">
            If you provide your own API key for an AI provider, you are responsible for any usage
            costs incurred under that key. OncoTwin includes a configurable iteration limit to help
            prevent runaway usage, but you should also monitor usage directly with your provider.
          </p>
        </section>

        <section>
          <h2 className="font-display text-sm font-semibold mb-1">Acceptable use</h2>
          <p className="text-sm text-ink/90 leading-relaxed">
            You agree not to use OncoTwin's output as a substitute for professional medical advice,
            and not to misrepresent its hypotheses as validated clinical findings.
          </p>
        </section>

        <section>
          <h2 className="font-display text-sm font-semibold mb-1">Open-source license</h2>
          <p className="text-sm text-ink/90 leading-relaxed">
            The OncoTwin source code is licensed under AGPL-3.0. See the LICENSE file in the
            project repository for full terms, including obligations for anyone hosting a modified
            version of this software as a network service.
          </p>
        </section>
      </div>
    </div>
  )
}
