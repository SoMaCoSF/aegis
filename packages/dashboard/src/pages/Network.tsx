// ==============================================================================
// file_id: SOM-SCR-0030-v1.0.0
// name: Network.tsx
// description: DMBT Network Protection Dashboard with live stats
// project_id: AEGIS
// category: component
// tags: [dashboard, network, dmbt, asn, firewall]
// created: 2025-12-08
// modified: 2025-12-08
// version: 1.0.0
// ==============================================================================

import { useEffect, useState, useCallback } from 'react'
import {
  Shield,
  ShieldOff,
  Globe,
  Server,
  AlertTriangle,
  CheckCircle,
  Ban,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Play,
  Search,
  ExternalLink
} from 'lucide-react'

interface IPMapping {
  domain: string
  ip: string
  ip_version: number
  asn: string
  asn_name: string
  source: string
  seen_at: string
}

interface TopASN {
  asn: string
  org_name: string
  ip_count: number
  prefix_count: number
  blocked: boolean
}

interface BlocklistEntry {
  prefix: string
  asn: string
  reason: string
  added_at: string
}

interface DMBTStats {
  totalDomains: number
  totalIPs: number
  totalASNs: number
  totalPrefixes: number
  blockedPrefixes: number
  recentIPMappings: IPMapping[]
  topASNs: TopASN[]
  recentBlocks: BlocklistEntry[]
  isConnected: boolean
  dbPath: string
}

