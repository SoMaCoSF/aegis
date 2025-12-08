import { useEffect, useState } from 'react'
import { DollarSign, Calendar, AlertCircle, Pause, XCircle, ExternalLink } from 'lucide-react'

interface Subscription {
  id: string
  name: string
  cost: number
  currency: string
  billingCycle: string
  status: string
  nextBillingDate: string | null
  cancellationUrl: string | null
  canPause: boolean
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/subscriptions')
      .then(r => r.json())
      .then(data => {
        setSubscriptions(data)
        setLoading(false)
      })
      .catch(() => {
        setSubscriptions([
          { id: '1', name: 'Netflix', cost: 15.99, currency: 'USD', billingCycle: 'monthly', status: 'active', nextBillingDate: '2024-02-15', cancellationUrl: 'https://netflix.com/cancel', canPause: true },
          { id: '2', name: 'Spotify', cost: 9.99, currency: 'USD', billingCycle: 'monthly', status: 'active', nextBillingDate: '2024-02-10', cancellationUrl: 'https://spotify.com/account', canPause: false },
          { id: '3', name: 'GitHub Pro', cost: 4.00, currency: 'USD', billingCycle: 'monthly', status: 'active', nextBillingDate: '2024-02-20', cancellationUrl: 'https://github.com/settings/billing', canPause: false },
          { id: '4', name: 'Adobe CC', cost: 54.99, currency: 'USD', billingCycle: 'monthly', status: 'active', nextBillingDate: '2024-02-05', cancellationUrl: null, canPause: true },
          { id: '5', name: 'Disney+', cost: 7.99, currency: 'USD', billingCycle: 'monthly', status: 'paused', nextBillingDate: null, cancellationUrl: 'https://disneyplus.com/account', canPause: true },
          { id: '6', name: 'AWS', cost: 12.50, currency: 'USD', billingCycle: 'monthly', status: 'active', nextBillingDate: '2024-02-01', cancellationUrl: null, canPause: false },
        ])
        setLoading(false)
      })
  }, [])

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active')
  const monthlyTotal = activeSubscriptions.reduce((sum, s) => sum + s.cost, 0)
  const yearlyTotal = monthlyTotal * 12

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400'
      case 'paused': return 'bg-yellow-500/20 text-yellow-400'
      case 'cancelled': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getDaysUntil = (date: string | null) => {
    if (!date) return null
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
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
        <h1 className="text-3xl font-bold text-white">Subscriptions</h1>
        <p className="text-gray-400 mt-1">Track and manage your recurring payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-aegis-600 to-aegis-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-white/80" />
            <span className="text-white/80">Monthly</span>
          </div>
          <p className="text-3xl font-bold text-white">${monthlyTotal.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 text-gray-400" />
            <span className="text-gray-400">Yearly</span>
          </div>
          <p className="text-3xl font-bold text-white">${yearlyTotal.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-gray-400">Active</span>
          </div>
          <p className="text-3xl font-bold text-green-400">{activeSubscriptions.length}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-gray-400">Paused</span>
          </div>
          <p className="text-3xl font-bold text-yellow-400">
            {subscriptions.filter(s => s.status === 'paused').length}
          </p>
        </div>
      </div>

      {/* Upcoming Billing Alert */}
      {activeSubscriptions.some(s => getDaysUntil(s.nextBillingDate) !== null && getDaysUntil(s.nextBillingDate)! <= 7) && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <p className="text-yellow-200">
            You have payments coming up in the next 7 days
          </p>
        </div>
      )}

      {/* Subscriptions List */}
      <div className="space-y-4">
        {subscriptions.map(sub => {
          const daysUntil = getDaysUntil(sub.nextBillingDate)
          return (
            <div
              key={sub.id}
              className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{sub.name[0]}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{sub.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(sub.status)}`}>
                        {sub.status}
                      </span>
                      <span className="text-gray-500 text-sm">{sub.billingCycle}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  {/* Next billing */}
                  {sub.nextBillingDate && (
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">Next billing</p>
                      <p className={`font-medium ${daysUntil !== null && daysUntil <= 3 ? 'text-yellow-400' : 'text-white'}`}>
                        {daysUntil !== null ? `in ${daysUntil} days` : 'N/A'}
                      </p>
                    </div>
                  )}

                  {/* Cost */}
                  <div className="text-right min-w-[100px]">
                    <p className="text-2xl font-bold text-white">
                      ${sub.cost.toFixed(2)}
                    </p>
                    <p className="text-gray-500 text-sm">/{sub.billingCycle === 'monthly' ? 'mo' : 'yr'}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {sub.canPause && sub.status === 'active' && (
                      <button
                        className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors"
                        title="Pause subscription"
                      >
                        <Pause className="w-5 h-5" />
                      </button>
                    )}
                    {sub.cancellationUrl && (
                      <a
                        href={sub.cancellationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Cancel subscription"
                      >
                        <XCircle className="w-5 h-5" />
                      </a>
                    )}
                    <a
                      href={`https://${sub.name.toLowerCase().replace(/\s+/g, '')}.com`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-aegis-400 hover:bg-aegis-400/10 rounded-lg transition-colors"
                      title="Visit site"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
