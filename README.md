OncoTwin

Open, transparent, reproducible AI-assisted hypothesis generation for oncology research.

OncoTwin is a research-support tool designed to help researchers explore oncology cases and generate structured, evidence-anchored hypotheses using AI.

«Disclaimer: OncoTwin is a research-support tool. It is not a medical device and does not provide medical advice, diagnosis, or treatment recommendations.»

Features

- 🔬 AI-Assisted Hypothesis Generation — Generate structured oncology research hypotheses from case inputs.
- 🤖 Multi-Agent Reasoning — Uses specialized AI agents for evidence, biology, drug interactions, statistics, criticism, and consensus.
- 📚 PubMed Literature Explorer — Search live PubMed literature through NCBI's public E-utilities.
- 🧪 Benchmark Workspace — Supports blind validation of hypotheses against known outcomes.
- 📝 Research Reports — Export saved runs as Markdown reports.
- 📋 Run History — Preserve previous runs and reasoning results for transparency and reproducibility.
- 🔑 Bring Your Own Key (BYOK) — Configure supported AI provider keys.
- 🔐 Firebase Authentication & Firestore — Authentication and user-specific research data storage.

Tech Stack

- React
- Vite
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- Vercel Serverless Functions
- AI provider APIs
- PubMed / NCBI E-utilities

Getting Started

Install

npm install

Configure Environment Variables

Create a ".env" file from ".env.example" and add the required Firebase configuration values.

Server-side secrets such as AI provider API keys must not be placed in client-side "VITE_" variables.

Run Locally

npm run dev

Production Build

npm run build

The production build is generated in "dist/".

Deployment

OncoTwin can be deployed as a Vite/React application with its server-side API functions on Vercel.

Required environment variables should be configured in the deployment platform and must not be committed to the repository.

Project Status

Research prototype / work in progress.

OncoTwin is intended for research and experimentation. AI-generated hypotheses require independent verification against appropriate scientific literature and other reliable evidence.

License

AGPL-3.0

See the ""LICENSE"" (./LICENSE) file included in this repository.

Official GNU AGPL-3.0 text: "https://www.gnu.org/licenses/agpl-3.0.txt" (https://www.gnu.org/licenses/agpl-3.0.txt)