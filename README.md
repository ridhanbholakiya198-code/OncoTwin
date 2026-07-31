# OncoTwin

Open, transparent, reproducible AI-assisted hypothesis generation for oncology research.

**OncoTwin is a research-support tool. It is not a medical device and does not provide
medical advice.** See `/disclaimer` in the app for full detail.

## What's in this pass (v0.1)

This is the **foundation + frontend shell** (Blueprint Parts 1–3):

- Branding, dark AMOLED theme, "reality anchor" evidence-status system
- Full navigation shell for every planned module (Dashboard, Literature Explorer,
  Drug Ranking, Multi-Agent Reasoning, Open Case Workspace, Benchmark Workspace,
  Reports, Settings)
- Firebase Authentication wiring (email/password login + signup)
- Settings page with working BYOK (bring-your-own-key) storage to Firestore for
  Claude / GPT / Gemini / Grok, a default-model selector, and an iteration limit
- Legal pages: Privacy Policy, Terms of Service, Research Use Disclaimer

**New in this pass — Part 5 (Core Reasoning Engine) + Part 7 (Open Case Workspace):**

- `src/lib/reasoningEngine.js` — calls the user's selected provider (Claude, GPT,
  Gemini, or Grok) with a strict system prompt that forces anchor-tagged,
  evidence-only output as JSON (no single confidence %, no invented citations).
- The Open Case Workspace now actually runs this engine, shows a live run log,
  renders ranked hypotheses with their anchor status, shows rejected combinations
  with reasons ("Why not?"), and saves every run to Firestore under
  `users/{uid}/runs` — the start of the permanent decision log (Part 9).

**Important known limitation to fix before real use:** calling Claude, GPT, or
Grok's APIs directly from a browser will usually be blocked by CORS, since
those providers expect server-side calls. Gemini's REST API currently allows
direct browser calls with just an API key. The practical fix is a small
serverless proxy function (e.g. a single Netlify Function) that forwards the
request server-side — this is a good next addition to Part 14.

**New in this pass — Part 6 (Multi-Agent Split) + Part 9 (Decision Logging viewer):**

- `src/lib/multiAgentEngine.js` — six agents (Evidence, Biology, Drug-Interaction,
  Statistics, Critic, Consensus), each with its own narrow system prompt and its
  own assignable model (set in Settings → "Multi-agent model assignment").
  Agents run in sequence, each seeing the prior agents' output, and the
  Consensus Agent reconciles everything into one final ranked list — it is
  told explicitly not to introduce new claims of its own.
- The Multi-Agent Reasoning screen now runs this for real and shows each
  agent's raw output live, then the consensus result.
- `src/components/RunHistory.jsx` — shown on the Dashboard, lists every past
  run (open case or multi-agent) pulled from Firestore, expandable to show
  the hypotheses, their anchor status, and rejected items with reasons. This
  is the transparency/trust layer: nothing is thrown away, match or miss.

Report export is still a navigable
placeholder screen (Blueprint Part 11 — next pass). Benchmark blind-validation (Part 8) and lightweight SVG charts (Part 10) are now working — see src/lib/benchmarkEngine.js and src/components/BarChart.jsx.

**New in this pass — Part 11 (Report Export) + Part 13 (Live PubMed Data Layer):**

- `src/lib/reportExport.js` — turns any saved run into a researcher-style
  markdown document (Case Input, Hypotheses, Rejected Combinations, Benchmark
  Score if applicable, Future Validation Needed) and downloads it client-side,
  no server involved.
- Reports page now lists every saved run with an "Export .md" button per run.
- `src/lib/pubmedClient.js` — live search against NCBI's public PubMed
  E-utilities (no API key needed). Nothing is cached or stored locally, per
  the blueprint's "fetch live, don't duplicate public datasets" rule.
- Literature Explorer now runs real PubMed searches and links out to each result.

**New in this pass — Part 12 (License) + Part 14 (Deployment polish / CORS fix):**

