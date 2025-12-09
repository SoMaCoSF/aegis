// ==============================================================================
// file_id: SOM-SCR-0031-v1.0.0
// name: Proxy.tsx
// description: Ghost_Shell Proxy Dashboard with live stats
// project_id: AEGIS
// category: component
// tags: [dashboard, proxy, ghost-shell, fingerprint, cookies]
// created: 2025-12-08
// modified: 2025-12-08
// version: 1.0.0
// ==============================================================================

import { useEffect, useState, useCallback } from 'react'
import {
  Ghost,
  Cookie,
  Fingerprint,
  Shield,
  ShieldOff,
  Globe,
  RefreshCw,
  Play,
  Search,
  Ban,
  CheckCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Eye,
  EyeOff
} from 'lucide-react'

interface TrackingDomain {
  id: number
  domain: string
  first_seen: string
  last_seen: string
  hit_count: number
  blocked: boolean
  category: string
}

interface CookieTraffic {
  id: number
  timestamp: string
  domain: string
  cookie_name: string
  cookie_value: string
  blocked: boolean
}

interface FingerprintRotation {
  id: number
  timestamp: string
  user_agent: string
  platform: string
  accept_language: string
  rotation_trigger: string
}

interface RequestLog {
  id: number
  timestamp: string
  method: string
  url: string
  host: string
  blocked: boolean
  block_reason: string | null
}

interface GhostShellStats {
  totalRequests: number
  blockedRequests: number
  totalCookies: number
  blockedCookies: number
  trackingDomains: number
  blockedDomains: number
  fingerprintRotations: number
  whitelistCount: number
  recentRequests: RequestLog[]
  topBlockedDomains: Array<{ domain: string; count: number }>
  recentCookies: CookieTraffic[]
  latestFingerprint: FingerprintRotation | null
  isConnected: boolean
}

