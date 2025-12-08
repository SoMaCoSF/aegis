import { useEffect, useState } from 'react'
import {
  Users,
  CreditCard,
  AlertTriangle,
  Shield,
  Github,
  Mail,
  TrendingUp,
  Clock
} from 'lucide-react'
import StatCard from '../components/StatCard'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface DashboardStats {
  accounts: number
  subscriptions: number
  monthlySpend: number
  yearlySpend: number
  breaches: number
  githubIntegrations: number
  privacyExposures: number
  categoryBreakdown: { name: string; count: number }[]
  subscriptionsByCategory: { name: string; value: number }[]
  recentActivity: { action: string; target: string; time: string }[]
}

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#ef4444', '#a855f7', '#ec4899']

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => {
        // Use mock data if API fails
        setStats({
          accounts: 47,
          subscriptions: 12,
          monthlySpend: 89.97,
          yearlySpend: 1079.64,
          breaches: 3,
          githubIntegrations: 8,
          privacyExposures: 5,
          categoryBreakdown: [
            { name: 'Social', count: 12 },
            { name: 'Shopping', count: 15 },
            { name: 'Finance', count: 8 },
            { name: 'Entertainment', count: 7 },
            { name: 'Productivity', count: 5 },
          ],
          subscriptionsByCategory: [
            { name: 'Streaming', value: 45.97 },
            { name: 'SaaS', value: 29.00 },
            { name: 'Gaming', value: 15.00 },
          ],
          recentActivity: [
            { action: 'Scanned', target: 'Chrome passwords', time: '2 hours ago' },
            { action: 'Found breach', target: 'adobe.com', time: '1 day ago' },
            { action: 'Audited', target: 'GitHub apps', time: '3 days ago' },
          ]
        })
        setLoading(false)
      })
  }, [])

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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Your digital footprint at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Accounts"
          value={stats.accounts}
          subtitle="Across all sources"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.subscriptions}
          subtitle={`$${stats.monthlySpend.toFixed(2)}/month`}
          icon={CreditCard}
          color="green"
        />
        <StatCard
          title="Breach Exposures"
          value={stats.breaches}
          subtitle="Accounts compromised"
          icon={AlertTriangle}
          color={stats.breaches > 0 ? 'red' : 'green'}
        />
        <StatCard
          title="Privacy Risks"
          value={stats.privacyExposures}
          subtitle="Data broker listings"
          icon={Shield}
          color={stats.privacyExposures > 0 ? 'yellow' : 'green'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Account Categories */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Accounts by Category</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.categoryBreakdown}>
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription Breakdown */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Monthly Spend by Category</h2>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.subscriptionsByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: $${value}`}
                  labelLine={false}
                >
                  {stats.subscriptionsByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-aegis-500" />
            Quick Stats
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">GitHub Integrations</span>
              <span className="text-white font-semibold">{stats.githubIntegrations}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Yearly Spend</span>
              <span className="text-white font-semibold">${stats.yearlySpend.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Accounts with 2FA</span>
              <span className="text-green-400 font-semibold">23/47</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Weak Passwords</span>
              <span className="text-yellow-400 font-semibold">8</span>
            </div>
          </div>
        </div>

        {/* GitHub Summary */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub Security
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <span className="text-gray-300">OAuth Apps</span>
              <span className="text-aegis-400">4</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <span className="text-gray-300">SSH Keys</span>
              <span className="text-aegis-400">3</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <span className="text-gray-300">Suspicious</span>
              <span className="text-yellow-400">1</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {stats.recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                <div className="w-2 h-2 mt-2 rounded-full bg-aegis-500"></div>
                <div>
                  <p className="text-gray-300">
                    {activity.action} <span className="text-white">{activity.target}</span>
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
