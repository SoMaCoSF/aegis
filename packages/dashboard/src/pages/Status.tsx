// ==============================================================================
// file_id: SOM-SCR-0032-v1.0.0
// name: Status.tsx
// description: AEGIS System Status - All integrations in one place
// project_id: AEGIS
// category: component
// tags: [dashboard, status, integrations, health]
// created: 2025-12-08
// modified: 2025-12-08
// version: 1.0.0
// ==============================================================================

import { useEffect, useState, useCallback } from 'react'
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Database,
  Server,
  Globe,
  Ghost,
  Fingerprint,
  Cookie,
  Brain,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  Cpu,
  HardDrive,
  Clock,
  Zap,
  GitBranch,
  Terminal
} from 'lucide-react'

interface SystemStatus {
  aegis: {
    version: string
    uptime: number
    memory: {
      heapUsed: number
      heapTotal: number
      rss: number
    }
  }
  dmbt: {
    connected: boolean
    agentRunning: boolean
    stats: {
      domains: number
      ips: number
      asns: number
      prefixes: number
      blocked: number
    }
  }
  ghostShell: {
    connected: boolean
    proxyRunning: boolean
    stats: {
      requests: number
      blockedRequests: number
      cookies: number
      blockedCookies: number
      fingerprints: number
    }
  }
}

interface ServiceStatus {
  name: string
  icon: React.ReactNode
  status: 'online' | 'offline' | 'degraded' | 'unknown'
  description: string
  stats?: Record<string, number | string>
  actions?: Array<{ label: string; onClick: () => void }>
}

