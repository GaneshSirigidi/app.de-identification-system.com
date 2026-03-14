import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { getDashboardStats } from '../api/client'
import { DashboardStats, PHI_LABELS } from '../types'
import { RefreshCw, TrendingUp, FileStack, ShieldCheck, Loader2 } from 'lucide-react'
import clsx from 'clsx'

const BAR_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1',
]

export default function ComplianceDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getDashboardStats()
      setStats(data)
    } catch {
      setError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>{error || 'No data available.'}</p>
        <button onClick={fetchStats} className="mt-3 text-blue-600 text-sm hover:underline">
          Retry
        </button>
      </div>
    )
  }

  const chartData = Object.entries(stats.byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([type, count]) => ({
      name: PHI_LABELS[type] || type,
      count,
      type,
    }))

  const topType =
    chartData.length > 0
      ? PHI_LABELS[chartData[0].type] || chartData[0].type
      : '—'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Aggregate PHI detection statistics across all processed documents
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors border border-gray-200 rounded-lg px-3 py-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            icon: FileStack,
            label: 'Documents Processed',
            value: stats.totalDocuments,
            color: 'bg-blue-50 text-blue-600',
          },
          {
            icon: ShieldCheck,
            label: 'PHI Instances Removed',
            value: stats.totalEntitiesRemoved,
            color: 'bg-red-50 text-red-600',
          },
          {
            icon: TrendingUp,
            label: 'Most Common PHI',
            value: topType,
            color: 'bg-orange-50 text-orange-600',
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* PHI type chart */}
      {chartData.length > 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-5">PHI Detections by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 60 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [value, 'Count']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center text-gray-400 shadow-sm">
          No PHI data yet. Process some documents to see statistics here.
        </div>
      )}

      {/* Recent uploads */}
      {stats.recentUploads.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">Recent Documents</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">File</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">PHI Removed</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Processed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentUploads.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-700 max-w-[200px] truncate">
                      {rec.fileName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                        {rec.fileType.split('/')[1] || rec.fileType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                      {rec.totalEntities}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs">
                      {new Date(rec.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
