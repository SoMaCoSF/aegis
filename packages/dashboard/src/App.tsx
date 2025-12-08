import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Subscriptions from './pages/Subscriptions'
import GitHub from './pages/GitHub'
import Privacy from './pages/Privacy'
import Assistant from './pages/Assistant'
import Network from './pages/Network'

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
      </Route>
    </Routes>
  )
}

export default App