export default function StatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Individual service checks
  const [dmbtAgent, setDmbtAgent] = useState<'online' | 'offline'>('offline')
  const [ghostProxy, setGhostProxy] = useState<'online' | 'offline'>('offline')
  const [apiServer, setApiServer] = useState<'online' | 'offline'>('offline')

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
        setApiServer('online')
      }
    } catch (error) {
      console.error('Failed to fetch status:', error)
      setApiServer('offline')
    }
    setLoading(false)
    setRefreshing(false)
    setLastUpdate(new Date())
  }, [])

  const checkDmbtAgent = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8088/health', {
        signal: AbortSignal.timeout(1000)
      })
      setDmbtAgent(response.ok ? 'online' : 'offline')
    } catch {
      setDmbtAgent('offline')
    }
  }, [])

  const checkGhostProxy = useCallback(async () => {
    try {
      await fetch('http://localhost:8080/', {
        signal: AbortSignal.timeout(1000),
        mode: 'no-cors'
      })
      setGhostProxy('online')
    } catch {
      setGhostProxy('offline')
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    checkDmbtAgent()
    checkGhostProxy()

    const interval = setInterval(() => {
      fetchStatus()
      checkDmbtAgent()
      checkGhostProxy()
    }, 10000)

    return () => clearInterval(interval)
  }, [fetchStatus, checkDmbtAgent, checkGhostProxy])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchStatus()
    checkDmbtAgent()
    checkGhostProxy()
  }

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatBytes = (bytes: number): string => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  // Calculate overall protection level
  const getProtectionLevel = (): { level: string; color: string; percentage: number } => {
    let score = 0
    if (apiServer === 'online') score += 25
    if (status?.dmbt.connected) score += 25
    if (dmbtAgent === 'online') score += 15
    if (status?.ghostShell.connected) score += 25
    if (ghostProxy === 'online') score += 10

    if (score >= 90) return { level: 'Fully Protected', color: 'text-green-400', percentage: score }
    if (score >= 60) return { level: 'Partially Protected', color: 'text-yellow-400', percentage: score }
    if (score >= 30) return { level: 'Minimal Protection', color: 'text-orange-400', percentage: score }
    return { level: 'Not Protected', color: 'text-red-400', percentage: score }
  }

  const protection = getProtectionLevel()

  const services: ServiceStatus[] = [
    {
      name: 'AEGIS API Server',
      icon: <Server className="w-6 h-6" />,
      status: apiServer,
      description: 'Core API server on localhost:4243',
      stats: status ? {
        'Version': status.aegis.version,
        'Uptime': formatUptime(status.aegis.uptime),
        'Memory': formatBytes(status.aegis.memory.heapUsed)
      } : undefined
    },
    {
      name: 'AEGIS Database',
      icon: <Database className="w-6 h-6" />,
      status: apiServer === 'online' ? 'online' : 'offline',
      description: 'SQLite database via Prisma ORM',
      stats: {
        'Engine': 'SQLite',
        'Path': 'database/data/aegis.db'
      }
    },
    {
      name: 'DMBT Database',
      icon: <Globe className="w-6 h-6" />,
      status: status?.dmbt.connected ? 'online' : 'offline',
      description: 'Network intelligence database',
      stats: status?.dmbt.connected ? {
        'Domains': status.dmbt.stats.domains,
        'IPs': status.dmbt.stats.ips,
        'ASNs': status.dmbt.stats.asns,
        'Prefixes': status.dmbt.stats.prefixes,
        'Blocked': status.dmbt.stats.blocked
      } : undefined
    },
    {
      name: 'DMBT Agent',
      icon: <Activity className="w-6 h-6" />,
      status: dmbtAgent,
      description: 'Go agent on localhost:8088',
      stats: {
        'Port': '8088',
        'Protocol': 'HTTP REST'
      }
    },
    {
      name: 'Ghost_Shell Database',
      icon: <Ghost className="w-6 h-6" />,
      status: status?.ghostShell.connected ? 'online' : 'offline',
      description: 'Proxy traffic database',
      stats: status?.ghostShell.connected ? {
        'Requests': status.ghostShell.stats.requests,
        'Blocked Requests': status.ghostShell.stats.blockedRequests,
        'Cookies': status.ghostShell.stats.cookies,
        'Blocked Cookies': status.ghostShell.stats.blockedCookies,
        'Fingerprints': status.ghostShell.stats.fingerprints
      } : undefined
    },
    {
      name: 'Ghost_Shell Proxy',
      icon: <Fingerprint className="w-6 h-6" />,
      status: ghostProxy,
      description: 'mitmproxy on localhost:8080',
      stats: {
        'Port': '8080',
        'Protocol': 'HTTP/HTTPS MITM'
      }
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400 bg-green-500/20'
      case 'offline': return 'text-red-400 bg-red-500/20'
      case 'degraded': return 'text-yellow-400 bg-yellow-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'offline': return <XCircle className="w-5 h-5 text-red-400" />
      case 'degraded': return <AlertCircle className="w-5 h-5 text-yellow-400" />
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-aegis-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-aegis-400" />
            System Status
          </h1>
          <p className="text-gray-400 mt-1">AEGIS Privacy Suite v1.0 - All integrations</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Protection Level Banner */}
      <div className={`mb-8 p-6 rounded-xl border ${
        protection.percentage >= 90 ? 'bg-green-500/10 border-green-500/30' :
        protection.percentage >= 60 ? 'bg-yellow-500/10 border-yellow-500/30' :
        protection.percentage >= 30 ? 'bg-orange-500/10 border-orange-500/30' :
        'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className={`w-12 h-12 ${protection.color}`} />
            <div>
              <h2 className={`text-2xl font-bold ${protection.color}`}>{protection.level}</h2>
              <p className="text-gray-400">
                {protection.percentage}% of privacy services active
              </p>
            </div>
          </div>
          <div className="w-48">
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  protection.percentage >= 90 ? 'bg-green-500' :
                  protection.percentage >= 60 ? 'bg-yellow-500' :
                  protection.percentage >= 30 ? 'bg-orange-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${protection.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400 text-sm">Memory</span>
          </div>
          <p className="text-xl font-bold text-white">
            {status ? formatBytes(status.aegis.memory.heapUsed) : '-'}
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-green-400" />
            <span className="text-gray-400 text-sm">Uptime</span>
          </div>
          <p className="text-xl font-bold text-white">
            {status ? formatUptime(status.aegis.uptime) : '-'}
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span className="text-gray-400 text-sm">ASNs</span>
          </div>
          <p className="text-xl font-bold text-white">
            {status?.dmbt.stats.asns || 0}
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <Cookie className="w-4 h-4 text-orange-400" />
            <span className="text-gray-400 text-sm">Cookies Blocked</span>
          </div>
          <p className="text-xl font-bold text-orange-400">
            {status?.ghostShell.stats.blockedCookies || 0}
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <Fingerprint className="w-4 h-4 text-purple-400" />
            <span className="text-gray-400 text-sm">Fingerprints</span>
          </div>
          <p className="text-xl font-bold text-purple-400">
            {status?.ghostShell.stats.fingerprints || 0}
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-400 text-sm">Version</span>
          </div>
          <p className="text-xl font-bold text-white">
            {status?.aegis.version || '1.0.0'}
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <h3 className="text-lg font-semibold text-white mb-4">Services</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {services.map((service, i) => (
          <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getStatusColor(service.status)}`}>
                    {service.icon}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{service.name}</h4>
                    <p className="text-gray-500 text-sm">{service.description}</p>
                  </div>
                </div>
                {getStatusIcon(service.status)}
              </div>
            </div>
            {service.stats && (
              <div className="p-4 bg-gray-800/50">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(service.stats).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-gray-500 text-xs">{key}</span>
                      <p className="text-gray-300 text-sm font-mono">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Architecture Diagram */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          System Architecture
        </h3>
        <pre className="text-xs text-gray-400 font-mono overflow-x-auto">
{`
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         AEGIS PRIVACY SUITE v1.0                                 │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                 React Dashboard (localhost:4242)                         │   │
│  │  Pages: Dashboard, Accounts, Subscriptions, Network, Proxy, Status...   │   │
│  └────────────────────────────────┬────────────────────────────────────────┘   │
│                                   │                                             │
│                                   ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                 Express API Server (localhost:4243)                      │   │
│  │  Status: ${apiServer === 'online' ? '● ONLINE ' : '○ OFFLINE'}                                                          │
│  └────────────────────────────────┬────────────────────────────────────────┘   │
│                                   │                                             │
│           ┌───────────────────────┼───────────────────────┐                    │
│           │                       │                       │                    │
│           ▼                       ▼                       ▼                    │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │   AEGIS DB      │    │    DMBT DB      │    │  Ghost_Shell DB │            │
│  │   (Prisma)      │    │    (SQLite)     │    │    (SQLite)     │            │
│  │ ${apiServer === 'online' ? '● ONLINE' : '○ OFFLINE'}       │    │ ${status?.dmbt.connected ? '● ONLINE' : '○ OFFLINE'}        │    │ ${status?.ghostShell.connected ? '● ONLINE' : '○ OFFLINE'}        │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│                                   │                       │                    │
│                                   ▼                       ▼                    │
│                        ┌─────────────────┐    ┌─────────────────┐             │
│                        │  DMBT Agent     │    │ Ghost_Shell     │             │
│                        │  (Go :8088)     │    │  Proxy (:8080)  │             │
│                        │ ${dmbtAgent === 'online' ? '● ONLINE' : '○ OFFLINE'}        │    │ ${ghostProxy === 'online' ? '● ONLINE' : '○ OFFLINE'}        │             │
│                        └─────────────────┘    └─────────────────┘             │
│                                   │                       │                    │
│                                   ▼                       ▼                    │
│                        ┌─────────────────────────────────────────┐            │
│                        │              YOUR TRAFFIC               │            │
│                        │  Browser ──▶ Proxy ──▶ Firewall ──▶ Web │            │
│                        └─────────────────────────────────────────┘            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
`}
        </pre>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h4 className="text-white font-medium mb-2 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-gray-400" />
            Start DMBT Collector
          </h4>
          <pre className="text-xs text-gray-400 font-mono bg-gray-800 p-2 rounded">
{`cd DMBT
.venv\\Scripts\\activate
python collector\\collector.py`}
          </pre>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h4 className="text-white font-medium mb-2 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-gray-400" />
            Start Ghost_Shell
          </h4>
          <pre className="text-xs text-gray-400 font-mono bg-gray-800 p-2 rounded">
{`cd Ghost_Shell
.venv\\Scripts\\activate
python ghost_shell/launcher.py`}
          </pre>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h4 className="text-white font-medium mb-2 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-gray-400" />
            Configure Browser Proxy
          </h4>
          <pre className="text-xs text-gray-400 font-mono bg-gray-800 p-2 rounded">
{`Proxy: 127.0.0.1:8080
Install cert: http://mitm.it`}
          </pre>
        </div>
      </div>
    </div>
  )
}
