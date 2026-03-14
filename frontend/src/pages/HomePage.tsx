import { useState } from 'react'
import { RotateCcw, FileCheck } from 'lucide-react'
import FileUpload from '../components/FileUpload'
import DocumentComparison from '../components/DocumentComparison'
import RedactionReport from '../components/RedactionReport'
import { deidentifyFile, deidentifyText } from '../api/client'
import { DeidentifyResponse } from '../types'

type Tab = 'compare' | 'report'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<DeidentifyResponse | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('compare')

  const handleFile = async (file: File) => {
    setIsLoading(true)
    setError('')
    try {
      const data = await deidentifyFile(file)
      setResult(data)
      setActiveTab('compare')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (err instanceof Error ? err.message : 'Something went wrong')
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleText = async (text: string) => {
    setIsLoading(true)
    setError('')
    try {
      const data = await deidentifyText(text)
      setResult(data)
      setActiveTab('compare')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (err instanceof Error ? err.message : 'Something went wrong')
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError('')
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {!result ? (
        <>
          <FileUpload
            onSubmitFile={handleFile}
            onSubmitText={handleText}
            isLoading={isLoading}
          />
          {error && (
            <div className="mt-4 max-w-3xl mx-auto bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          {/* Result header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">De-identification Complete</h2>
                <p className="text-sm text-gray-400">
                  {result.report.totalEntities} PHI instance
                  {result.report.totalEntities !== 1 ? 's' : ''} removed from{' '}
                  <span className="font-medium text-gray-600">{result.report.fileName}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors border border-gray-200 rounded-lg px-4 py-2"
            >
              <RotateCcw className="w-4 h-4" />
              Process another
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit">
            {([
              { id: 'compare', label: '🔍 Document Comparison' },
              { id: 'report', label: '📋 Redaction Report' },
            ] as { id: Tab; label: string }[]).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={
                  activeTab === id
                    ? 'px-5 py-2 bg-white rounded-lg text-sm font-medium text-blue-700 shadow-sm'
                    : 'px-5 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700'
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'compare' ? (
            <DocumentComparison result={result} />
          ) : (
            <RedactionReport result={result} />
          )}
        </div>
      )}
    </main>
  )
}
