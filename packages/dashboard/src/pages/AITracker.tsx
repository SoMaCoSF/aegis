import { useState, useEffect } from 'react'
import { Brain, Cpu, DollarSign, TrendingUp, Clock, Zap, BarChart3, PieChart } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from 'recharts'

interface AIUsageStats {
  totalSessions: number
  totalTokens: number
  estimatedCost: number
  byProvider: Record<string, { sessions: number; tokens: number; cost: number }>
  byDay: { date: string; tokens: number; cost: number }[]
  recentSessions: { provider: string; model: string; tokens: number; cost: number; time: string }[]
}

const PROVIDER_COLORS: Record<string, string> = {
  claude: '#d97706',
  openai: '#10b981',
  gemini: '#3b82f6',
  xai: '#8b5cf6',
  other: '#6b7280',
}

const PROVIDER_ICONS: Record<string, string> = {
  claude: 'Anthropic Claude',
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  xai: 'xAI Grok',
}

export default function AITracker() {
  const [stats, setStats] = useState<AIUsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    loadStats()
  }, [timeRange])

  const loadStats = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ai/usage?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        // Mock data for demo
        setStats(generateMockStats())
      }
    } catch {
      setStats(generateMockStats())
    }
    setLoading(false)
  }

  const generateMockStats = (): AIUsageStats => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const byDay = Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - i - 1))
      const tokens = Math.floor(Math.random() * 50000) + 10000
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tokens,
        cost: tokens * 0.00002
      }
    })

    return {
      totalSessions: 127,
      totalTokens: byDay.reduce((sum, d) => sum + d.tokens, 0),
      estimatedCost: byDay.reduce((sum, d) => sum + d.cost, 0),
      byProvider: {
        claude: { sessions: 89, tokens: 450000, cost: 12.50 },
        openai: { sessions: 23, tokens: 120000, cost: 4.20 },
        gemini: { sessions: 12, tokens: 80000, cost: 0.80 },
        xai: { sessions: 3, tokens: 15000, cost: 0.45 },
      },
      byDay,
      recentSessions: [
        { provider: 'claude', model: 'opus-4', tokens: 15420, cost: 0.62, time: '2 hours ago' },
        { provider: 'claude', model: 'sonnet-4', tokens: 8200, cost: 0.16, time: '4 hours ago' },
        { provider: 'openai', model: 'gpt-4o', tokens: 5100, cost: 0.15, time: '6 hours ago' },
        { provider: 'gemini', model: 'pro-1.5', tokens: 12000, cost: 0.12, time: '1 day ago' },
        { provider: 'claude', model: 'haiku-3', tokens: 3200, cost: 0.01, time: '1 day ago' },
      ]
    }
  }

  const pieData = stats ? Object.entries(stats.byProvider).map(([provider, data]) => ({
    name: PROVIDER_ICONS[provider] || provider,
    value: data.tokens,
    color: PROVIDER_COLORS[provider] || PROVIDER_COLORS.other,
  })) : []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Usage Tracker</h1>
            <p className="text-gray-400 text-sm">Monitor your AI assistant usage and costs</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                timeRange === range
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading AI usage data...</div>
        </div>
      ) : stats ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-gray-400 text-sm">Total Sessions</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.totalSessions}</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Cpu className="w-5 h-5 text-blue-400" />
                <span className="text-gray-400 text-sm">Total Tokens</span>
              </div>
              <div className="text-2xl font-bold text-white">{(stats.totalTokens / 1000).toFixed(0)}K</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="text-gray-400 text-sm">Estimated Cost</span>
              </div>
              <div className="text-2xl font-bold text-white">${stats.estimatedCost.toFixed(2)}</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span className="text-gray-400 text-sm">Avg per Day</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {(stats.totalTokens / stats.byDay.length / 1000).toFixed(1)}K
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Usage Over Time */}
            <div className="lg:col-span-2 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                Token Usage Over Time
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.byDay}>
                    <defs>
                      <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`${(value / 1000).toFixed(1)}K tokens`, 'Usage']}
                    />
                    <Area
                      type="monotone"
                      dataKey="tokens"
                      stroke="#d97706"
                      fill="url(#tokenGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Provider Distribution */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-amber-400" />
                By Provider
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      formatter={(value: number) => [`${(value / 1000).toFixed(0)}K tokens`]}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-400">{item.name}</span>
                    </div>
                    <span className="text-white">{(item.value / 1000).toFixed(0)}K</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Provider Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(stats.byProvider).map(([provider, data]) => (
              <div key={provider} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: PROVIDER_COLORS[provider] + '20' }}
                  >
                    <Brain className="w-4 h-4" style={{ color: PROVIDER_COLORS[provider] }} />
                  </div>
                  <span className="text-white font-medium capitalize">{PROVIDER_ICONS[provider] || provider}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-white">{data.sessions}</div>
                    <div className="text-xs text-gray-500">Sessions</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{(data.tokens / 1000).toFixed(0)}K</div>
                    <div className="text-xs text-gray-500">Tokens</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">${data.cost.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">Cost</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Sessions */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Recent Sessions
            </h3>
            <div className="space-y-3">
              {stats.recentSessions.map((session, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: PROVIDER_COLORS[session.provider] + '20' }}
                    >
                      <Brain className="w-4 h-4" style={{ color: PROVIDER_COLORS[session.provider] }} />
                    </div>
                    <div>
                      <div className="text-white font-medium capitalize">{session.provider}</div>
                      <div className="text-gray-500 text-sm">{session.model}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white">{(session.tokens / 1000).toFixed(1)}K tokens</div>
                    <div className="text-gray-500 text-sm">${session.cost.toFixed(2)} - {session.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
