import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Wallet, RefreshCw, Plus, Shield, AlertTriangle, BarChart3 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface FinancialAccount {
  id: string
  provider: string
  accountType: string
  nickname: string | null
  lastBalance: number | null
  currency: string
  isActive: boolean
  hasAPIAccess: boolean
  lastSynced: string | null
}

interface PortfolioData {
  totalValue: number
  dayChange: number
  dayChangePercent: number
  positions: { symbol: string; shares: number; value: number; change: number }[]
  history: { date: string; value: number }[]
}

const PROVIDER_COLORS: Record<string, string> = {
  alpaca: '#f7c300',
  robinhood: '#00c805',
  coinbase: '#0052ff',
  bank: '#1a1a2e',
  other: '#6b7280',
}

const PROVIDER_NAMES: Record<string, string> = {
  alpaca: 'Alpaca Markets',
  robinhood: 'Robinhood',
  coinbase: 'Coinbase',
  bank: 'Bank Account',
}

export default function Finance() {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [accountsRes, portfolioRes] = await Promise.all([
        fetch('/api/finance/accounts'),
        fetch('/api/finance/portfolio')
      ])

      if (accountsRes.ok) {
        setAccounts(await accountsRes.json())
      } else {
        setAccounts(getMockAccounts())
      }

      if (portfolioRes.ok) {
        setPortfolio(await portfolioRes.json())
      } else {
        setPortfolio(getMockPortfolio())
      }
    } catch {
      setAccounts(getMockAccounts())
      setPortfolio(getMockPortfolio())
    }
    setLoading(false)
  }

  const getMockAccounts = (): FinancialAccount[] => [
    {
      id: '1',
      provider: 'alpaca',
      accountType: 'trading',
      nickname: 'Paper Trading',
      lastBalance: 25420.50,
      currency: 'USD',
      isActive: true,
      hasAPIAccess: true,
      lastSynced: '2025-12-08T10:30:00Z'
    },
    {
      id: '2',
      provider: 'coinbase',
      accountType: 'crypto',
      nickname: 'Crypto Holdings',
      lastBalance: 3240.80,
      currency: 'USD',
      isActive: true,
      hasAPIAccess: false,
      lastSynced: '2025-12-07T15:00:00Z'
    },
  ]

  const getMockPortfolio = (): PortfolioData => ({
    totalValue: 28661.30,
    dayChange: 342.50,
    dayChangePercent: 1.21,
    positions: [
      { symbol: 'AAPL', shares: 10, value: 1890.50, change: 2.3 },
      { symbol: 'NVDA', shares: 5, value: 6752.25, change: -0.8 },
      { symbol: 'SPY', shares: 15, value: 8925.00, change: 0.5 },
      { symbol: 'TSLA', shares: 8, value: 3120.00, change: 3.2 },
      { symbol: 'BTC', shares: 0.05, value: 5230.00, change: 1.8 },
    ],
    history: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: 25000 + Math.random() * 5000 + i * 100
    }))
  })

  const totalBalance = accounts.reduce((sum, a) => sum + (a.lastBalance || 0), 0)
  const activeAccounts = accounts.filter(a => a.isActive).length
  const apiConnected = accounts.filter(a => a.hasAPIAccess).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Financial Dashboard</h1>
            <p className="text-gray-400 text-sm">Track trading and investment accounts</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-5 h-5 text-green-400" />
            <span className="text-gray-400 text-sm">Total Balance</span>
          </div>
          <div className="text-2xl font-bold text-white">${totalBalance.toLocaleString()}</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            {portfolio && portfolio.dayChange >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
            <span className="text-gray-400 text-sm">Day Change</span>
          </div>
          <div className={`text-2xl font-bold ${portfolio && portfolio.dayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {portfolio ? `${portfolio.dayChange >= 0 ? '+' : ''}$${portfolio.dayChange.toFixed(2)}` : '$0.00'}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span className="text-gray-400 text-sm">Active Accounts</span>
          </div>
          <div className="text-2xl font-bold text-white">{activeAccounts}</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <span className="text-gray-400 text-sm">API Connected</span>
          </div>
          <div className="text-2xl font-bold text-white">{apiConnected}</div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
        <div>
          <h3 className="text-blue-400 font-medium">Read-Only Access</h3>
          <p className="text-gray-400 text-sm mt-1">
            AEGIS only uses read-only API access. No trading actions can be performed through this dashboard.
            API keys are stored locally and never transmitted.
          </p>
        </div>
      </div>

      {/* Portfolio Chart */}
      {portfolio && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Portfolio Value (30 Days)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolio.history}>
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  fill="url(#portfolioGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-400" />
            Connected Accounts
          </h3>
          <div className="space-y-3">
            {accounts.map(account => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: PROVIDER_COLORS[account.provider] || PROVIDER_COLORS.other }}
                  >
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {PROVIDER_NAMES[account.provider] || account.provider}
                    </div>
                    <div className="text-gray-500 text-sm flex items-center gap-2">
                      {account.nickname || account.accountType}
                      {account.hasAPIAccess && (
                        <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">API</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">
                    ${account.lastBalance?.toLocaleString() || '—'}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {account.lastSynced
                      ? `Synced ${new Date(account.lastSynced).toLocaleDateString()}`
                      : 'Not synced'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Positions */}
        {portfolio && (
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-400" />
              Positions
            </h3>
            <div className="space-y-3">
              {portfolio.positions.map((pos, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{pos.symbol}</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">{pos.symbol}</div>
                      <div className="text-gray-500 text-sm">{pos.shares} shares</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">${pos.value.toLocaleString()}</div>
                    <div className={`text-sm ${pos.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pos.change >= 0 ? '+' : ''}{pos.change}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* API Setup Notice */}
      {apiConnected === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <h3 className="text-amber-400 font-medium">No API Connections</h3>
            <p className="text-gray-400 text-sm mt-1">
              Connect your Alpaca or other trading accounts via API to enable automatic portfolio syncing.
              API keys are stored locally with encryption.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
