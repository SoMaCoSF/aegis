import { useState, useEffect } from 'react'
import { Cloud, HardDrive, Share2, AppWindow, RefreshCw, AlertTriangle, Plus, ExternalLink } from 'lucide-react'

interface CloudService {
  id: string
  provider: string
  email: string | null
  usedSpace: number // GB
  totalSpace: number // GB
  filesCount: number
  sharedCount: number
  connectedApps: string[]
  lastSynced: string | null
}

const PROVIDER_COLORS: Record<string, string> = {
  google_drive: '#4285f4',
  dropbox: '#0061ff',
  onedrive: '#0078d4',
  icloud: '#999999',
  box: '#0061d5',
}

const PROVIDER_NAMES: Record<string, string> = {
  google_drive: 'Google Drive',
  dropbox: 'Dropbox',
  onedrive: 'OneDrive',
  icloud: 'iCloud',
  box: 'Box',
}

export default function CloudStorage() {
  const [services, setServices] = useState<CloudService[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/cloud/services')
      if (response.ok) {
        setServices(await response.json())
      } else {
        setServices(getMockServices())
      }
    } catch {
      setServices(getMockServices())
    }
    setLoading(false)
  }

  const getMockServices = (): CloudService[] => [
    {
      id: '1',
      provider: 'google_drive',
      email: 'somacosf@gmail.com',
      usedSpace: 8.2,
      totalSpace: 15,
      filesCount: 1247,
      sharedCount: 34,
      connectedApps: ['Claude', 'Notion', 'Zapier', 'IFTTT', 'Google Docs'],
      lastSynced: '2025-12-08T10:30:00Z'
    },
    {
      id: '2',
      provider: 'dropbox',
      email: 'sstave@gmail.com',
      usedSpace: 1.8,
      totalSpace: 2,
      filesCount: 423,
      sharedCount: 12,
      connectedApps: ['Zoom', 'Slack'],
      lastSynced: '2025-12-07T15:00:00Z'
    },
    {
      id: '3',
      provider: 'onedrive',
      email: 'sstave@outlook.com',
      usedSpace: 3.5,
      totalSpace: 5,
      filesCount: 892,
      sharedCount: 8,
      connectedApps: ['Microsoft Office', 'Teams'],
      lastSynced: '2025-12-06T12:00:00Z'
    },
  ]

  const totalUsed = services.reduce((sum, s) => sum + s.usedSpace, 0)
  const totalSpace = services.reduce((sum, s) => sum + s.totalSpace, 0)
  const totalFiles = services.reduce((sum, s) => sum + s.filesCount, 0)
  const totalShared = services.reduce((sum, s) => sum + s.sharedCount, 0)
  const totalApps = services.reduce((sum, s) => sum + s.connectedApps.length, 0)

  const getUsagePercent = (used: number, total: number) => Math.round((used / total) * 100)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Cloud Storage Auditor</h1>
            <p className="text-gray-400 text-sm">Monitor storage usage across cloud services</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadServices}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Cloud className="w-5 h-5 text-blue-400" />
            <span className="text-gray-400 text-sm">Services</span>
          </div>
          <div className="text-2xl font-bold text-white">{services.length}</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <HardDrive className="w-5 h-5 text-purple-400" />
            <span className="text-gray-400 text-sm">Total Used</span>
          </div>
          <div className="text-2xl font-bold text-white">{totalUsed.toFixed(1)} GB</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <HardDrive className="w-5 h-5 text-green-400" />
            <span className="text-gray-400 text-sm">Total Space</span>
          </div>
          <div className="text-2xl font-bold text-white">{totalSpace} GB</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Share2 className="w-5 h-5 text-amber-400" />
            <span className="text-gray-400 text-sm">Shared Files</span>
          </div>
          <div className="text-2xl font-bold text-white">{totalShared}</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <AppWindow className="w-5 h-5 text-pink-400" />
            <span className="text-gray-400 text-sm">Connected Apps</span>
          </div>
          <div className="text-2xl font-bold text-white">{totalApps}</div>
        </div>
      </div>

      {/* Shared Files Alert */}
      {totalShared > 20 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <h3 className="text-amber-400 font-medium">Shared Files Review</h3>
            <p className="text-gray-400 text-sm mt-1">
              You have {totalShared} shared files across your cloud services. Consider reviewing sharing permissions
              to ensure sensitive files aren't accidentally exposed.
            </p>
          </div>
        </div>
      )}

      {/* Service Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {services.map(service => {
          const usagePercent = getUsagePercent(service.usedSpace, service.totalSpace)
          const isNearFull = usagePercent > 80

          return (
            <div key={service.id} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: PROVIDER_COLORS[service.provider] || '#666' }}
                  >
                    <Cloud className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {PROVIDER_NAMES[service.provider] || service.provider}
                    </h3>
                    {service.email && (
                      <p className="text-gray-400 text-sm">{service.email}</p>
                    )}
                  </div>
                </div>
                <a
                  href={`https://${service.provider.replace('_', '.')}.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>

              {/* Storage Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Storage Used</span>
                  <span className={isNearFull ? 'text-amber-400' : 'text-gray-400'}>
                    {service.usedSpace.toFixed(1)} / {service.totalSpace} GB ({usagePercent}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isNearFull ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="text-gray-500 text-xs mb-1">Files</div>
                  <div className="text-white font-medium">{service.filesCount.toLocaleString()}</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="text-gray-500 text-xs mb-1">Shared</div>
                  <div className="text-white font-medium flex items-center gap-2">
                    {service.sharedCount}
                    {service.sharedCount > 10 && (
                      <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">Review</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Connected Apps */}
              {service.connectedApps.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs mb-2">Connected Apps ({service.connectedApps.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {service.connectedApps.map((app, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs"
                      >
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Synced */}
              <div className="mt-4 pt-4 border-t border-gray-700 text-sm text-gray-500">
                Last synced: {service.lastSynced
                  ? new Date(service.lastSynced).toLocaleString()
                  : 'Never'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Service */}
      <div className="bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center">
        <Cloud className="w-12 h-12 text-gray-600 mb-4" />
        <h3 className="text-gray-400 font-medium mb-2">Connect More Services</h3>
        <p className="text-gray-500 text-sm text-center mb-4 max-w-md">
          Add Google Drive, Dropbox, OneDrive, or other cloud storage services to monitor all your files in one place.
        </p>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          Add Cloud Service
        </button>
      </div>
    </div>
  )
}
