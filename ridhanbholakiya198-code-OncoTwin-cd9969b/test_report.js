import { buildReportMarkdown } from './src/lib/reportExport.js'

const openCaseRun = {
  type: 'open_case',
  provider: 'gemini',
  createdAt: { toDate: () => new Date('2023-01-01T12:00:00Z') },
  caseInput: { mutationProfile: 'EGFR Exon 19', stage: 'Stage IV' },
  hypotheses: [
    { title: 'Hypo 1', anchor: 'speculative', mechanism: 'Mech 1', evidenceStrength: 'low', supportingStudies: 'None', limitations: 'Many' },
    { title: 'Hypo 2', anchor: 'theoretical', mechanism: 'Mech 2', evidenceStrength: 'medium', supportingStudies: 'Some', limitations: 'Few' }
  ],
  rejected: [{ title: 'Rejected 1', reason: 'Toxicity' }]
}

const benchmarkRun = {
  type: 'benchmark',
  provider: 'claude',
  createdAt: { toDate: () => new Date('2023-01-02T12:00:00Z') },
  benchmarkCaseId: 'benchmark-1',
  hypotheses: [
    { title: 'Osimertinib', anchor: 'established', mechanism: 'EGFR-TKI', evidenceStrength: 'high', supportingStudies: 'FLAURA', limitations: 'Resistance' }
  ],
  realOutcome: { treatmentUsed: 'Osimertinib 80mg' },
  score: 'match'
}

console.log("=== OPEN CASE ===")
console.log(buildReportMarkdown(openCaseRun))
console.log("=== BENCHMARK ===")
console.log(buildReportMarkdown(benchmarkRun))
