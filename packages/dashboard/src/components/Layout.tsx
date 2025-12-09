// ==============================================================================
// file_id: SOM-SCR-0041-v1.0.0
// name: Layout.tsx
// description: AEGIS Dashboard Layout with navigation v1.0
// project_id: AEGIS
// category: component
// tags: [layout, navigation, sidebar]
// created: 2025-12-08
// modified: 2025-12-08
// version: 1.0.0
// ==============================================================================

import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Github,
  Shield,
  ShieldCheck,
  Settings,
  RefreshCw,
  Network,
  Ghost,
  Sparkles,
  Brain,
  Cpu,
  Search,
  DollarSign,
  Cloud,
  Activity,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface NavSection {
  title: string
  items: Array<{
    to: string
    icon: React.ComponentType<{ className?: string }>
    label: string
    badge?: string
  }>
}

const navSections: NavSection[] = [
  {
    title: 'Core',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/status', icon: ShieldCheck, label: 'System Status' },
    ]
  },
  {
    title: 'Privacy Suite',
    items: [
      { to: '/network', icon: Network, label: 'Network (DMBT)' },
      { to: '/proxy', icon: Ghost, label: 'Proxy (Ghost)' },
      { to: '/privacy', icon: Shield, label: 'Privacy Exposure' },
    ]
  },
  {
    title: 'Account Management',
    items: [
      { to: '/accounts', icon: Users, label: 'Accounts' },
      { to: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
      { to: '/discovery', icon: Search, label: 'Discovery' },
    ]
  },
  {
    title: 'Integrations',
    items: [
      { to: '/github', icon: Github, label: 'GitHub' },
      { to: '/social', icon: Users, label: 'Social' },
      { to: '/finance', icon: DollarSign, label: 'Finance' },
      { to: '/cloud', icon: Cloud, label: 'Cloud Storage' },
    ]
  },
  {
    title: 'Tools',
    items: [
      { to: '/assistant', icon: Sparkles, label: 'Assistant' },
      { to: '/graph', icon: Brain, label: 'Knowledge Graph' },
      { to: '/ai', icon: Cpu, label: 'AI Tracker' },
    ]
  }
]

interface SystemHealth {
  api: boolean
  dmbt: boolean
  ghost: boolean
}

export default function Layout() {
  const [syncing, setSyncing] = useState(false)
  const [health, setHealth] = useState<SystemHealth>({ api: false, dmbt: false, ghost: false })
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(navSections.map(s => s.title))
  )
  const location = useLocation()

  // Check system health periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health')
        if (response.ok) {
          const data = await response.json()
          setHealth({
            api: true,
            dmbt: data.services?.dmbt || false,
            ghost: data.services?.ghostShell || false
          })
        }
      } catch {
        setHealth({ api: false, dmbt: false, ghost: false })
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000) // Check every 30s
    return () => clearInterval(interval)
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      await fetch('/api/sync', { method: 'POST' })
    } catch (e) {
      console.error('Sync failed:', e)
    }
    setTimeout(() => setSyncing(false), 2000)
  }

  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      return next
    })
  }

  const protectionLevel = health.api && health.dmbt && health.ghost
    ? 'protected'
    : health.api && (health.dmbt || health.ghost)
    ? 'partial'
    : 'offline'

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              protectionLevel === 'protected'
                ? 'bg-gradient-to-br from-green-500 to-green-700'
                : protectionLevel === 'partial'
                ? 'bg-gradient-to-br from-yellow-500 to-yellow-700'
                : 'bg-gradient-to-br from-gray-500 to-gray-700'
            }`}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AEGIS</h1>
              <p className="text-xs text-gray-500">Privacy Suite v1.0</p>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${
                protectionLevel === 'protected' ? 'text-green-400' :
                protectionLevel === 'partial' ? 'text-yellow-400' :
                'text-red-400'
              }`} />
              <span className="text-sm text-gray-400">
                {protectionLevel === 'protected' ? 'Fully Protected' :
                 protectionLevel === 'partial' ? 'Partial' :
                 'Offline'}
              </span>
            </div>
            <div className="flex gap-1">
              <div className={`w-2 h-2 rounded-full ${health.api ? 'bg-green-400' : 'bg-red-400'}`} title="API" />
              <div className={`w-2 h-2 rounded-full ${health.dmbt ? 'bg-green-400' : 'bg-gray-600'}`} title="DMBT" />
              <div className={`w-2 h-2 rounded-full ${health.ghost ? 'bg-green-400' : 'bg-gray-600'}`} title="Ghost" />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {navSections.map(section => (
            <div key={section.title} className="mb-4">
              <button
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-400"
              >
                {section.title}
                {expandedSections.has(section.title) ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
              {expandedSections.has(section.title) && (
                <ul className="mt-1 space-y-1">
                  {section.items.map(({ to, icon: Icon, label, badge }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                          `flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-aegis-600 text-white'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          }`
                        }
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{label}</span>
                        </div>
                        {badge && (
                          <span className="px-1.5 py-0.5 text-xs bg-aegis-500 text-white rounded">
                            {badge}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync All'}</span>
          </button>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
            <span>v1.0.0</span>
            <NavLink to="/status" className="hover:text-gray-400">
              <Settings className="w-4 h-4" />
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
