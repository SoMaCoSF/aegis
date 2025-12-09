// ==============================================================================
// file_id: SOM-SCR-0040-v1.0.0
// name: App.tsx
// description: AEGIS Dashboard App Router v1.0
// project_id: AEGIS
// category: component
// tags: [router, app, dashboard]
// created: 2025-12-08
// modified: 2025-12-08
// version: 1.0.0
// ==============================================================================

import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Subscriptions from './pages/Subscriptions'
import GitHub from './pages/GitHub'
import Privacy from './pages/Privacy'
import Assistant from './pages/Assistant'
import Network from './pages/Network'
import Proxy from './pages/Proxy'
import Status from './pages/Status'
import KnowledgeGraph from './pages/KnowledgeGraph'
import AITracker from './pages/AITracker'
import Discovery from './pages/Discovery'
import Social from './pages/Social'
import Finance from './pages/Finance'
import CloudStorage from './pages/CloudStorage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Core */}
        <Route index element={<Dashboard />} />
        <Route path="status" element={<Status />} />

        {/* Account Management */}
        <Route path="accounts" element={<Accounts />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="discovery" element={<Discovery />} />

        {/* Privacy Suite */}
        <Route path="network" element={<Network />} />
        <Route path="proxy" element={<Proxy />} />
        <Route path="privacy" element={<Privacy />} />

        {/* Integrations */}
        <Route path="github" element={<GitHub />} />
        <Route path="social" element={<Social />} />
        <Route path="finance" element={<Finance />} />
        <Route path="cloud" element={<CloudStorage />} />

        {/* Tools */}
        <Route path="assistant" element={<Assistant />} />
        <Route path="graph" element={<KnowledgeGraph />} />
        <Route path="ai" element={<AITracker />} />
      </Route>
    </Routes>
  )
}

export default App
