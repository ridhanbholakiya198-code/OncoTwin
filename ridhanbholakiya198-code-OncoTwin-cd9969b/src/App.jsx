import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import LiteratureExplorer from './pages/LiteratureExplorer.jsx'
import DrugRanking from './pages/DrugRanking.jsx'
import MultiAgentReasoning from './pages/MultiAgentReasoning.jsx'
import CaseWorkspaceOpen from './pages/CaseWorkspaceOpen.jsx'
import CaseWorkspaceBenchmark from './pages/CaseWorkspaceBenchmark.jsx'
import Reports from './pages/Reports.jsx'
import Settings from './pages/Settings.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'
import Disclaimer from './pages/Disclaimer.jsx'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center bg-bg text-muted text-sm">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/disclaimer" element={<Disclaimer />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="literature" element={<LiteratureExplorer />} />
        <Route path="ranking" element={<DrugRanking />} />
        <Route path="agents" element={<MultiAgentReasoning />} />
        <Route path="case/open" element={<CaseWorkspaceOpen />} />
        <Route path="case/benchmark" element={<CaseWorkspaceBenchmark />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
