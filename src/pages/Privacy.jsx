export default function Privacy() {
  return (
    <div className="min-h-screen bg-bg text-ink px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-5">
        <h1 className="font-display text-2xl font-semibold">Privacy Policy</h1>
        <p className="text-xs text-muted">Draft — v0.1. Replace with counsel-reviewed text before public launch if needed.</p>

        <section>
          <h2 className="font-display text-sm font-semibold mb-1">What we collect</h2>
          <ul className="text-sm text-ink/90 space-y-1.5 list-disc list-inside">
            <li>Account email and authentication data, via Firebase Authentication.</li>
            <li>API keys you choose to enter under Settings (used only to call the corresponding AI provider on your behalf).</li>
            <li>Case data you input into the tool (mutation profiles, stage, etc.) — stored to your account so you can revisit past runs.</li>
            <li>Saved run history and settings, stored in Firestore.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-sm font-semibold mb-1">Where it goes</h2>
          <p className="text-sm text-ink/90 leading-relaxed">
            Authentication and stored data are hosted on Google Firebase infrastructure, subject to
            Google's own data-processing terms. When you run the reasoning engine, the case data
            and prompts you submit are sent to whichever AI provider (Claude, GPT, Gemini, or Grok)
            you've selected, using either your own API key or the shared free-tier key, subject to
            that provider's own data policy.
          </p>
        </section>

        <section>
          <h2 className="font-display text-sm font-semibold mb-1">What we don't do</h2>
          <p className="text-sm text-ink/90 leading-relaxed">
            We do not sell your data. We do not use your case data to train any model ourselves.
            API keys are used solely to route your own requests and are never shared with other users.
          </p>
        </section>

        <section>
          <h2 className="font-display text-sm font-semibold mb-1">Your rights</h2>
          <p className="text-sm text-ink/90 leading-relaxed">
            You can delete your account and all associated stored data at any time from Settings,
            or by contacting the project maintainer via the GitHub repository.
          </p>
        </section>
      </div>
    </div>
  )
}
