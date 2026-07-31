// Part 11 — Report Export
// Turns a saved run into a researcher-style markdown document and triggers
// a browser download. No server involved — this runs entirely client-side.

function formatHypothesis(h, i) {
  return `### ${i + 1}. ${h.title}

- **Anchor status:** ${h.anchor || 'unspecified'}
- **Mechanism:** ${h.mechanism || '—'}
- **Evidence strength:** ${h.evidenceStrength || '—'}
- **Supporting studies:** ${h.supportingStudies || '—'}
${h.criticNote ? `- **Critic note:** ${h.criticNote}\n` : ''}- **Limitations:** ${h.limitations || '—'}
`
}

function formatConsistencyHypothesis(h, i, runsCount) {
  let md = `### ${i + 1}. ${h.title}\n`
  md += `- **Consistency:** Appeared in ${h.appearances || 1}/${runsCount} runs\n`
  if (h.anchorChanged) {
    let details;
    if (h.anchorCounts) {
       details = Object.entries(h.anchorCounts).map(([anchor, count]) => `${anchor || 'unspecified'} in ${count} run${count > 1 ? 's' : ''}`).join(', ')
    } else {
       details = h.anchors ? h.anchors.join(', ') : 'unknown'
    }
    md += `- **Anchor status:** Varied: ${details} — INCONSISTENT\n`
  } else {
    md += `- **Anchor status:** ${h.anchor || 'unspecified'}\n`
  }
  md += `- **Mechanism:** ${h.mechanism || '—'}\n`
  md += `- **Evidence strength:** ${h.evidenceStrength || '—'}\n`
  md += `- **Supporting studies:** ${h.supportingStudies || '—'}\n`
  if (h.criticNote) {
    md += `- **Critic note:** ${h.criticNote}\n`
  }
  md += `- **Limitations:** ${h.limitations || '—'}\n`
  return md
}

export function buildReportMarkdown(run) {
  const hypotheses = run.hypotheses || run.consensus?.hypotheses || []
  const createdAt = run.createdAt?.toDate ? run.createdAt.toDate().toLocaleString() : 'unknown time'

  let md = `# OncoTwin Research Report

**Run type:** ${run.type || 'unknown'}${run.runsCount > 1 ? ` (Consistency Check, ${run.runsCount} runs)` : ''}
**Generated:** ${createdAt}
**Focus:** EGFR-mutant NSCLC
**Model:** ${run.provider || 'Unknown'}

> This document is AI-assisted hypothesis output from an open-source research-support
> tool. It is not medical advice, not a diagnosis, and not a validated finding. Every
> hypothesis below requires independent scientific validation before any clinical relevance.

> Citation verification: Citations and study references above are drawn from the AI model's training knowledge and have NOT been independently cross-verified against a live citation database (e.g. PubMed) as part of this report. Verify each citation before relying on it.

## Case Input
`
  if (run.caseInput) {
    for (const [key, value] of Object.entries(run.caseInput)) {
      md += `- **${key}:** ${value || 'not provided'}\n`
    }
  } else if (run.benchmarkCaseId) {
    md += `- **Benchmark case:** ${run.benchmarkCaseId}\n`
  }

  if (run.runsCount > 1) {
    md += `\n## Consistency Report (${run.runsCount} runs)\n\n`
    hypotheses.forEach((h, i) => {
      md += formatConsistencyHypothesis(h, i, run.runsCount) + '\n\n'
    })
  } else {
    md += `\n## Hypotheses\n\n`
    hypotheses.forEach((h, i) => {
      md += formatHypothesis(h, i) + '\n'
    })
  }

  if (hypotheses.length > 0) {
    let theoreticalOrSpeculativeCount = 0
    let establishedCount = 0
    
    hypotheses.forEach(h => {
      if (run.runsCount > 1) {
        if (h.anchorChanged || h.anchors?.includes('theoretical') || h.anchors?.includes('speculative')) {
          theoreticalOrSpeculativeCount++
        } else if (h.anchors?.includes('established')) {
          establishedCount++
        } else {
          theoreticalOrSpeculativeCount++ // fallback
        }
      } else {
        if (h.anchor === 'theoretical' || h.anchor === 'speculative') {
          theoreticalOrSpeculativeCount++
        } else if (h.anchor === 'established') {
          establishedCount++
        }
      }
    })
    
    let confidence = 'medium'
    if (theoreticalOrSpeculativeCount > hypotheses.length / 2 || establishedCount === 0) {
      confidence = 'low'
    } else if (establishedCount > hypotheses.length / 2) {
      confidence = 'high'
    }

    md += `### Uncertainty Summary\n\n`
    md += `${theoreticalOrSpeculativeCount} of ${hypotheses.length} ${run.runsCount > 1 ? 'distinct ' : ''}hypotheses are theoretical or speculative${run.runsCount > 1 ? ' (or had varying status)' : ''} rather than firmly established; overall confidence in this run should be treated as ${confidence} accordingly.\n\n`
  }

  if (run.rejected?.length > 0) {
    md += `## Rejected Combinations (Why not?)\n\n`
    run.rejected.forEach((r) => {
      md += `- **${r.title}** — ${r.reason}\n`
    })
    md += '\n'
  }

  if (run.type === 'benchmark') {
    const engineTopHypothesis = hypotheses.length > 0 ? hypotheses[0].title : 'Not available'
    const realOutcomeText = run.realOutcome?.treatmentUsed || 'Not available'
    
    md += `## Benchmark Comparison\n\n`
    md += `| Engine's Top Hypothesis | Real Historical Outcome |\n`
    md += `|---|---|\n`
    md += `| ${engineTopHypothesis} | ${realOutcomeText} |\n\n`
  }

  if (run.score) {
    md += `## Benchmark Score\n\n**Result:** ${run.score.toUpperCase()}\n\n`
  }

  md += `## Future Validation Needed\n\nEvery hypothesis above requires in-vitro and/or in-vivo confirmation, followed by standard clinical trial phases, before any real-world application. This report is a prioritization aid only.\n`

  return md
}

export function downloadReport(run, filename = 'oncotwin-report.md') {
  const markdown = buildReportMarkdown(run)
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
