import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Subscriptions from './pages/Subscriptions'
import GitHub from './pages/GitHub'
import Privacy from './pages/Privacy'
import Assistant from './pages/Assistant'
import Network from './pages/Network'
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
        <Route index element={<Dashboard />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="github" element={<GitHub />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="network" element={<Network />} />
        <Route path="assistant" element={<Assistant />} />
        <Route path="graph" element={<KnowledgeGraph />} />
        <Route path="ai" element={<AITracker />} />
        <Route path="discovery" element={<Discovery />} />
        <Route path="social" element={<Social />} />
        <Route path="finance" element={<Finance />} />
        <Route path="cloud" element={<CloudStorage />} />
      </Route>
    </Routes>
  )
}

export default App
