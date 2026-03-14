import clsx from 'clsx'
import { AlertCircle, FileText, Image, Loader2, Sparkles, Upload } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

const SAMPLE_TEXT = `PATIENT ENCOUNTER NOTE

Patient: Sarah Mitchell
Date of Birth: 04/22/1968
MRN: 78234501
SSN: 532-10-4821
Insurance ID: BCB-887234991

VISIT DATE: February 14, 2024
Attending Physician: Dr. James Hartwell, MD
Facility: Riverside General Hospital
Address: 4401 Oak Park Drive, Portland, OR 97201
Phone: (503) 555-8820 | Fax: (503) 555-8821
Email: shartwell@riversidegeneral.org

CHIEF COMPLAINT:
Patient presents with persistent chest discomfort and shortness of breath for the past 3 days.

HISTORY OF PRESENT ILLNESS:
Sarah is a 55-year-old female referred by her PCP, Dr. Linda Torres at
Westside Family Practice (contact: linda.torres@westsidemedical.com).
She reports substernal pressure radiating to the left arm, rated 6/10.
Her husband, Robert Mitchell, accompanied her today (contact: 503-555-2290).

PAST MEDICAL HISTORY:
- Hypertension (dx 2015)
- Type 2 Diabetes Mellitus
- Hyperlipidemia

MEDICATIONS:
- Metformin 1000mg BID
- Lisinopril 10mg daily
- Atorvastatin 40mg nightly

ASSESSMENT & PLAN:
1. Acute coronary syndrome — rule out with troponin series
2. EKG ordered — showed ST depression in leads II, III, aVF
3. Cardiology consult placed with Dr. Angela Nguyen (pager: 555-4190)
4. Admit for observation; follow-up echocardiogram scheduled 02/16/2024

DEVICE: Cardiac monitor S/N: HRT-20234-B
IP: 192.168.10.45 (EMR terminal)

Electronically signed: Dr. James Hartwell on 02/14/2024 at 14:32`

interface FileUploadProps {
  onSubmitFile: (file: File) => void
  onSubmitText: (text: string) => void
  isLoading: boolean
}

const ACCEPT = {
  'text/plain': ['.txt'],
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/tiff': ['.tiff', '.tif'],
  'image/bmp': ['.bmp'],
  'image/webp': ['.webp'],
}

export default function FileUpload({ onSubmitFile, onSubmitText, isLoading }: FileUploadProps) {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload')
  const [pastedText, setPastedText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dropError, setDropError] = useState('')

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: unknown[]) => {
      setDropError('')
      if (rejectedFiles && (rejectedFiles as []).length > 0) {
        setDropError('Unsupported file type. Please upload a PDF, image, or text file.')
        return
      }
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0])
      }
    },
    [],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: isLoading,
  })

  const handleSubmit = () => {
    if (mode === 'upload' && selectedFile) {
      onSubmitFile(selectedFile)
    } else if (mode === 'paste' && pastedText.trim()) {
      onSubmitText(pastedText.trim())
    }
  }

  const handleSampleText = () => {
    setMode('paste')
    setPastedText(SAMPLE_TEXT)
  }

  const canSubmit =
    !isLoading && (mode === 'upload' ? !!selectedFile : pastedText.trim().length > 0)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Document De-identification</h1>
        <p className="text-gray-500 text-base">
          Upload a clinical document or paste text to automatically detect and redact PHI using AI.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 gap-1">
        {(['upload', 'paste'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={clsx(
              'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all',
              mode === m
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {m === 'upload' ? '📎 Upload File' : '📝 Paste Text'}
          </button>
        ))}
      </div>

      {/* Upload zone */}
      {mode === 'upload' && (
        <div className="mb-6">
          <div
            {...getRootProps()}
            className={clsx(
              'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : selectedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50',
              isLoading && 'pointer-events-none opacity-60',
            )}
          >
            <input {...getInputProps()} />
            {selectedFile ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <FileText className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-700">{selectedFile.name}</p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB — click to change
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  {isDragActive ? (
                    <Upload className="w-7 h-7 text-blue-600 animate-bounce" />
                  ) : (
                    <Upload className="w-7 h-7 text-blue-500" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-700">
                    {isDragActive ? 'Drop it here!' : 'Drag & drop a file, or click to browse'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">PDF, PNG, JPG, TIFF, TXT — up to 10 MB</p>
                </div>
                <div className="flex gap-2 mt-1">
                  {['PDF', 'PNG', 'JPG', 'TIFF', 'TXT'].map((ext) => (
                    <span
                      key={ext}
                      className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-mono"
                    >
                      {ext}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          {dropError && (
            <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {dropError}
            </div>
          )}
        </div>
      )}

      {/* Text paste area */}
      {mode === 'paste' && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">Clinical text</label>
            <button
              onClick={handleSampleText}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load sample note
            </button>
          </div>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={14}
            disabled={isLoading}
            placeholder="Paste a clinical note, discharge summary, or any medical text here…"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 bg-gray-50"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {pastedText.length.toLocaleString()} characters
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={clsx(
          'w-full py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2.5 transition-all',
          canSubmit
            ? 'bg-blue-700 text-white hover:bg-blue-800 shadow-md hover:shadow-lg active:scale-[0.99]'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed',
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Detecting & Redacting PHI…
          </>
        ) : (
          <>
            <Image className="w-5 h-5" />
            De-identify Document
          </>
        )}
      </button>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        {[
          { icon: '🔍', title: 'AI Detection', desc: '18 HIPAA identifiers detected by Quanteon Solutions ' },
          { icon: '🔄', title: 'Synthetic Data', desc: 'Realistic replacements preserve context' },
          { icon: '📋', title: 'Audit Trail', desc: 'Full redaction report generated' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm">
            <div className="text-xl mb-1.5">{icon}</div>
            <div className="text-xs font-semibold text-gray-800">{title}</div>
            <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
