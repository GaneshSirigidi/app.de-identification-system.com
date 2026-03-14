import { DeidentifyResponse, PHI_COLORS, PHI_LABELS } from '../types'
import { Clock, FileText, Hash, ShieldCheck, ArrowRight } from 'lucide-react'

interface RedactionReportProps {
  result: DeidentifyResponse
}

export default function RedactionReport({ result }: RedactionReportProps) {
  const { report, entities } = result

  const statCards = [
    {
      icon: Hash,
      label: 'PHI Instances Removed',
      value: report.totalEntities,
      color: 'text-red-600 bg-red-50',
    },
    {
      icon: ShieldCheck,
      label: 'PHI Types Detected',
      value: Object.keys(report.byType).length,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: Clock,
      label: 'Processing Time',
      value: `${(report.processingTimeMs / 1000).toFixed(1)}s`,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      icon: FileText,
      label: 'Characters Processed',
      value: report.originalLength.toLocaleString(),
      color: 'text-green-600 bg-green-50',
    },
  ]

  // Sort entities by type then original
  const sortedEntities = [...entities].sort((a, b) =>
    a.type !== b.type ? a.type.localeCompare(b.type) : a.original.localeCompare(b.original),
  )

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-400 mt-0.5 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* By-type breakdown */}
      {Object.keys(report.byType).length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">PHI Breakdown by Type</h3>
          <div className="space-y-2.5">
            {Object.entries(report.byType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const pct = Math.round((count / report.totalEntities) * 100)
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-medium border min-w-[130px] ${PHI_COLORS[type] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                    >
                      {PHI_LABELS[type] || type}
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 w-8 text-right">{count}</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Entity detail table */}
      {sortedEntities.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Redacted Entities ({entities.length} unique)</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Original values replaced with synthetic equivalents
            </p>
          </div>
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-500">Type</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-500">Original PHI</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-gray-500 w-6"></th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-500">Synthetic Replacement</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-gray-500">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedEntities.map((entity, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-medium border ${PHI_COLORS[entity.type] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                      >
                        {PHI_LABELS[entity.type] || entity.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-gray-700 max-w-[180px] truncate" title={entity.original}>
                      {entity.original}
                    </td>
                    <td className="px-1 py-2 text-gray-300">
                      <ArrowRight className="w-3 h-3" />
                    </td>
                    <td className="px-4 py-2 font-mono text-gray-500 max-w-[180px] truncate" title={entity.synthetic}>
                      {entity.synthetic}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-400">{entity.occurrences}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-400 space-y-1">
        <div className="flex justify-between">
          <span>Report ID</span>
          <span className="font-mono">{report.id}</span>
        </div>
        <div className="flex justify-between">
          <span>Processed at</span>
          <span>{new Date(report.timestamp).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Source file</span>
          <span>{report.fileName}</span>
        </div>
        <div className="flex justify-between">
          <span>Characters: original → redacted</span>
          <span>
            {report.originalLength.toLocaleString()} → {report.redactedLength.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
