import { useState } from 'react'
import { Copy, Check, Eye, EyeOff } from 'lucide-react'
import { DeidentifyResponse, PHI_HIGHLIGHT, PHI_LABELS, PHIEntityWithPosition } from '../types'
import clsx from 'clsx'

interface Segment {
  text: string
  isEntity: boolean
  entity?: PHIEntityWithPosition
}

function buildSegments(text: string, entities: PHIEntityWithPosition[]): Segment[] {
  // Sort entities by start position
  const sorted = [...entities].sort((a, b) => a.start - b.start)

  const segments: Segment[] = []
  let cursor = 0

  for (const entity of sorted) {
    if (entity.start > cursor) {
      segments.push({ text: text.slice(cursor, entity.start), isEntity: false })
    }
    if (entity.start >= cursor) {
      segments.push({
        text: text.slice(entity.start, entity.end),
        isEntity: true,
        entity,
      })
      cursor = entity.end
    }
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), isEntity: false })
  }

  return segments
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

interface DocumentComparisonProps {
  result: DeidentifyResponse
}

export default function DocumentComparison({ result }: DocumentComparisonProps) {
  const [hoveredType, setHoveredType] = useState<string | null>(null)
  const [showLegend, setShowLegend] = useState(true)

  const { originalText, redactedText, entities } = result

  const segments = buildSegments(originalText, entities)

  // Build legend: unique types that appear
  const presentTypes = [...new Set(entities.map((e) => e.type))]

  return (
    <div className="space-y-4">
      {/* Legend toggle */}
      {presentTypes.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <button
            onClick={() => setShowLegend((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 hover:text-blue-700 transition-colors"
          >
            {showLegend ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            PHI Legend ({presentTypes.length} types detected)
          </button>
          {showLegend && (
            <div className="flex flex-wrap gap-2">
              {presentTypes.map((type) => (
                <button
                  key={type}
                  onMouseEnter={() => setHoveredType(type)}
                  onMouseLeave={() => setHoveredType(null)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                    PHI_HIGHLIGHT[type] || 'bg-gray-100',
                    hoveredType === type ? 'ring-2 ring-offset-1 ring-blue-400 scale-105' : '',
                  )}
                >
                  {PHI_LABELS[type] || type}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Split view */}
      <div className="grid grid-cols-2 gap-4">
        {/* Original */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-red-50 border-b border-red-100">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="text-sm font-semibold text-red-800">Original (with PHI)</span>
            </div>
            <CopyButton text={originalText} />
          </div>
          <div className="p-4 max-h-[520px] overflow-y-auto">
            <pre className="text-xs leading-relaxed text-gray-800 font-mono whitespace-pre-wrap break-words">
              {segments.map((seg, i) =>
                seg.isEntity && seg.entity ? (
                  <mark
                    key={i}
                    title={`${PHI_LABELS[seg.entity.type] || seg.entity.type}: ${seg.entity.synthetic}`}
                    className={clsx(
                      'rounded px-0.5 cursor-help border',
                      PHI_HIGHLIGHT[seg.entity.type] || 'bg-yellow-200',
                      hoveredType === seg.entity.type ? 'ring-1 ring-blue-400' : '',
                    )}
                  >
                    {seg.text}
                  </mark>
                ) : (
                  <span key={i}>{seg.text}</span>
                ),
              )}
            </pre>
          </div>
        </div>

        {/* De-identified */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-green-50 border-b border-green-100">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-green-800">De-identified (HIPAA Safe)</span>
            </div>
            <CopyButton text={redactedText} />
          </div>
          <div className="p-4 max-h-[520px] overflow-y-auto">
            <pre className="text-xs leading-relaxed text-gray-800 font-mono whitespace-pre-wrap break-words">
              {redactedText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