export default function NetworkPage() {
  const [stats, setStats] = useState<DMBTStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dmbtAgentRunning, setDmbtAgentRunning] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'ips' | 'asns' | 'blocklist'>('overview')

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/dmbt/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch DMBT stats:', error)
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  const checkAgent = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8088/health', {
        signal: AbortSignal.timeout(1000)
      })
      setDmbtAgentRunning(response.ok)
    } catch {
      setDmbtAgentRunning(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    checkAgent()
    const interval = setInterval(() => {
      fetchStats()
      checkAgent()
    }, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [fetchStats, checkAgent])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchStats()
    checkAgent()
  }

  const startCollector = async () => {
    try {
      const response = await fetch('/api/dmbt/collector/start', { method: 'POST' })
      if (response.ok) {
        alert('DMBT Collector started!')
      }
    } catch (error) {
      alert('Failed to start collector')
    }
  }

  const filteredIPs = stats?.recentIPMappings.filter(ip =>
    ip.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ip.ip.includes(searchTerm) ||
    ip.asn_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

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
          <h1 className="text-3xl font-bold text-white">Network Protection</h1>
          <p className="text-gray-400 mt-1">DMBT - Delete Me | Block Them - Infrastructure-level blocking</p>
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
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${dmbtAgentRunning ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
            {dmbtAgentRunning ? <Activity className="w-4 h-4 text-green-400" /> : <Activity className="w-4 h-4 text-yellow-400" />}
            <span className={dmbtAgentRunning ? 'text-green-400' : 'text-yellow-400'}>
              Agent {dmbtAgentRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`mb-8 p-6 rounded-xl border ${
        stats?.isConnected
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {stats?.isConnected ? (
              <Shield className="w-8 h-8 text-green-400" />
            ) : (
              <ShieldOff className="w-8 h-8 text-red-400" />
            )}
            <div>
              <h2 className={`text-xl font-semibold ${stats?.isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {stats?.isConnected ? 'Network Intelligence Active' : 'DMBT Not Connected'}
              </h2>
              <p className="text-gray-400">
                {stats?.isConnected
                  ? `Tracking ${stats.totalASNs} ASNs across ${stats.totalPrefixes.toLocaleString()} prefixes`
                  : 'DMBT database not found. Run the collector to start gathering network intelligence.'}
              </p>
            </div>
          </div>
          {!dmbtAgentRunning && (
            <button
              onClick={startCollector}
              className="flex items-center gap-2 px-4 py-2 bg-aegis-600 hover:bg-aegis-500 text-white rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Collector
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-6 h-6 text-blue-400" />
            <span className="text-gray-400">Domains</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.totalDomains || 0}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Server className="w-6 h-6 text-purple-400" />
            <span className="text-gray-400">IPs Resolved</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.totalIPs || 0}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            <span className="text-gray-400">ASNs</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.totalASNs || 0}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Server className="w-6 h-6 text-gray-400" />
            <span className="text-gray-400">Prefixes</span>
          </div>
          <p className="text-3xl font-bold text-white">{(stats?.totalPrefixes || 0).toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Ban className="w-6 h-6 text-red-400" />
            <span className="text-gray-400">Blocked</span>
          </div>
          <p className="text-3xl font-bold text-red-400">{stats?.blockedPrefixes || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['overview', 'ips', 'asns', 'blocklist'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab
                ? 'bg-aegis-600 text-white'
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
          {/* Top ASNs */}
          <div className="bg-gray-900 rounded-xl border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Top Organizations by IP Count
              </h2>
            </div>
            <div className="divide-y divide-gray-800 max-h-96 overflow-auto">
              {stats?.topASNs.map(asn => (
                <div key={asn.asn} className="p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {asn.blocked ? (
                      <Ban className="w-5 h-5 text-red-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-gray-600" />
                    )}
                    <div>
                      <p className="text-white font-medium">{asn.org_name || 'Unknown'}</p>
                      <p className="text-gray-500 text-sm">{asn.asn}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-300">{asn.ip_count} IPs</p>
                    <p className="text-gray-500 text-sm">{asn.prefix_count} prefixes</p>
                  </div>
                </div>
              ))}
              {(!stats?.topASNs || stats.topASNs.length === 0) && (
                <div className="p-8 text-center text-gray-500">
                  No ASN data yet. Run the collector to discover network infrastructure.
                </div>
              )}
            </div>
          </div>

          {/* Recent Blocks */}
          <div className="bg-gray-900 rounded-xl border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Blocklist Entries
              </h2>
            </div>
            <div className="divide-y divide-gray-800 max-h-96 overflow-auto">
              {stats?.recentBlocks.map((block, i) => (
                <div key={i} className="p-4 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-aegis-400 font-mono text-sm">{block.prefix}</code>
                    <span className="text-gray-500 text-xs">{block.asn}</span>
                  </div>
                  <p className="text-gray-400 text-sm">{block.reason}</p>
                  <p className="text-gray-600 text-xs mt-1">Added {block.added_at}</p>
                </div>
              ))}
              {(!stats?.recentBlocks || stats.recentBlocks.length === 0) && (
                <div className="p-8 text-center text-gray-500">
                  No blocked prefixes yet. Add entries via the DMBT TUI or CLI.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ips' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">IP Mappings</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search domain, IP, or ASN..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-aegis-500"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Domain</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">IP</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">ASN</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Organization</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredIPs.map((ip, i) => (
                  <tr key={i} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-white font-mono text-sm">{ip.domain}</td>
                    <td className="px-4 py-3 text-gray-300 font-mono text-sm">
                      {ip.ip}
                      <span className="ml-2 text-xs text-gray-500">IPv{ip.ip_version}</span>
                    </td>
                    <td className="px-4 py-3 text-aegis-400 font-mono text-sm">{ip.asn}</td>
                    <td className="px-4 py-3 text-gray-300 text-sm">{ip.asn_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{ip.seen_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredIPs.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                {searchTerm ? 'No matching IP mappings found.' : 'No IP mappings yet.'}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'asns' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Discovered ASNs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">ASN</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Organization</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">IPs</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Prefixes</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {stats?.topASNs.map(asn => (
                  <tr key={asn.asn} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      {asn.blocked ? (
                        <span className="flex items-center gap-1 text-red-400">
                          <Ban className="w-4 h-4" /> Blocked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-500">
                          <CheckCircle className="w-4 h-4" /> Allowed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-aegis-400 font-mono">{asn.asn}</td>
                    <td className="px-4 py-3 text-white">{asn.org_name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-gray-300">{asn.ip_count}</td>
                    <td className="px-4 py-3 text-gray-300">{asn.prefix_count}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://bgp.he.net/${asn.asn}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-aegis-400 hover:text-aegis-300"
                      >
                        <ExternalLink className="w-4 h-4" />
                        BGP Info
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'blocklist' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Blocklist</h2>
            <span className="text-gray-400 text-sm">{stats?.blockedPrefixes || 0} entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Prefix</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">ASN</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Reason</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {stats?.recentBlocks.map((block, i) => (
                  <tr key={i} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-red-400 font-mono">{block.prefix}</td>
                    <td className="px-4 py-3 text-aegis-400 font-mono">{block.asn}</td>
                    <td className="px-4 py-3 text-gray-300">{block.reason}</td>
                    <td className="px-4 py-3 text-gray-500">{block.added_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!stats?.recentBlocks || stats.recentBlocks.length === 0) && (
              <div className="p-8 text-center text-gray-500">
                No blocked prefixes. Use the DMBT CLI to add blocks.
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
              <h3 className="text-yellow-400 font-medium">DMBT Setup Required</h3>
              <p className="text-gray-400 text-sm mt-1">
                To enable network protection, run the DMBT collector:
              </p>
              <pre className="mt-2 p-3 bg-gray-900 rounded text-sm text-gray-300 font-mono">
{`# Navigate to DMBT folder
cd D:\\somacosf\\aegis\\DMBT

# Activate virtual environment
.venv\\Scripts\\activate.ps1

# Run collector
python collector\\collector.py`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
