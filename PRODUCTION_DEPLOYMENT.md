# OncoTwin production deployment notes

This build is prepared for Vercel + Firebase.

## Required Vercel environment variables

Server-only:
- `GEMINI_API_KEY` — shared Gemini API key. Never expose with a `VITE_` prefix.
- `FIREBASE_SERVICE_ACCOUNT` — Firebase Admin service-account JSON, stored as a Vercel secret.
- `DEFAULT_AI_PROVIDER=gemini` (optional; Gemini is selected when the shared Gemini key exists).

Public Firebase web config:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Firestore

Deploy `firestore.rules` before allowing users to save data. The rules isolate each user's `users/{uid}` document tree.

## Vercel

Vercel auto-detects:
- `api/ai-proxy.ts` → `/api/ai-proxy`
- `api/config.ts` → `/api/config`

The SPA fallback in `vercel.json` explicitly excludes `/api/*`.

## Important

The source code has been statically checked and the report generator was exercised for both open-case and benchmark examples. A real deployment is still required to verify live Firebase credentials, Firestore rules, Vercel routing, and provider quotas.
