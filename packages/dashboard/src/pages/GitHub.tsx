import { useEffect, useState } from 'react'
import { Github, Key, Webhook, AlertTriangle, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react'

interface GitHubIntegration {
  id: string
  type: string
  name: string
  slug?: string
  permissions?: string
  url?: string
  createdAt: string
  lastUsed?: string
  suspicious: boolean
  suspiciousReasons?: string
}

export default function GitHub() {
  const [integrations, setIntegrations] = useState<GitHubIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)

  const fetchIntegrations = () => {
    fetch('/api/github/integrations')
      .then(r => r.json())
      .then(data => {
        setIntegrations(data)
        setLoading(false)
      })
      .catch(() => {
        setIntegrations([
          { id: '1', type: 'oauth_app', name: 'Vercel', slug: 'vercel', createdAt: '2023-06-15', lastUsed: '2024-01-14', suspicious: false },
          { id: '2', type: 'oauth_app', name: 'Railway', slug: 'railway', createdAt: '2023-08-20', lastUsed: '2024-01-10', suspicious: false },
          { id: '3', type: 'oauth_app', name: 'Netlify', slug: 'netlify', createdAt: '2022-03-10', lastUsed: '2023-06-01', suspicious: true, suspiciousReasons: 'Not used in over 6 months' },
          { id: '4', type: 'ssh_key', name: 'OMEN-01 WSL', createdAt: '2024-01-01', lastUsed: '2024-01-14', suspicious: false },
          { id: '5', type: 'ssh_key', name: 'Old Laptop', createdAt: '2022-01-15', lastUsed: '2022-12-01', suspicious: true, suspiciousReasons: 'Key older than 1 year, not used recently' },
          { id: '6', type: 'ssh_key', name: 'MacBook Pro', createdAt: '2023-09-01', lastUsed: '2024-01-12', suspicious: false },
        ])
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const handleScan = async () => {
    setScanning(true)
    try {
      await fetch('/api/github/scan', { method: 'POST' })
      await fetchIntegrations()
    } catch (e) {
      console.error('Scan failed:', e)
    }
    setScanning(false)
  }

  const oauthApps = integrations.filter(i => i.type === 'oauth_app')
  const sshKeys = integrations.filter(i => i.type === 'ssh_key')
  const suspiciousCount = integrations.filter(i => i.suspicious).length

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'oauth_app': return <Github className="w-5 h-5" />
      case 'ssh_key': return <Key className="w-5 h-5" />
      case 'webhook': return <Webhook className="w-5 h-5" />
      default: return <Github className="w-5 h-5" />
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">GitHub Security</h1>
          <p className="text-gray-400 mt-1">Audit your GitHub integrations and access</p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 bg-aegis-600 hover:bg-aegis-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning...' : 'Scan Now'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Github className="w-6 h-6 text-gray-400" />
            <span className="text-gray-400">OAuth Apps</span>
          </div>
          <p className="text-3xl font-bold text-white">{oauthApps.length}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Key className="w-6 h-6 text-gray-400" />
            <span className="text-gray-400">SSH Keys</span>
          </div>
          <p className="text-3xl font-bold text-white">{sshKeys.length}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <span className="text-gray-400">Verified</span>
          </div>
          <p className="text-3xl font-bold text-green-400">{integrations.length - suspiciousCount}</p>
        </div>
        <div className={`rounded-xl p-6 border ${suspiciousCount > 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-gray-900 border-gray-800'}`}>
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className={`w-6 h-6 ${suspiciousCount > 0 ? 'text-yellow-400' : 'text-gray-400'}`} />
            <span className={suspiciousCount > 0 ? 'text-yellow-400' : 'text-gray-400'}>Suspicious</span>
          </div>
          <p className={`text-3xl font-bold ${suspiciousCount > 0 ? 'text-yellow-400' : 'text-white'}`}>{suspiciousCount}</p>
        </div>
      </div>

      {/* OAuth Apps */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Github className="w-5 h-5" />
          OAuth Applications
        </h2>
        <div className="space-y-3">
          {oauthApps.map(app => (
            <div
              key={app.id}
              className={`bg-gray-900 rounded-xl p-4 border ${app.suspicious ? 'border-yellow-500/50' : 'border-gray-800'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${app.suspicious ? 'bg-yellow-500/20' : 'bg-gray-800'}`}>
                    {getTypeIcon(app.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{app.name}</h3>
                    <p className="text-gray-500 text-sm">
                      Added {new Date(app.createdAt).toLocaleDateString()}
                      {app.lastUsed && ` • Last used ${new Date(app.lastUsed).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {app.suspicious && (
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{app.suspiciousReasons}</span>
                    </div>
                  )}
                  <a
                    href="https://github.com/settings/applications"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-aegis-400 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SSH Keys */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Key className="w-5 h-5" />
          SSH Keys
        </h2>
        <div className="space-y-3">
          {sshKeys.map(key => (
            <div
              key={key.id}
              className={`bg-gray-900 rounded-xl p-4 border ${key.suspicious ? 'border-yellow-500/50' : 'border-gray-800'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${key.suspicious ? 'bg-yellow-500/20' : 'bg-gray-800'}`}>
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{key.name}</h3>
                    <p className="text-gray-500 text-sm">
                      Added {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsed && ` • Last used ${new Date(key.lastUsed).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {key.suspicious && (
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{key.suspiciousReasons}</span>
                    </div>
                  )}
                  <a
                    href="https://github.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-aegis-400 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
