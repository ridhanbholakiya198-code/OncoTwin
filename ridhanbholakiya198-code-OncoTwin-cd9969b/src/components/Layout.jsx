import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import TopBar from './TopBar.jsx'

const TITLES = {
  '/': ['Dashboard', 'Runs, recent activity, and system status'],
  '/literature': ['Literature Explorer', 'Search and connect published evidence'],
  '/ranking': ['Drug Ranking', 'Existing combinations ranked with evidence'],
  '/agents': ['Multi-Agent Reasoning', 'Evidence · Biology · Drug-Interaction · Statistics · Critic · Consensus'],
  '/case/open': ['Open Case Workspace', 'Real, unsolved case — engine proposes hypotheses'],
  '/case/benchmark': ['Benchmark Workspace', 'Blind validation against a solved historical case'],
  '/reports': ['Reports', 'Export researcher-style evidence documents'],
  '/settings': ['Settings', 'Models, API keys, and usage limits'],
}

export default function Layout() {
  const { pathname } = useLocation()
  const [title, subtitle] = TITLES[pathname] || ['OncoTwin', '']
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="h-screen min-h-0 flex bg-bg overflow-hidden">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <TopBar title={title} subtitle={subtitle} onMenu={() => setMobileNavOpen(true)} />
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6 max-md:p-4 max-sm:p-3">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
