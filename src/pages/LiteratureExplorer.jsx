import { useState } from 'react'
import { searchPubMed } from '../lib/pubmedClient.js'
import Card from '../components/Card.jsx'
import EmptyState from '../components/EmptyState.jsx'

export default function LiteratureExplorer() {
  const [query, setQuery] = useState('EGFR exon 19 osimertinib NSCLC')
  const [status, setStatus] = useState('idle')
  const [results, setResults] = useState([])
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSearch() {
    setStatus('running')
    setErrorMsg('')
    try {
      const papers = await searchPubMed(query)
      setResults(papers)
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message)
    }
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <Card>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search published evidence — gene, drug, or mechanism"
            className="flex-1 bg-surface2 border border-border rounded px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent outline-none"
          />
          <button
            onClick={handleSearch}
            disabled={status === 'running'}
            className="px-4 py-2 rounded bg-accent text-bg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {status === 'running' ? 'Searching…' : 'Search'}
          </button>
        </div>
        <p className="text-[11px] text-muted mt-2">Live from PubMed — nothing is stored locally.</p>
      </Card>

      {status === 'error' && <Card><p className="text-sm text-speculative">{errorMsg}</p></Card>}

      {status === 'done' && results.length === 0 && (
        <EmptyState title="No results" description="Try a broader search term." />
      )}

      {results.length > 0 && (
        <Card title={`${results.length} results`}>
          <div className="space-y-3">
            {results.map((p) => (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="block border border-border rounded p-3 hover:border-accent transition-colors"
              >
                <p className="text-sm text-ink mb-1">{p.title}</p>
                <p className="text-[11px] text-muted font-mono">{p.authors} — {p.journal}, {p.pubdate}</p>
              </a>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
