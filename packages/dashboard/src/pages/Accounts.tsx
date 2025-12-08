import { useEffect, useState } from 'react'
import { Search, Filter, Shield, ShieldOff, Key, ExternalLink } from 'lucide-react'

interface Account {
  id: string
  domain: string
  username: string | null
  email: string | null
  has2FA: boolean
  passwordStrength: string | null
  category: string
  source: string
  lastLogin: string | null
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    fetch('/api/accounts')
      .then(r => r.json())
      .then(data => {
        setAccounts(data)
        setLoading(false)
      })
      .catch(() => {
        // Mock data
        setAccounts([
          { id: '1', domain: 'github.com', username: 'SoMaCoSF', email: 'user@example.com', has2FA: true, passwordStrength: 'strong', category: 'Development', source: 'chrome', lastLogin: '2024-01-15' },
          { id: '2', domain: 'google.com', username: null, email: 'user@gmail.com', has2FA: true, passwordStrength: 'strong', category: 'Productivity', source: 'chrome', lastLogin: '2024-01-14' },
          { id: '3', domain: 'netflix.com', username: null, email: 'user@example.com', has2FA: false, passwordStrength: 'medium', category: 'Entertainment', source: 'chrome', lastLogin: '2024-01-10' },
          { id: '4', domain: 'amazon.com', username: null, email: 'user@example.com', has2FA: true, passwordStrength: 'strong', category: 'Shopping', source: 'chrome', lastLogin: '2024-01-12' },
          { id: '5', domain: 'twitter.com', username: '@somacosf', email: 'user@example.com', has2FA: false, passwordStrength: 'weak', category: 'Social', source: 'chrome', lastLogin: '2024-01-08' },
          { id: '6', domain: 'spotify.com', username: null, email: 'user@example.com', has2FA: false, passwordStrength: 'medium', category: 'Entertainment', source: 'edge', lastLogin: null },
          { id: '7', domain: 'dropbox.com', username: null, email: 'user@example.com', has2FA: true, passwordStrength: 'strong', category: 'Productivity', source: 'chrome', lastLogin: '2024-01-05' },
          { id: '8', domain: 'linkedin.com', username: null, email: 'user@example.com', has2FA: false, passwordStrength: 'medium', category: 'Social', source: 'chrome', lastLogin: '2024-01-03' },
        ])
        setLoading(false)
      })
  }, [])

  const categories = ['all', ...new Set(accounts.map(a => a.category))]

  const filteredAccounts = accounts.filter(a => {
    const matchesSearch = a.domain.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.username?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getStrengthColor = (strength: string | null) => {
    switch (strength) {
      case 'strong': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'weak': return 'text-red-400'
      default: return 'text-gray-500'
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Accounts</h1>
        <p className="text-gray-400 mt-1">Manage your online accounts and credentials</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-aegis-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="pl-10 pr-8 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white appearance-none focus:outline-none focus:border-aegis-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-gray-400 text-sm">Total</p>
          <p className="text-2xl font-bold text-white">{accounts.length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-gray-400 text-sm">With 2FA</p>
          <p className="text-2xl font-bold text-green-400">{accounts.filter(a => a.has2FA).length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-gray-400 text-sm">No 2FA</p>
          <p className="text-2xl font-bold text-yellow-400">{accounts.filter(a => !a.has2FA).length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-gray-400 text-sm">Weak Passwords</p>
          <p className="text-2xl font-bold text-red-400">{accounts.filter(a => a.passwordStrength === 'weak').length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Domain</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Account</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Category</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Security</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Source</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredAccounts.map(account => (
              <tr key={account.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${account.domain}&sz=32`}
                      alt=""
                      className="w-6 h-6 rounded"
                    />
                    <span className="text-white font-medium">{account.domain}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    {account.username && <p className="text-white">{account.username}</p>}
                    {account.email && <p className="text-gray-400 text-sm">{account.email}</p>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-800 rounded text-gray-300 text-sm">
                    {account.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {account.has2FA ? (
                      <Shield className="w-5 h-5 text-green-400" title="2FA Enabled" />
                    ) : (
                      <ShieldOff className="w-5 h-5 text-gray-600" title="No 2FA" />
                    )}
                    <span className={`flex items-center gap-1 ${getStrengthColor(account.passwordStrength)}`}>
                      <Key className="w-4 h-4" />
                      <span className="text-sm capitalize">{account.passwordStrength || 'unknown'}</span>
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-400 text-sm capitalize">{account.source}</span>
                </td>
                <td className="px-6 py-4">
                  <a
                    href={`https://${account.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-aegis-400 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