- Verified via research that the LICENSE placeholder's guidance is correct: use
  GitHub's "Add license" picker (select "GNU Affero General Public License v3.0")
  when you create the repo — it inserts the exact, official, verbatim AGPL-3.0
  text automatically. Reproducing a legal document from memory risks subtle
  wording errors, so this repo intentionally does not attempt that — use the
  GitHub picker or download directly from https://www.gnu.org/licenses/agpl-3.0.txt
- **CORS fix (the last known limitation):** added `netlify/functions/ai-proxy.js`,
  a small serverless function that forwards Claude/GPT/Grok API calls
  server-side. The frontend (`src/lib/reasoningEngine.js`) now calls this proxy
  instead of hitting those providers directly from the browser, so the CORS
  block noted earlier is resolved. Gemini is unaffected — its REST API already
  allows direct browser calls. `netlify.toml` wires up the functions directory
  so this deploys automatically on Netlify with no extra configuration.

All 14 blueprint parts are now built. See `OncoTwin_Project_Blueprint.md` for
the original scope, and treat this as a working v1 foundation — real-world use
will surface bugs and rough edges typical of a first pass, especially around
prompt quality and edge cases in provider responses.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a free Firebase project at https://console.firebase.google.com
   - Enable **Authentication → Email/Password**
   - Enable **Firestore Database** (start in test mode for local dev, then lock
     down rules before going live)
   - Copy your web app config values
3. Copy `.env.example` to `.env` and fill in your Firebase values.
4. Run locally:
   ```bash
   npm run dev
   ```
5. Build for production:
   ```bash
   npm run build
   ```
   This outputs a `dist/` folder ready to deploy.

## Deploying on Netlify

1. Push this repo to GitHub.
2. In Netlify: "Add new site" → "Import an existing project" → connect the repo.
3. Build command: `npm run build`. Publish directory: `dist`.
4. Add your `VITE_FIREBASE_*` values under Site settings → Environment variables
   (same names as `.env.example`).
5. Deploy.

## Known Limitations — Pre-Deploy Checklist (found in full project audit)

Before this goes live, address these:

1. **Firestore security rules are now included** (`firestore.rules`) — they
   restrict every `users/{uid}` document and its `runs` subcollection to that
   same authenticated user only. Deploy them via `firebase deploy --only
   firestore:rules` (requires the Firebase CLI) or paste them into the
   Firebase Console → Firestore → Rules tab. Do this before real users sign up
   — the console's default "test mode" rules are open to anyone and expire
   after 30 days.
2. **Model identifiers may drift.** `gpt-4o`, `grok-2-latest`, and
   `gemini-1.5-pro` are what was current in training data — verify against
   each provider's live docs before relying on them, since these change
   frequently. (The Claude identifier was checked and corrected to
   `claude-sonnet-5` during this audit.)
3. **`maxIterations` in Settings is saved but not yet enforced.** The current
   engine makes one call per run asking for up to 5 hypotheses — it is not
   yet a literal iterative loop, so there's nothing for this limit to cap yet.
   Either wire it into a real iteration loop later, or remove the setting for
   now to avoid implying a feature that isn't active.
4. **Drug Ranking's evidence-strength chart is illustrative/static** — it is
   not yet wired to real run data. Live scores would need to be computed and
   stored from actual engine runs.
5. **Only PubMed is live-integrated.** TCGA and cBioPortal (both named in the
   original blueprint for Part 13) are not yet connected — Literature
   Explorer only searches PubMed today.
6. **Benchmark Workspace doesn't display rejected hypotheses** ("Why not?")
   even though the engine returns them — Open Case Workspace does. Minor,
   easy follow-up.
7. **This has not been build-tested end-to-end** (no network access in the
   environment this was built in, so `npm install && npm run build` could
   not be run here). Run it yourself before trusting it's error-free —
   there could be a typo or small integration issue that only a real build
   will surface.

None of the above block a first deploy for personal testing — but #1 (Firestore
rules) should be fixed before any real user's data touches this.

## License

AGPL-3.0 — see `LICENSE`. Replace the placeholder license file with the official
text from https://www.gnu.org/licenses/agpl-3.0.txt (or use GitHub's built-in
license picker) before publishing.

## Roadmap

See `OncoTwin_Project_Blueprint.md` for the full 14-part build plan.
