import { useState, useEffect } from 'react'
import { Users, Eye, EyeOff, Shield, AlertTriangle, RefreshCw, Plus, ExternalLink } from 'lucide-react'

interface SocialAccount {
  id: string
  platform: string
  username: string
  displayName: string | null
  profileUrl: string | null
  followers: number
  following: number
  postsCount: number
  isVerified: boolean
  privacyLevel: 'public' | 'private' | 'protected'
  lastChecked: string | null
  linkedEmail: string | null
}

const PLATFORM_COLORS: Record<string, string> = {
  twitter: '#1da1f2',
  reddit: '#ff4500',
  instagram: '#e4405f',
  linkedin: '#0077b5',
  discord: '#5865f2',
  github: '#333',
  youtube: '#ff0000',
  tiktok: '#000000',
  threads: '#000000',
  mastodon: '#6364ff',
}

const PLATFORM_ICONS: Record<string, string> = {
  twitter: 'X (Twitter)',
  reddit: 'Reddit',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  discord: 'Discord',
  github: 'GitHub',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  threads: 'Threads',
  mastodon: 'Mastodon',
}

export default function Social() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/social/accounts')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
      } else {
        setAccounts(getMockAccounts())
      }
    } catch {
      setAccounts(getMockAccounts())
    }
    setLoading(false)
  }

  const getMockAccounts = (): SocialAccount[] => [
    {
      id: '1',
      platform: 'twitter',
      username: 'somacosf',
      displayName: 'SoMaCoSF',
      profileUrl: 'https://x.com/somacosf',
      followers: 127,
      following: 342,
      postsCount: 89,
      isVerified: false,
      privacyLevel: 'public',
      lastChecked: '2025-12-08',
      linkedEmail: 'somacosf@proton.me'
    },
    {
      id: '2',
      platform: 'reddit',
      username: 'somacosf',
      displayName: null,
      profileUrl: 'https://reddit.com/u/somacosf',
      followers: 12,
      following: 0,
      postsCount: 234,
      isVerified: false,
      privacyLevel: 'public',
      lastChecked: '2025-12-08',
      linkedEmail: null
    },
    {
      id: '3',
      platform: 'github',
      username: 'SoMaCoSF',
      displayName: 'SoMaCoSF',
      profileUrl: 'https://github.com/SoMaCoSF',
      followers: 8,
      following: 23,
      postsCount: 42,
      isVerified: false,
      privacyLevel: 'public',
      lastChecked: '2025-12-08',
      linkedEmail: 'somacosf@proton.me'
    },
    {
      id: '4',
      platform: 'linkedin',
      username: 'sstave',
      displayName: 'Stephen Stave',
      profileUrl: 'https://linkedin.com/in/sstave',
      followers: 512,
      following: 234,
      postsCount: 18,
      isVerified: false,
      privacyLevel: 'public',
      lastChecked: '2025-12-07',
      linkedEmail: 'sstave@gmail.com'
    },
    {
      id: '5',
      platform: 'instagram',
      username: 'somacosf',
      displayName: null,
      profileUrl: 'https://instagram.com/somacosf',
      followers: 89,
      following: 156,
      postsCount: 23,
      isVerified: false,
      privacyLevel: 'private',
      lastChecked: '2025-12-06',
      linkedEmail: null
    },
  ]

  const totalFollowers = accounts.reduce((sum, a) => sum + a.followers, 0)
  const publicCount = accounts.filter(a => a.privacyLevel === 'public').length
  const privateCount = accounts.filter(a => a.privacyLevel === 'private').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Social Media Monitor</h1>
            <p className="text-gray-400 text-sm">Track and manage your social presence</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
          <button
            onClick={loadAccounts}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-pink-400" />
            <span className="text-gray-400 text-sm">Total Accounts</span>
          </div>
          <div className="text-2xl font-bold text-white">{accounts.length}</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-gray-400 text-sm">Total Followers</span>
          </div>
          <div className="text-2xl font-bold text-white">{totalFollowers.toLocaleString()}</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="w-5 h-5 text-green-400" />
            <span className="text-gray-400 text-sm">Public Profiles</span>
          </div>
          <div className="text-2xl font-bold text-white">{publicCount}</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <EyeOff className="w-5 h-5 text-amber-400" />
            <span className="text-gray-400 text-sm">Private Profiles</span>
          </div>
          <div className="text-2xl font-bold text-white">{privateCount}</div>
        </div>
      </div>

      {/* Privacy Alert */}
      {publicCount > privateCount && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <h3 className="text-amber-400 font-medium">Privacy Notice</h3>
            <p className="text-gray-400 text-sm mt-1">
              Most of your social accounts are public. Consider reviewing privacy settings on platforms where you want limited visibility.
            </p>
          </div>
        </div>
      )}

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(account => (
          <div key={account.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: PLATFORM_COLORS[account.platform] || '#666' }}
                >
                  <span className="text-white text-xs font-bold">
                    {account.platform.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-white font-medium">@{account.username}</div>
                  <div className="text-gray-500 text-sm">
                    {PLATFORM_ICONS[account.platform] || account.platform}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {account.privacyLevel === 'public' ? (
                  <Eye className="w-4 h-4 text-green-400" />
                ) : (
                  <EyeOff className="w-4 h-4 text-amber-400" />
                )}
                {account.profileUrl && (
                  <a
                    href={account.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {account.displayName && (
              <div className="text-gray-300 mb-3">{account.displayName}</div>
            )}

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 bg-gray-900/50 rounded-lg">
                <div className="text-white font-medium">{account.followers.toLocaleString()}</div>
                <div className="text-gray-500 text-xs">Followers</div>
              </div>
              <div className="text-center p-2 bg-gray-900/50 rounded-lg">
                <div className="text-white font-medium">{account.following.toLocaleString()}</div>
                <div className="text-gray-500 text-xs">Following</div>
              </div>
              <div className="text-center p-2 bg-gray-900/50 rounded-lg">
                <div className="text-white font-medium">{account.postsCount.toLocaleString()}</div>
                <div className="text-gray-500 text-xs">Posts</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className={`px-2 py-1 rounded-full ${
                account.privacyLevel === 'public'
                  ? 'bg-green-500/20 text-green-400'
                  : account.privacyLevel === 'private'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {account.privacyLevel}
              </span>
              {account.lastChecked && (
                <span className="text-gray-500">
                  Last checked: {account.lastChecked}
                </span>
              )}
            </div>

            {account.linkedEmail && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="text-gray-500 text-xs">Linked Email</div>
                <div className="text-gray-300 text-sm">{account.linkedEmail}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Add Social Account</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Platform</label>
                <select className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white">
                  {Object.entries(PLATFORM_ICONS).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Username</label>
                <input
                  type="text"
                  placeholder="@username"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg"
                >
                  Add Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
