// Part 13 — Data Layer Integration (PubMed)
// Uses NCBI's public E-utilities. No API key required for light use. Data is
// fetched live on every search — nothing is cached or stored locally, per the
// blueprint's "don't duplicate public datasets" rule.

const ESEARCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi'
const ESUMMARY = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi'

export async function searchPubMed(term, maxResults = 8) {
  const searchUrl = `${ESEARCH}?db=pubmed&retmode=json&retmax=${maxResults}&term=${encodeURIComponent(term)}`
  const searchRes = await fetch(searchUrl)
  if (!searchRes.ok) throw new Error('PubMed search failed.')
  const searchData = await searchRes.json()
  const ids = searchData.esearchresult?.idlist || []

  if (ids.length === 0) return []

  const summaryUrl = `${ESUMMARY}?db=pubmed&retmode=json&id=${ids.join(',')}`
  const summaryRes = await fetch(summaryUrl)
  if (!summaryRes.ok) throw new Error('PubMed summary fetch failed.')
  const summaryData = await summaryRes.json()

  return ids
    .map((id) => summaryData.result?.[id])
    .filter(Boolean)
    .map((item) => ({
      id: item.uid,
      title: item.title,
      authors: (item.authors || []).map((a) => a.name).join(', '),
      journal: item.fulljournalname || item.source,
      pubdate: item.pubdate,
      url: `https://pubmed.ncbi.nlm.nih.gov/${item.uid}/`,
    }))
}
