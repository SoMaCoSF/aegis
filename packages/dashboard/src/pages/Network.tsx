import { useEffect, useState } from 'react'
import {
  Network,
  Shield,
  ShieldOff,
  Globe,
  Server,
  AlertTriangle,
  CheckCircle,
  Ban,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react'

interface ASNEntry {
  asn: string
  orgName: string
  prefixCount: number
  blocked: boolean
  category: string
}

interface FirewallRule {
  prefix: string
  asn: string
  reason: string
  active: boolean
  addedAt: string
}

interface NetworkStats {
  totalASNs: number
  blockedASNs: number
  totalPrefixes: number
  blockedPrefixes: number
  recentBlocks: FirewallRule[]
  topASNs: ASNEntry[]
  connectionStatus: 'protected' | 'partial' | 'unprotected'
}

export default function NetworkPage() {
  const [stats, setStats] = useState<NetworkStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [dmbtConnected, setDmbtConnected] = useState(false)
  const [ghostConnected, setGhostConnected] = useState(false)

  useEffect(() => {
    // Check DMBT and Ghost_Shell connections
    checkConnections()
    fetchNetworkStats()
  }, [])

  const checkConnections = async () => {
    // Check DMBT agent
    try {
      const dmbtRes = await fetch('http://localhost:8888/health')
      setDmbtConnected(dmbtRes.ok)
    } catch {
      setDmbtConnected(false)
    }

    // Check Ghost_Shell proxy
    try {
      const ghostRes = await fetch('http://localhost:8080/health')
      setGhostConnected(ghostRes.ok)
    } catch {
      setGhostConnected(false)
    }
  }

  const fetchNetworkStats = async () => {
    try {
      const response = await fetch('/api/network/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        throw new Error('API not available')
      }
    } catch {
      // Mock data
      setStats({
        totalASNs: 156,
        blockedASNs: 23,
        totalPrefixes: 4521,
        blockedPrefixes: 892,
        connectionStatus: 'partial',
        topASNs: [
          { asn: 'AS32934', orgName: 'Meta Platforms', prefixCount: 245, blocked: true, category: 'Social/Tracking' },
          { asn: 'AS15169', orgName: 'Google LLC', prefixCount: 512, blocked: false, category: 'Mixed Services' },
          { asn: 'AS16509', orgName: 'Amazon.com', prefixCount: 389, blocked: false, category: 'Cloud/CDN' },
          { asn: 'AS13335', orgName: 'Cloudflare', prefixCount: 156, blocked: false, category: 'CDN' },
          { asn: 'AS54113', orgName: 'Fastly', prefixCount: 89, blocked: false, category: 'CDN' },
          { asn: 'AS14618', orgName: 'Amazon Data', prefixCount: 234, blocked: false, category: 'Cloud' },
          { asn: 'AS8075', orgName: 'Microsoft', prefixCount: 456, blocked: false, category: 'Mixed Services' },
          { asn: 'AS36351', orgName: 'SoftLayer (IBM)', prefixCount: 178, blocked: false, category: 'Cloud' },
        ],
        recentBlocks: [
          { prefix: '157.240.0.0/16', asn: 'AS32934', reason: 'Meta tracking infrastructure', active: true, addedAt: '2024-01-14' },
          { prefix: '31.13.24.0/21', asn: 'AS32934', reason: 'Facebook CDN', active: true, addedAt: '2024-01-14' },
          { prefix: '179.60.192.0/22', asn: 'AS32934', reason: 'Instagram servers', active: true, addedAt: '2024-01-13' },
          { prefix: '66.220.144.0/20', asn: 'AS32934', reason: 'WhatsApp infrastructure', active: false, addedAt: '2024-01-12' },
        ],
      })
    }
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'protected': return 'text-green-400'
      case 'partial': return 'text-yellow-400'
      case 'unprotected': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'protected': return <Shield className="w-8 h-8 text-green-400" />
      case 'partial': return <Shield className="w-8 h-8 text-yellow-400" />
      case 'unprotected': return <ShieldOff className="w-8 h-8 text-red-400" />
      default: return <Shield className="w-8 h-8 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-aegis-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Network Protection</h1>
          <p className="text-gray-400 mt-1">DMBT + Ghost_Shell integration for infrastructure-level blocking</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${dmbtConnected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {dmbtConnected ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
            <span className={dmbtConnected ? 'text-green-400' : 'text-red-400'}>DMBT</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${ghostConnected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {ghostConnected ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
            <span className={ghostConnected ? 'text-green-400' : 'text-red-400'}>Ghost_Shell</span>
          </div>
        </div>
      </div>

      {/* Protection Status Banner */}
      <div className={`mb-8 p-6 rounded-xl border ${
        stats.connectionStatus === 'protected'
          ? 'bg-green-500/10 border-green-500/30'
          : stats.connectionStatus === 'partial'
          ? 'bg-yellow-500/10 border-yellow-500/30'
          : 'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex items-center gap-4">
          {getStatusIcon(stats.connectionStatus)}
          <div>
            <h2 className={`text-xl font-semibold ${getStatusColor(stats.connectionStatus)}`}>
              {stats.connectionStatus === 'protected' && 'Fully Protected'}
              {stats.connectionStatus === 'partial' && 'Partial Protection'}
              {stats.connectionStatus === 'unprotected' && 'Not Protected'}
            </h2>
            <p className="text-gray-400">
              {stats.connectionStatus === 'protected' && 'All tracking infrastructure blocked at network and application layers'}
              {stats.connectionStatus === 'partial' && 'Some protection active - enable both DMBT and Ghost_Shell for full coverage'}
              {stats.connectionStatus === 'unprotected' && 'No active protection - start DMBT agent and Ghost_Shell proxy'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-6 h-6 text-gray-400" />
            <span className="text-gray-400">ASNs Discovered</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalASNs}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Ban className="w-6 h-6 text-red-400" />
            <span className="text-gray-400">ASNs Blocked</span>
          </div>
          <p className="text-3xl font-bold text-red-400">{stats.blockedASNs}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Server className="w-6 h-6 text-gray-400" />
            <span className="text-gray-400">IP Prefixes</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalPrefixes.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-6 h-6 text-aegis-400" />
            <span className="text-gray-400">Active Rules</span>
          </div>
          <p className="text-3xl font-bold text-aegis-400">{stats.blockedPrefixes}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top ASNs */}
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Discovered Organizations
            </h2>
          </div>
          <div className="divide-y divide-gray-800">
            {stats.topASNs.map(asn => (
              <div key={asn.asn} className="p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  {asn.blocked ? (
                    <Ban className="w-5 h-5 text-red-400" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-gray-600" />
                  )}
                  <div>
                    <p className="text-white font-medium">{asn.orgName}</p>
                    <p className="text-gray-500 text-sm">{asn.asn} • {asn.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-300">{asn.prefixCount} prefixes</p>
                  <button
                    className={`text-sm mt-1 ${
                      asn.blocked
                        ? 'text-green-400 hover:text-green-300'
                        : 'text-red-400 hover:text-red-300'
                    }`}
                  >
                    {asn.blocked ? 'Unblock' : 'Block All'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Firewall Rules */}
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Recent Firewall Rules
            </h2>
          </div>
          <div className="divide-y divide-gray-800">
            {stats.recentBlocks.map((rule, i) => (
              <div key={i} className="p-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-aegis-400 font-mono text-sm">{rule.prefix}</code>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    rule.active
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {rule.active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{rule.reason}</p>
                <p className="text-gray-600 text-xs mt-1">{rule.asn} • Added {rule.addedAt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="mt-8 bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Defense Architecture</h2>
        <pre className="text-xs text-gray-400 font-mono overflow-x-auto">
{`
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              YOUR MACHINE                                        │
│                                                                                 │
│  ┌─────────────┐    ┌──────────────────────────────────────────────────────┐   │
│  │   Browser   │───▶│  Ghost_Shell Proxy (localhost:8080)                  │   │
│  │             │    │  • Fingerprint rotation (User-Agent, headers)        │   │
│  │  Chrome     │    │  • Cookie interception & blocking                    │   │
│  │  Firefox    │    │  • Tracker pattern matching                          │   │
│  │  Edge       │    │  • Request logging & telemetry                       │   │
│  └─────────────┘    └────────────────────────┬─────────────────────────────┘   │
│                                              │                                   │
│                                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                    DMBT (Network Layer)                                   │   │
│  │  • ASN/Prefix blocking via Windows Firewall                              │   │
│  │  • Blocks: ${stats.blockedPrefixes} prefixes from ${stats.blockedASNs} organizations                             │
│  │  • Team Cymru + RIPEstat intelligence                                    │   │
│  └────────────────────────┬─────────────────────────────────────────────────┘   │
│                           │                                                      │
│                           ▼                                                      │
│                    ┌─────────────┐                                               │
│                    │  Internet   │  ← Tracking infrastructure blocked           │
│                    └─────────────┘                                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
`}
        </pre>
      </div>

      {/* Setup Instructions */}
      {(!dmbtConnected || !ghostConnected) && (
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-yellow-400 font-medium">Setup Required</h3>
              <p className="text-gray-400 text-sm mt-1">
                To enable full network protection, start the following services:
              </p>
              <pre className="mt-2 p-3 bg-gray-900 rounded text-sm text-gray-300 font-mono">
{`# Start DMBT Agent (requires elevation)
cd D:\\somacosf\\outputs\\dmbt
python -m agent.dmbt_agent

# Start Ghost_Shell Proxy
cd D:\\somacosf\\outputs\\ghost_shell
python -m proxy.main`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
