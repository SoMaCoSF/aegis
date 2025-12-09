import { useState, useEffect } from 'react'
import { Search, Upload, CheckCircle, XCircle, Globe, User, Calendar, Filter, Download, RefreshCw } from 'lucide-react'

interface DiscoveredAccount {
  id: string
  domain: string
  url: string
  title: string | null
  visitCount: number
  lastVisit: string
  category: string
  isAccount: boolean
  imported: boolean
}

interface DiscoveryStats {
  total: number
  accounts: number
  imported: number
  categories: Record<string, number>
}

export default function Discovery() {
  const [accounts, setAccounts] = useState<DiscoveredAccount[]>([])
  const [stats, setStats] = useState<DiscoveryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'accounts' | 'unimported'>('accounts')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [importing, setImporting] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadDiscoveredAccounts()
  }, [])

  const loadDiscoveredAccounts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/discovery/accounts')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts)
        setStats(data.stats)
      } else {
        // Load mock data
        loadMockData()
      }
    } catch {
      loadMockData()
    }
    setLoading(false)
  }

  const loadMockData = () => {
    const mockAccounts: DiscoveredAccount[] = [
      { id: '1', domain: 'github.com', url: 'https://github.com', title: 'GitHub', visitCount: 55, lastVisit: '2025-12-08', category: 'Development', isAccount: true, imported: true },
      { id: '2', domain: 'claude.ai', url: 'https://claude.ai', title: 'Claude', visitCount: 31, lastVisit: '2025-12-08', category: 'AI/ML', isAccount: true, imported: false },
      { id: '3', domain: 'x.com', url: 'https://x.com', title: 'X (Twitter)', visitCount: 68, lastVisit: '2025-12-08', category: 'Social', isAccount: true, imported: false },
      { id: '4', domain: 'accounts.google.com', url: 'https://accounts.google.com', title: 'Google Account', visitCount: 155, lastVisit: '2025-12-08', category: 'Productivity', isAccount: true, imported: true },
      { id: '5', domain: 'mail.proton.me', url: 'https://mail.proton.me', title: 'ProtonMail', visitCount: 132, lastVisit: '2025-12-08', category: 'Email', isAccount: true, imported: true },
      { id: '6', domain: 'app.alpaca.markets', url: 'https://app.alpaca.markets', title: 'Alpaca Trading', visitCount: 12, lastVisit: '2025-12-07', category: 'Finance', isAccount: true, imported: false },
      { id: '7', domain: 'drive.google.com', url: 'https://drive.google.com', title: 'Google Drive', visitCount: 21, lastVisit: '2025-12-08', category: 'Cloud Storage', isAccount: true, imported: false },
      { id: '8', domain: 'old.reddit.com', url: 'https://old.reddit.com', title: 'Reddit', visitCount: 258, lastVisit: '2025-12-08', category: 'Social', isAccount: true, imported: false },
      { id: '9', domain: 'youtube.com', url: 'https://youtube.com', title: 'YouTube', visitCount: 613, lastVisit: '2025-12-08', category: 'Entertainment', isAccount: true, imported: false },
      { id: '10', domain: 'vercel.com', url: 'https://vercel.com', title: 'Vercel', visitCount: 8, lastVisit: '2025-12-07', category: 'Development', isAccount: true, imported: false },
      { id: '11', domain: 'spotify.com', url: 'https://spotify.com', title: 'Spotify', visitCount: 4, lastVisit: '2025-12-06', category: 'Entertainment', isAccount: true, imported: false },
      { id: '12', domain: 'instagram.com', url: 'https://instagram.com', title: 'Instagram', visitCount: 15, lastVisit: '2025-12-07', category: 'Social', isAccount: true, imported: false },
    ]

    const categories: Record<string, number> = {}
    mockAccounts.forEach(a => {
      categories[a.category] = (categories[a.category] || 0) + 1
    })

    setAccounts(mockAccounts)
    setStats({
      total: mockAccounts.length,
      accounts: mockAccounts.filter(a => a.isAccount).length,
      imported: mockAccounts.filter(a => a.imported).length,
      categories
    })
  }

  const importAccount = async (account: DiscoveredAccount) => {
    setImporting(prev => new Set(prev).add(account.id))
    try {
      const response = await fetch('/api/discovery/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: account.id })
      })
      if (response.ok) {
        setAccounts(prev => prev.map(a =>
          a.id === account.id ? { ...a, imported: true } : a
        ))
        if (stats) {
          setStats({ ...stats, imported: stats.imported + 1 })
        }
      }
    } catch (err) {
      // Mock success for demo
      setAccounts(prev => prev.map(a =>
        a.id === account.id ? { ...a, imported: true } : a
      ))
      if (stats) {
        setStats({ ...stats, imported: stats.imported + 1 })
      }
    }
    setImporting(prev => {
      const next = new Set(prev)
      next.delete(account.id)
      return next
    })
  }

  const importAll = async () => {
    const unimported = filteredAccounts.filter(a => !a.imported)
    for (const account of unimported) {
      await importAccount(account)
    }
  }

  const filteredAccounts = accounts
    .filter(a => {
      if (filter === 'accounts' && !a.isAccount) return false
      if (filter === 'unimported' && a.imported) return false
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false
      if (searchQuery && !a.domain.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
    .sort((a, b) => b.visitCount - a.visitCount)

  const categories = stats ? Object.keys(stats.categories) : []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Account Discovery</h1>
            <p className="text-gray-400 text-sm">Discover accounts from your browsing history</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.json'
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) {
                  // Handle file upload
                  console.log('Upload:', file.name)
                }
              }
              input.click()
            }}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import History
          </button>
          <button
            onClick={loadDiscoveredAccounts}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <span className="text-gray-400 text-sm">Total Discovered</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400 text-sm">Account Sites</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.accounts}</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-gray-400 text-sm">Imported</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.imported}</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-5 h-5 text-amber-400" />
              <span className="text-gray-400 text-sm">Pending</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.accounts - stats.imported}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search domains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'accounts', 'unimported'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === f
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? 'All' : f === 'accounts' ? 'Accounts' : 'Not Imported'}
            </button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {filteredAccounts.filter(a => !a.imported).length > 0 && (
          <button
            onClick={importAll}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Import All ({filteredAccounts.filter(a => !a.imported).length})
          </button>
        )}
      </div>

      {/* Accounts List */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left p-4 text-gray-400 font-medium">Domain</th>
              <th className="text-left p-4 text-gray-400 font-medium">Category</th>
              <th className="text-center p-4 text-gray-400 font-medium">Visits</th>
              <th className="text-left p-4 text-gray-400 font-medium">Last Visit</th>
              <th className="text-center p-4 text-gray-400 font-medium">Status</th>
              <th className="text-right p-4 text-gray-400 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map(account => (
              <tr key={account.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${account.domain}&sz=32`}
                      alt=""
                      className="w-6 h-6 rounded"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <div>
                      <div className="text-white font-medium">{account.domain}</div>
                      {account.title && (
                        <div className="text-gray-500 text-sm">{account.title}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                    {account.category}
                  </span>
                </td>
                <td className="p-4 text-center text-gray-300">{account.visitCount}</td>
                <td className="p-4 text-gray-400">{account.lastVisit}</td>
                <td className="p-4 text-center">
                  {account.imported ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Imported
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm">
                      Pending
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  {!account.imported && (
                    <button
                      onClick={() => importAccount(account)}
                      disabled={importing.has(account.id)}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
                    >
                      {importing.has(account.id) ? 'Importing...' : 'Import'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAccounts.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No accounts match your filters
          </div>
        )}
      </div>
    </div>
  )
}