export default function ProxyPage() {
  const [stats, setStats] = useState<GhostShellStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [proxyRunning, setProxyRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'cookies' | 'fingerprints' | 'domains'>('overview')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/ghost/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch Ghost_Shell stats:', error)
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  const checkProxy = useCallback(async () => {
    try {
      // Check if proxy is accepting connections on port 8080
      const response = await fetch('http://localhost:8080/', {
        signal: AbortSignal.timeout(1000),
        mode: 'no-cors'
      })
      setProxyRunning(true)
    } catch {
      setProxyRunning(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    checkProxy()
    const interval = setInterval(() => {
      fetchStats()
      checkProxy()
    }, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [fetchStats, checkProxy])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchStats()
    checkProxy()
  }

  const startProxy = async () => {
    try {
      const response = await fetch('/api/ghost/proxy/start', { method: 'POST' })
      if (response.ok) {
        alert('Ghost_Shell proxy started!')
        checkProxy()
      }
    } catch (error) {
      alert('Failed to start proxy')
    }
  }

  const blockRate = stats?.totalRequests
    ? ((stats.blockedRequests / stats.totalRequests) * 100).toFixed(1)
    : '0'

  const cookieBlockRate = stats?.totalCookies
    ? ((stats.blockedCookies / stats.totalCookies) * 100).toFixed(1)
    : '0'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Ghost className="w-8 h-8 text-purple-400" />
            Proxy Protection
          </h1>
          <p className="text-gray-400 mt-1">Ghost_Shell - Application-layer fingerprint & cookie protection</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${stats?.isConnected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {stats?.isConnected ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
            <span className={stats?.isConnected ? 'text-green-400' : 'text-red-400'}>
              Database {stats?.isConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${proxyRunning ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
            <Ghost className={`w-4 h-4 ${proxyRunning ? 'text-green-400' : 'text-yellow-400'}`} />
            <span className={proxyRunning ? 'text-green-400' : 'text-yellow-400'}>
              Proxy {proxyRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`mb-8 p-6 rounded-xl border ${
        stats?.isConnected && proxyRunning
          ? 'bg-purple-500/10 border-purple-500/30'
          : 'bg-yellow-500/10 border-yellow-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {stats?.isConnected && proxyRunning ? (
              <Shield className="w-8 h-8 text-purple-400" />
            ) : (
              <ShieldOff className="w-8 h-8 text-yellow-400" />
            )}
            <div>
              <h2 className={`text-xl font-semibold ${stats?.isConnected && proxyRunning ? 'text-purple-400' : 'text-yellow-400'}`}>
                {stats?.isConnected && proxyRunning ? 'Proxy Protection Active' : 'Setup Required'}
              </h2>
              <p className="text-gray-400">
                {stats?.isConnected && proxyRunning
                  ? `Blocking ${blockRate}% of requests, ${cookieBlockRate}% of cookies, ${stats.fingerprintRotations} fingerprint rotations`
                  : 'Start the Ghost_Shell proxy to enable application-layer protection'}
              </p>
            </div>
          </div>
          {!proxyRunning && (
            <button
              onClick={startProxy}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Proxy
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-6 h-6 text-blue-400" />
            <span className="text-gray-400">Total Requests</span>
          </div>
          <p className="text-3xl font-bold text-white">{(stats?.totalRequests || 0).toLocaleString()}</p>
          <p className="text-sm text-red-400 mt-1">{stats?.blockedRequests || 0} blocked</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Cookie className="w-6 h-6 text-orange-400" />
            <span className="text-gray-400">Cookies Blocked</span>
          </div>
          <p className="text-3xl font-bold text-orange-400">{(stats?.blockedCookies || 0).toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">{cookieBlockRate}% block rate</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Fingerprint className="w-6 h-6 text-purple-400" />
            <span className="text-gray-400">Fingerprint Rotations</span>
          </div>
          <p className="text-3xl font-bold text-purple-400">{stats?.fingerprintRotations || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Identity changes</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Ban className="w-6 h-6 text-red-400" />
            <span className="text-gray-400">Tracking Domains</span>
          </div>
          <p className="text-3xl font-bold text-red-400">{stats?.blockedDomains || 0}</p>
          <p className="text-sm text-gray-500 mt-1">of {stats?.trackingDomains || 0} discovered</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['overview', 'requests', 'cookies', 'fingerprints', 'domains'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latest Fingerprint */}
          <div className="bg-gray-900 rounded-xl border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-purple-400" />
                Current Fingerprint
              </h2>
            </div>
            <div className="p-4">
              {stats?.latestFingerprint ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">User Agent</p>
                    <p className="text-gray-300 text-sm font-mono bg-gray-800 p-2 rounded overflow-x-auto">
                      {stats.latestFingerprint.user_agent}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Platform</p>
                      <p className="text-gray-300">{stats.latestFingerprint.platform}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Language</p>
                      <p className="text-gray-300">{stats.latestFingerprint.accept_language}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Last Rotation</p>
                    <p className="text-gray-300">{stats.latestFingerprint.timestamp}</p>
                    <p className="text-purple-400 text-sm mt-1">Trigger: {stats.latestFingerprint.rotation_trigger}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No fingerprint data yet. Start the proxy to begin rotating.
                </div>
              )}
            </div>
          </div>

          {/* Top Blocked Domains */}
          <div className="bg-gray-900 rounded-xl border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Cookie className="w-5 h-5 text-orange-400" />
                Top Blocked Cookie Domains
              </h2>
            </div>
            <div className="divide-y divide-gray-800 max-h-80 overflow-auto">
              {stats?.topBlockedDomains.map((item, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <Ban className="w-4 h-4 text-red-400" />
                    <span className="text-white font-mono text-sm">{item.domain}</span>
                  </div>
                  <span className="text-gray-400">{item.count} cookies</span>
                </div>
              ))}
              {(!stats?.topBlockedDomains || stats.topBlockedDomains.length === 0) && (
                <div className="p-8 text-center text-gray-500">
                  No blocked cookies yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Recent Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Method</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Host</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">URL</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {stats?.recentRequests.map((req, i) => (
                  <tr key={i} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      {req.blocked ? (
                        <span className="flex items-center gap-1 text-red-400">
                          <EyeOff className="w-4 h-4" /> Blocked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-400">
                          <Eye className="w-4 h-4" /> Passed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-purple-400 font-mono text-sm">{req.method}</td>
                    <td className="px-4 py-3 text-white font-mono text-sm">{req.host}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm max-w-xs truncate">{req.url}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{req.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!stats?.recentRequests || stats.recentRequests.length === 0) && (
              <div className="p-8 text-center text-gray-500">
                No request data yet.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'cookies' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Cookie Traffic</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search domain..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Domain</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Cookie Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {stats?.recentCookies
                  .filter(c => !searchTerm || c.domain.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((cookie, i) => (
                  <tr key={i} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      {cookie.blocked ? (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">Blocked</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Allowed</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white font-mono text-sm">{cookie.domain}</td>
                    <td className="px-4 py-3 text-orange-400 font-mono text-sm">{cookie.cookie_name}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{cookie.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!stats?.recentCookies || stats.recentCookies.length === 0) && (
              <div className="p-8 text-center text-gray-500">
                No cookie traffic data yet.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'fingerprints' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Fingerprint Rotation History</h2>
          </div>
          <div className="p-4">
            {stats?.latestFingerprint ? (
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-purple-400 font-medium">Current Fingerprint</span>
                    <span className="text-gray-500 text-sm">{stats.latestFingerprint.timestamp}</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-500 text-xs">User Agent:</span>
                      <p className="text-gray-300 text-sm font-mono">{stats.latestFingerprint.user_agent}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-gray-500 text-xs">Platform:</span>
                        <p className="text-gray-300">{stats.latestFingerprint.platform}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Language:</span>
                        <p className="text-gray-300">{stats.latestFingerprint.accept_language}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Trigger:</span>
                        <p className="text-purple-400">{stats.latestFingerprint.rotation_trigger}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-500 text-sm text-center">
                  Total of {stats.fingerprintRotations} fingerprint rotations recorded
                </p>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No fingerprint rotations yet. Start the proxy to begin.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'domains' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Tracking Domains</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Domain</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Hits</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {stats?.topBlockedDomains.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-red-400">
                        <Ban className="w-4 h-4" /> Blocked
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-mono text-sm">{item.domain}</td>
                    <td className="px-4 py-3 text-gray-300">{item.count}</td>
                    <td className="px-4 py-3 text-orange-400">tracker</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!stats?.topBlockedDomains || stats.topBlockedDomains.length === 0) && (
              <div className="p-8 text-center text-gray-500">
                No tracking domains discovered yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      {!stats?.isConnected && (
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-yellow-400 font-medium">Ghost_Shell Setup Required</h3>
              <p className="text-gray-400 text-sm mt-1">
                To enable proxy protection, start Ghost_Shell:
              </p>
              <pre className="mt-2 p-3 bg-gray-900 rounded text-sm text-gray-300 font-mono">
{`# Navigate to Ghost_Shell folder
cd D:\\somacosf\\aegis\\Ghost_Shell

# Activate virtual environment
.venv\\Scripts\\activate.ps1

# Run the launcher (proxy + TUI)
python ghost_shell/launcher.py

# Configure browser proxy: 127.0.0.1:8080`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
