import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import TopBar from './TopBar.jsx'
import Footer from './Footer.jsx'

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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-screen flex bg-bg overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={title} subtitle={subtitle} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
          <div className="flex-1 p-3 sm:p-6">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
