# OncoTwin — Complete Project Blueprint

**Tagline (working):** Open, transparent, reproducible AI-assisted hypothesis generation platform for oncology research.

**Core Principle:** This is a research-support / hypothesis-generation tool, NOT a medical device and NOT a treatment tool. Every output must carry evidence, confidence breakdown, and limitations — never a raw "cure" claim.

**License:** AGPL-3.0 (code open-source, but anyone using it over a network — e.g. running their own hosted copy — must also share their source. Protects against silent closed-source copying while keeping research transparency.)

**Hosting:** Netlify (free tier) for the frontend. Firebase (free tier) for Auth + Firestore. No paid server required — all heavy AI reasoning happens via user-supplied or default API keys (BYOK model), not on our own compute.

---

## Scope Decision (per ChatGPT + Claude discussion)

- **NOT** a generic "all cancers" simulator.
- **NOT** a full human-body simulator.
- Focused on **one narrow cancer profile** to start (recommended: a specific mutation-defined subtype, e.g. EGFR-mutant NSCLC — narrower than "lung cancer" broadly, because lung cancer as a whole is too heterogeneous to validate against).
- Built around a **computational model** (published equations / curated evidence — not a fictional "universal tumor equation").
- Two case workspaces:
  - **Case A — Open/unsolved case:** real (public, anonymized) case data, no known final outcome — engine proposes new hypotheses.
  - **Case B — Solved case, blind validation (Benchmark Mode):** real stage 3 case with a known historical outcome. Engine is given only the pre-treatment data (outcome hidden) and must independently arrive at a prediction. Compared against real outcome: Match / Partial Match / Miss. This is the core trust-building mechanism.
- Confidence is **never a single %.** Always broken into: Evidence Strength, Number of Supporting Studies, Dataset Coverage, Cross-Model Agreement, and an explicit Uncertainty Report (what's weak and why).

---

## The 14 Build Parts (no part is compressed, skipped, or merged without saying so)

### Part 1 — Foundation & Branding
- Finalize name (OncoTwin ✅), color palette, logo, typography, tone of visual design.
- Tech stack lock-in: Next.js (or React+Vite) frontend, Firebase Auth + Firestore, Tailwind for styling.
- Repo structure, README skeleton, folder architecture.

### Part 2 — Frontend Shell & Navigation
- All pages/tabs scaffolded (even if some are placeholders in this pass): Dashboard, Case Workspace A, Case Workspace B (Benchmark), Literature Explorer, Drug Ranking, Multi-Agent Reasoning view, Reports, Settings, Legal pages.
- Global layout, nav menu, responsive structure.

### Part 3 — Auth System (Firebase)
- Signup/login/logout, session persistence, protected routes.
- User profile doc in Firestore (stores their settings, saved runs, history).

### Part 4 — Settings Module (BYOK)
- API key input fields for Claude, GPT, Gemini, Grok — stored securely (encrypted at rest where possible).
- Default free-tier AI option (rate-limited) for users without their own key.
- Model selection per "agent role" (see Part 6).
- Cost/rate limiter config — max iterations per run, warnings before large API usage.

### Part 5 — Core Reasoning Engine (v1: unified single-agent pass)
- The actual computation layer: takes case input (mutation profile, stage, prior treatment, markers), applies known-evidence rules and any applicable published growth/response models, and produces a first-pass ranked hypothesis list.
- This is the "engine" everything else builds on. Built first as ONE unified reasoning pipeline before splitting into agents, so there's a working core before adding complexity.

### Part 6 — Multi-Agent Split
- Splits the Part 5 engine into specialized roles: Evidence Agent, Biology Agent, Drug-Interaction Agent, Statistics Agent, Critic Agent, Consensus Agent.
- Each agent's model is independently selectable in Settings.
- Consensus Agent reconciles the others into the final ranked output.

### Part 7 — Case Workspace A (Open Case)
- UI + logic for inputting a real, unsolved case.
- Runs full engine, shows live iteration process, final ranked hypotheses.

### Part 8 — Case Workspace B (Benchmark / Blind Validation)
- UI + logic for the solved stage-3 case.
- Enforces "blind" input (outcome data hidden from the engine at run time).
- Scoring against real historical outcome: Match / Partial Match / Miss.
- This is the credibility centerpiece of the whole product.

### Part 9 — Decision Logging & Transparency Layer
- Every iteration logged: what was tried, why accepted/rejected, which paper/data point supported the decision, confidence breakdown.
- "Why not?" button on every rejected hypothesis.
- Uncertainty Report generator (explicitly states what's weak/thin in the evidence, not just what's strong).

### Part 10 — Visualization Layer
- Tumor growth curve, survival probability chart, evidence network graph (papers ↔ genes ↔ drugs).
- Lightweight, browser-rendered (Chart.js/D3/Recharts) — no heavy compute.

### Part 11 — Report Export
- Generates a researcher-style document: Evidence, Papers, Dataset, Gene, Mutation, Drug, Mechanism, Expected Pathway, Weakness, Confidence Breakdown, Limitations, Future Validation Needed.
- Exportable as PDF/Markdown.

### Part 12 — Legal & Compliance
- LICENSE file (AGPL-3.0) for the repo.
- Website Terms of Service (usage rules, liability, no-medical-advice clause).
- Privacy Policy (what data is collected — auth email, stored API keys, query data sent to third-party AI providers — and user rights).
- Prominent in-app medical disclaimer.

### Part 13 — Data Layer Integration
- Live fetch from public sources: PubMed API, TCGA, cBioPortal — not stored/duplicated locally, fetched live to stay current and avoid storage costs.
- User-uploaded case data input format (structured form, not free text, so the engine gets clean structured fields).

### Part 14 — Deployment Packaging
- Environment variable setup (Firebase config, no hardcoded secrets).
- Netlify build configuration.
- README with setup/deploy instructions for anyone cloning the open-source repo.

---

## Build Order (for actual coding, across sessions)

Because this is too large for a single pass without quality loss, the working plan is:

1. Part 1 + Part 2 + Part 3 → a real, running, deployable skeleton (branding, all pages present even if some are placeholder, login working). **← natural first deliverable.**
2. Part 4 + Part 5 → Settings + one working end-to-end reasoning flow (this is the first version where the tool actually "does something real").
3. Part 7 + Part 9 (partial) → Case Workspace A wired to the Part 5 engine, with basic logging.
4. Part 8 → Benchmark Mode (blind validation) — the trust centerpiece.
5. Part 6 → Multi-agent split (upgrade from unified engine).
6. Part 10 + Part 11 → Visualization + Report export.
7. Part 12 + Part 13 → Legal pages + live data source integration.
8. Part 14 → Final deployment polish.

Nothing in this list is being dropped — this is a sequencing order, not a cut list.

---

## Open Decisions Still Needed From You

- Confirm the exact cancer subtype to start with (recommendation: EGFR-mutant NSCLC, or another mutation-narrow profile with good public data availability).
- Confirm you want AGPL-3.0 specifically (vs MIT) — AGPL is stricter/more protective, which matches what you said about not wanting silent copying.
