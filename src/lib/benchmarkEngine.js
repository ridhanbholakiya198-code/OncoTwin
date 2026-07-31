// Part 8 — Benchmark / Blind Validation
// Runs the same reasoning engine on a historical case's PRE-TREATMENT data only,
// then compares its top hypothesis against the real recorded outcome.

import { runReasoningEngine } from './reasoningEngine.js'

export const SAMPLE_BENCHMARK_CASES = [
  {
    id: 'benchmark-1',
    label: 'Stage III EGFR Exon 19 del, post-chemoradiation (2018 profile)',
    preTreatmentInput: {
      mutationProfile: 'EGFR Exon 19 deletion',
      stage: 'Stage III (unresectable)',
      priorTreatment: 'Concurrent chemoradiation, no progression',
      biomarkers: 'PD-L1 status not specified',
    },
    // Real recorded outcome, hidden from the engine during the run.
    realOutcome: {
      treatmentUsed: 'Consolidation osimertinib (adjuvant EGFR-TKI following chemoradiation)',
      summary: 'Reflects the LAURA-trial-era standard of adding an EGFR-TKI after chemoradiation for unresectable stage III EGFR-mutant NSCLC.',
    },
  },
  {
    id: 'benchmark-2',
    label: 'Treatment-naive EGFR L858R with brain metastases (first-line, 2020 profile)',
    preTreatmentInput: {
      mutationProfile: 'EGFR L858R mutation',
      stage: 'Stage IV (de novo metastatic, brain metastases present)',
      priorTreatment: 'None — treatment-naive',
      biomarkers: 'PD-L1 TPS not routinely tested prior to first-line targeted therapy',
    },
    realOutcome: {
      treatmentUsed: 'First-line osimertinib monotherapy',
      summary: 'Reflects the FLAURA-trial-era standard of first-line osimertinib for treatment-naive EGFR-mutant NSCLC, chosen for its strong CNS penetration and activity against brain metastases.',
    },
  },
  {
    id: 'benchmark-3',
    label: 'EGFR Exon 19 del, MET-amplification-driven resistance after osimertinib (2022 profile)',
    preTreatmentInput: {
      mutationProfile: 'EGFR Exon 19 deletion, repeat biopsy shows new MET amplification',
      stage: 'Stage IV, progressed on first-line osimertinib',
      priorTreatment: '1st-line osimertinib for 16 months, then progression; repeat tissue biopsy performed',
      biomarkers: 'MET amplification confirmed (FISH MET/CEP7 ratio elevated), no EGFR C797S detected',
    },
    realOutcome: {
      treatmentUsed: 'Osimertinib plus savolitinib combination (MET inhibitor add-on)',
      summary: 'Reflects the TATTON/SAVANNAH-trial-era rationale for adding a MET inhibitor to osimertinib once MET-amplification-driven resistance is confirmed on biopsy.',
    },
  },
  {
    id: 'benchmark-4',
    label: 'EGFR Exon 19 del, progression with no identifiable targetable resistance mechanism (2021 profile)',
    preTreatmentInput: {
      mutationProfile: 'EGFR Exon 19 deletion',
      stage: 'Stage IV, progressed on first-line osimertinib',
      priorTreatment: '1st-line osimertinib for 11 months, then progression; repeat biopsy and ctDNA found no targetable resistance mutation (no MET amplification, no C797S, no histologic transformation)',
      biomarkers: 'No actionable secondary alteration identified',
    },
    realOutcome: {
      treatmentUsed: 'Platinum-based doublet chemotherapy (carboplatin-pemetrexed)',
      summary: 'Reflects the long-standing real-world standard of switching to platinum-doublet chemotherapy when no targetable resistance mechanism is found after TKI progression, per NCCN guidance from that period.',
    },
  },
]

const STOPWORDS = new Set([
  'following', 'after', 'during', 'using', 'with', 'from', 'into', 'onto', 'via', 'plus', 'monotherapy',
])

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ')
}

function tokenize(text) {
  return normalize(text).split(' ').filter(Boolean)
}

function scoreMatch(hypotheses, realOutcome) {
  const realTokens = tokenize(realOutcome.treatmentUsed).filter(
    (w) => w.length > 4 && !STOPWORDS.has(w)
  )
  let best = { level: 'miss', hypothesis: null }

  for (const h of hypotheses) {
    const hypTokens = tokenize(`${h.title} ${h.mechanism}`)
    const hits = realTokens.filter((term) =>
      hypTokens.some((tok) => tok.startsWith(term.slice(0, 7)) || term.startsWith(tok.slice(0, 7)))
    ).length

    const ratio = realTokens.length > 0 ? hits / realTokens.length : 0
    if (ratio >= 0.6) return { level: 'match', hypothesis: h }
    if (ratio > 0 && best.level !== 'match') {
      best = { level: 'partial', hypothesis: h }
    }
  }
  return best
}

export async function runBenchmark({ benchmarkCase, provider, apiKey, onLog }) {
  const engineResult = await runReasoningEngine({
    caseInput: benchmarkCase.preTreatmentInput,
    provider,
    apiKey,
    onLog,
  })

  const score = scoreMatch(engineResult.hypotheses, benchmarkCase.realOutcome)

  return {
    hypotheses: engineResult.hypotheses,
    rejected: engineResult.rejected,
    realOutcome: benchmarkCase.realOutcome,
    score, // { level: 'match' | 'partial' | 'miss', hypothesis }
  }
}
