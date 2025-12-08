import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  trend?: { value: number; label: string }
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-700',
  green: 'from-green-500 to-green-700',
  yellow: 'from-yellow-500 to-yellow-700',
  red: 'from-red-500 to-red-700',
  purple: 'from-purple-500 to-purple-700',
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend
}: StatCardProps) {
  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-sm mt-2 ${trend.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}
