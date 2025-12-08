import { useEffect, useState } from 'react'
import { Shield, AlertTriangle, CheckCircle, Clock, ExternalLink, Search } from 'lucide-react'

interface PrivacyExposure {
  id: string
  brokerName: string
  brokerUrl: string
  dataFound: string
  removalStatus: string
  removalDate?: string
  source: string
}

export default function Privacy() {
  const [exposures, setExposures] = useState<PrivacyExposure[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/privacy/exposures')
      .then(r => r.json())
      .then(data => {
        setExposures(data)
        setLoading(false)
      })
      .catch(() => {
        setExposures([
          { id: '1', brokerName: 'Spokeo', brokerUrl: 'https://spokeo.com', dataFound: 'Name, Address, Phone', removalStatus: 'pending', source: 'pentester.com' },
          { id: '2', brokerName: 'BeenVerified', brokerUrl: 'https://beenverified.com', dataFound: 'Name, Email, Address', removalStatus: 'requested', source: 'manual' },
          { id: '3', brokerName: 'WhitePages', brokerUrl: 'https://whitepages.com', dataFound: 'Name, Phone', removalStatus: 'removed', removalDate: '2024-01-10', source: 'pentester.com' },
          { id: '4', brokerName: 'Intelius', brokerUrl: 'https://intelius.com', dataFound: 'Name, Address, Relatives', removalStatus: 'pending', source: 'manual' },
          { id: '5', brokerName: 'TruePeopleSearch', brokerUrl: 'https://truepeoplesearch.com', dataFound: 'Name, Address, Phone, Email', removalStatus: 'removed', removalDate: '2024-01-05', source: 'pentester.com' },
        ])
        setLoading(false)
      })
  }, [])

  const pendingCount = exposures.filter(e => e.removalStatus === 'pending').length
  const requestedCount = exposures.filter(e => e.removalStatus === 'requested').length
  const removedCount = exposures.filter(e => e.removalStatus === 'removed').length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm">
            <AlertTriangle className="w-3 h-3" />
            Pending
          </span>
        )
      case 'requested':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
            <Clock className="w-3 h-3" />
            Requested
          </span>
        )
      case 'removed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">
            <CheckCircle className="w-3 h-3" />
            Removed
          </span>
        )
      default:
        return null
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
          <h1 className="text-3xl font-bold text-white">Privacy Manager</h1>
          <p className="text-gray-400 mt-1">Track and remove your data from data brokers</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-aegis-600 hover:bg-aegis-700 text-white rounded-lg transition-colors">
          <Search className="w-5 h-5" />
          Scan for Exposures
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-gray-400" />
            <span className="text-gray-400">Total Found</span>
          </div>
          <p className="text-3xl font-bold text-white">{exposures.length}</p>
        </div>
        <div className={`rounded-xl p-6 border ${pendingCount > 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-gray-900 border-gray-800'}`}>
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className={`w-6 h-6 ${pendingCount > 0 ? 'text-yellow-400' : 'text-gray-400'}`} />
            <span className={pendingCount > 0 ? 'text-yellow-400' : 'text-gray-400'}>Pending</span>
          </div>
          <p className={`text-3xl font-bold ${pendingCount > 0 ? 'text-yellow-400' : 'text-white'}`}>{pendingCount}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-blue-400" />
            <span className="text-gray-400">In Progress</span>
          </div>
          <p className="text-3xl font-bold text-blue-400">{requestedCount}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <span className="text-gray-400">Removed</span>
          </div>
          <p className="text-3xl font-bold text-green-400">{removedCount}</p>
        </div>
      </div>

      {/* Exposures List */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Data Broker</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Data Found</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Status</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Source</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {exposures.map(exposure => (
              <tr key={exposure.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-white font-medium">{exposure.brokerName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-300">{exposure.dataFound}</span>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(exposure.removalStatus)}
                  {exposure.removalDate && (
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(exposure.removalDate).toLocaleDateString()}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-400 text-sm">{exposure.source}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {exposure.removalStatus === 'pending' && (
                      <button className="px-3 py-1 bg-aegis-600 hover:bg-aegis-700 text-white text-sm rounded transition-colors">
                        Request Removal
                      </button>
                    )}
                    <a
                      href={exposure.brokerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-aegis-400 transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-gray-900 border border-gray-800 rounded-lg">
        <h3 className="text-white font-medium mb-2">How it works</h3>
        <p className="text-gray-400 text-sm">
          AEGIS scans data broker websites to find your personal information. When exposures are found,
          you can request removal directly through the broker's opt-out process. We track the status
          and notify you when removal is confirmed.
        </p>
      </div>
    </div>
  )
}
