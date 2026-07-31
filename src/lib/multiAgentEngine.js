// Part 6 — Multi-Agent Split
//
// Splits the Part 5 unified engine into six specialized roles. Each agent
// gets its own narrow system prompt and can use a different underlying
// model (set per-agent in Settings/Multi-Agent screen). The Consensus Agent
// runs last and reconciles the other five into one final ranked output —
// it never introduces new claims of its own, only weighs what the others said.

import { callProvider, getDefaultProvider } from './reasoningEngine.js'

export const AGENT_DEFS = [
  {
    id: 'evidence',
    name: 'Evidence Agent',
    systemPrompt: `You are the Evidence Agent for OncoTwin (EGFR-mutant NSCLC research tool).
Your only job: given the case input, list the most relevant known published studies, trials,
or established findings. Do not propose new treatment ideas. Do not invent citations — if you
are not confident a paper/trial name is real, describe the finding generically instead
(e.g. "large Phase III trials on osimertinib in this setting") rather than naming a fake paper.
Return plain text, 4-8 short bullet points.`,
  },
  {
    id: 'biology',
    name: 'Biology Agent',
    systemPrompt: `You are the Biology Agent for OncoTwin (EGFR-mutant NSCLC research tool).
Your only job: assess mechanism plausibility. Given the case input and the Evidence Agent's
findings (provided to you), explain which mechanisms are biologically well-established vs.
theoretical vs. speculative for this specific mutation/stage profile. Flag anything that
would violate known biology. Return plain text, short and direct.`,
  },
  {
    id: 'drugInteraction',
    name: 'Drug-Interaction Agent',
    systemPrompt: `You are the Drug-Interaction Agent for OncoTwin (EGFR-mutant NSCLC research tool).
Your only job: flag toxicity concerns, known contraindications, and interaction risks for any
drug or combination under discussion for this case. Be conservative — if something is
under-studied, say so explicitly rather than assuming it is safe.`,
  },
  {
    id: 'statistics',
    name: 'Statistics Agent',
    systemPrompt: `You are the Statistics Agent for OncoTwin (EGFR-mutant NSCLC research tool).
Your only job: comment on dataset coverage and confidence. For the ideas raised so far, note
how much real-world data exists (large trials vs. small studies vs. case reports vs. none),
and give a qualitative confidence level (low/medium/high) with a one-line reason. Never output
a single made-up percentage.`,
  },
  {
    id: 'critic',
    name: 'Critic Agent',
    systemPrompt: `You are the Critic Agent for OncoTwin (EGFR-mutant NSCLC research tool).
Your only job: actively argue against the weakest points raised by the other agents so far.
Be skeptical. Point out where evidence is thin, where reasoning is circular, or where a
hypothesis is more exciting than justified. This is a deliberate adversarial check, not a
summary.`,
  },
  {
    id: 'consensus',
    name: 'Consensus Agent',
    systemPrompt: `You are the Consensus Agent for OncoTwin (EGFR-mutant NSCLC research tool).
You receive the outputs of the Evidence, Biology, Drug-Interaction, Statistics, and Critic
agents. Do not introduce new hypotheses of your own. Reconcile their input into a final ranked
list. Return ONLY valid JSON in this shape:
{
  "hypotheses": [
    {
      "title": "string",
      "anchor": "established" | "theoretical" | "speculative",
      "mechanism": "string",
      "evidenceStrength": "low" | "medium" | "high",
      "supportingStudies": "string",
      "criticNote": "string",
      "limitations": "string"
    }
  ]
}`,
  },
]

function caseInputToText(caseInput) {
  return `Case input:
- Mutation profile: ${caseInput.mutationProfile || 'not provided'}
- Stage: ${caseInput.stage || 'not provided'}
- Prior treatment: ${caseInput.priorTreatment || 'not provided'}
- Biomarkers: ${caseInput.biomarkers || 'not provided'}`
}

// agentModels: { evidence: 'claude', biology: 'gpt', ... }
// apiKeys: { claude: 'sk-...', gpt: '...', gemini: '...', grok: '...' }
export async function runMultiAgentEngine({ caseInput, agentModels, apiKeys, onAgentDone }) {
  const transcript = {}
  const caseText = caseInputToText(caseInput)

  for (const agent of AGENT_DEFS) {
    if (agent.id === 'consensus') continue // runs last, separately

    const provider = agentModels[agent.id]
    const apiKey = apiKeys[provider] || ''
    if (!provider) {
      transcript[agent.id] = '(skipped — no model configured for this agent)'
      onAgentDone?.(agent.id, transcript[agent.id])
      continue
    }

    const priorContext = Object.entries(transcript)
      .map(([id, text]) => `${id.toUpperCase()} AGENT FINDINGS:\n${text}`)
      .join('\n\n')

    const userPrompt = `${caseText}\n\n${priorContext ? priorContext + '\n\n' : ''}Give your assessment now.`

    let activeProvider = provider;
    const defaultProvider = await getDefaultProvider();
    if (!apiKey || apiKey.trim() === '') {
      if (provider !== defaultProvider) {
        transcript[agent.id] = `(Skipped — no API key configured for ${provider})`;
        onAgentDone?.(agent.id, transcript[agent.id]);
        continue;
      }
      activeProvider = defaultProvider;
    }
    const output = await callProvider(activeProvider, apiKey, agent.systemPrompt, userPrompt)
    transcript[agent.id] = output
    onAgentDone?.(agent.id, output)
  }

  // Consensus pass
  const consensusAgent = AGENT_DEFS.find((a) => a.id === 'consensus')
  const consensusProvider = agentModels.consensus
  const consensusKey = apiKeys[consensusProvider] || ''

  if (!consensusProvider) {
    return { transcript, consensus: null, consensusError: 'No model configured for Consensus Agent.' }
  }

  const fullTranscript = Object.entries(transcript)
    .map(([id, text]) => `${id.toUpperCase()} AGENT FINDINGS:\n${text}`)
    .join('\n\n')

  let activeConsensusProvider = consensusProvider;
  const defaultProvider = await getDefaultProvider();
  if (!consensusKey || consensusKey.trim() === '') {
    if (consensusProvider !== defaultProvider) {
      return { transcript, consensus: null, consensusError: `Skipped — no API key configured for ${consensusProvider}` };
    }
    activeConsensusProvider = defaultProvider;
  }

  const consensusRaw = await callProvider(
    activeConsensusProvider,
    consensusKey,
    consensusAgent.systemPrompt,
    `${caseText}\n\n${fullTranscript}`
  )

  let consensus = null
  let consensusError = null
  try {
    consensus = JSON.parse(consensusRaw.replace(/```json|```/g, '').trim())
  } catch {
    consensusError = 'Consensus Agent returned non-JSON output.'
  }

  onAgentDone?.('consensus', consensusRaw)

  return { transcript, consensus, consensusError }
}
