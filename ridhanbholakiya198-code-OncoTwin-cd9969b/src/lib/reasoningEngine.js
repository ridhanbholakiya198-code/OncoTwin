// Part 5 — Core Reasoning Engine (v1: unified single-agent pass)
//
// This is the real "engine" — it takes structured case input, builds a
// evidence-anchored prompt (not a "write me a cure" prompt), calls whichever
// provider the user configured, and parses the response into a structured
// hypothesis list. No medical claims are made — every hypothesis must come
// back with an anchor status and named limitations, or it's rejected before
// it ever reaches the UI.


const SYSTEM_PROMPT = `You are the OncoTwin Core Reasoning Engine, focused exclusively on
EGFR-mutant NSCLC (non-small cell lung cancer). You generate research hypotheses for
scientists to evaluate — you do NOT provide medical advice and you never claim a cure.

Rules you must follow:
1. Base every hypothesis only on named, real, published evidence (cite paper/trial names
   or well-known mechanisms). Never invent a citation.
2. Tag every hypothesis with an anchor status: "established", "theoretical", or "speculative".
3. Never output a single confidence percentage. Instead give: evidence strength (low/medium/high),
   number of supporting studies (approximate, or "unknown" if you cannot ground it),
   and cross-consideration notes (does this conflict with any known finding?).
4. Always include an explicit "limitations" field naming what is NOT known or NOT validated.
5. Reject and do not output any hypothesis that violates basic toxicity, receptor-binding,
   or known biological constraints — briefly note what you rejected and why instead.
6. Return ONLY valid JSON matching this shape, nothing else:
{
  "hypotheses": [
    {
      "title": "string",
      "anchor": "established" | "theoretical" | "speculative",
      "mechanism": "string",
      "evidenceStrength": "low" | "medium" | "high",
      "supportingStudies": "string",
      "limitations": "string"
    }
  ],
  "rejected": [
    { "title": "string", "reason": "string" }
  ]
}`

function buildUserPrompt(caseInput) {
  return `Case input:
- Mutation profile: ${caseInput.mutationProfile || 'not provided'}
- Stage: ${caseInput.stage || 'not provided'}
- Prior treatment: ${caseInput.priorTreatment || 'not provided'}
- Biomarkers: ${caseInput.biomarkers || 'not provided'}

Generate up to 5 ranked hypotheses for further research, per your rules.`
}

// Calls the selected provider and returns the raw text response.
// Part 14 fix: All providers (Claude, GPT, Grok, and Gemini) are routed through
// a Netlify serverless proxy (netlify/functions/ai-proxy.js) to keep API keys
// out of the browser and prevent CORS issues.
import { auth } from './firebase.js'

const PROXY_URL = '/api/ai-proxy'

async function callViaProxy(provider, apiKey, body) {
  let idToken = '';
  if (auth.currentUser) {
    idToken = await auth.currentUser.getIdToken();
  }
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({ provider, apiKey, body }),
  })
  const data = await res.json()
  if (!res.ok) {
    const err = new Error(data?.error?.message || data?.error || `${provider} API error`)
    err.debugInfo = data?.debug || null
    err.httpStatus = res.status
    throw err
  }
  return data
}

let cachedDefaultProvider = null;

export async function getDefaultProvider() {
  if (!cachedDefaultProvider) {
    try {
      const res = await fetch('/api/config')
      const config = await res.json()
      cachedDefaultProvider = config.defaultProvider || 'claude'
    } catch {
      cachedDefaultProvider = 'claude'
    }
  }
  return cachedDefaultProvider;
}

export async function callProvider(provider, apiKey, systemPrompt, userPrompt) {
  if (provider === 'claude') {
    const data = await callViaProxy('claude', apiKey, {
      model: 'claude-sonnet-5',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })
    return data.content?.map((c) => c.text || '').join('\n') || ''
  }

  if (provider === 'gpt') {
    const data = await callViaProxy('gpt', apiKey, {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })
    return data.choices?.[0]?.message?.content || ''
  }

  if (provider === 'gemini') {
    const data = await callViaProxy('gemini', apiKey, {
      contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 8192,
      },
    })
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  if (provider === 'grok') {
    const data = await callViaProxy('grok', apiKey, {
      model: 'grok-2-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })
    return data.choices?.[0]?.message?.content || ''
  }

  throw new Error(`Unknown provider: ${provider}`)
}

function parseEngineResponse(rawText) {
  // Strip markdown code fences if the model wrapped its JSON in them.
  const cleaned = rawText.replace(/```json|```/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    return {
      hypotheses: Array.isArray(parsed.hypotheses) ? parsed.hypotheses : [],
      rejected: Array.isArray(parsed.rejected) ? parsed.rejected : [],
    }
  } catch (err) {
    throw new Error('The AI response could not be read as valid data. This can happen occasionally — please try again.', { cause: err })
  }
}

// Public entry point used by the Case Workspace pages.
// caseInput: { mutationProfile, stage, priorTreatment, biomarkers }
// provider: 'claude' | 'gpt' | 'gemini' | 'grok'
// apiKey: the user's BYOK key for that provider

export async function runReasoningEngine({ caseInput, provider, apiKey, onLog }) {
  let activeProvider = provider;
  if (!apiKey || apiKey.trim() === '') {
    activeProvider = await getDefaultProvider();
    
    if (!auth.currentUser) {
      throw new Error('You must be logged in to use the free shared AI key.');
    }
  }

  onLog?.({ step: 'start', message: `Sending case to ${activeProvider}…` })

  const userPrompt = buildUserPrompt(caseInput)
  const rawText = await callProvider(activeProvider, apiKey, SYSTEM_PROMPT, userPrompt)

  onLog?.({ step: 'received', message: 'Response received, parsing…' })

  const result = parseEngineResponse(rawText)

  onLog?.({
    step: 'done',
    message: `${result.hypotheses.length} hypotheses returned, ${result.rejected.length} rejected.`,
  })

  return result
}
