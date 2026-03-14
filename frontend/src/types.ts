export type PHIType =
  | 'PATIENT_NAME'
  | 'RELATIVE_NAME'
  | 'PROVIDER_NAME'
  | 'DATE'
  | 'PHONE'
  | 'FAX'
  | 'EMAIL'
  | 'SSN'
  | 'MRN'
  | 'HEALTH_PLAN_ID'
  | 'ACCOUNT_NUMBER'
  | 'LICENSE_NUMBER'
  | 'VIN'
  | 'DEVICE_ID'
  | 'IP_ADDRESS'
  | 'URL'
  | 'GEO_LOCATION'
  | 'AGE_OVER_89'
  | 'BIOMETRIC'
  | 'OTHER_ID'

export interface PHIEntityWithPosition {
  original: string
  type: PHIType
  synthetic: string
  context?: string
  start: number
  end: number
  occurrences: number
}

export interface RedactionReport {
  id: string
  timestamp: string
  fileName: string
  fileType: string
  totalEntities: number
  byType: Record<string, number>
  processingTimeMs: number
  originalLength: number
  redactedLength: number
}

export interface DeidentifyResponse {
  id: string
  originalText: string
  redactedText: string
  entities: PHIEntityWithPosition[]
  report: RedactionReport
}

export interface UploadRecord {
  id: string
  timestamp: string
  fileName: string
  fileType: string
  entityCounts: Record<string, number>
  totalEntities: number
}

export interface DashboardStats {
  totalDocuments: number
  totalEntitiesRemoved: number
  byType: Record<string, number>
  recentUploads: UploadRecord[]
}

// Color map for PHI types
export const PHI_COLORS: Record<string, string> = {
  PATIENT_NAME: 'bg-red-100 text-red-800 border-red-200',
  RELATIVE_NAME: 'bg-rose-100 text-rose-800 border-rose-200',
  PROVIDER_NAME: 'bg-pink-100 text-pink-800 border-pink-200',
  DATE: 'bg-orange-100 text-orange-800 border-orange-200',
  PHONE: 'bg-blue-100 text-blue-800 border-blue-200',
  FAX: 'bg-sky-100 text-sky-800 border-sky-200',
  EMAIL: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  SSN: 'bg-purple-100 text-purple-800 border-purple-200',
  MRN: 'bg-violet-100 text-violet-800 border-violet-200',
  HEALTH_PLAN_ID: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  ACCOUNT_NUMBER: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  LICENSE_NUMBER: 'bg-teal-100 text-teal-800 border-teal-200',
  GEO_LOCATION: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  AGE_OVER_89: 'bg-amber-100 text-amber-800 border-amber-200',
  IP_ADDRESS: 'bg-lime-100 text-lime-800 border-lime-200',
  URL: 'bg-green-100 text-green-800 border-green-200',
  VIN: 'bg-stone-100 text-stone-800 border-stone-200',
  DEVICE_ID: 'bg-gray-100 text-gray-800 border-gray-200',
  BIOMETRIC: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  OTHER_ID: 'bg-slate-100 text-slate-800 border-slate-200',
}

export const PHI_HIGHLIGHT: Record<string, string> = {
  PATIENT_NAME: 'bg-red-200',
  RELATIVE_NAME: 'bg-rose-200',
  PROVIDER_NAME: 'bg-pink-200',
  DATE: 'bg-orange-200',
  PHONE: 'bg-blue-200',
  FAX: 'bg-sky-200',
  EMAIL: 'bg-emerald-200',
  SSN: 'bg-purple-200',
  MRN: 'bg-violet-200',
  HEALTH_PLAN_ID: 'bg-indigo-200',
  ACCOUNT_NUMBER: 'bg-cyan-200',
  LICENSE_NUMBER: 'bg-teal-200',
  GEO_LOCATION: 'bg-yellow-200',
  AGE_OVER_89: 'bg-amber-200',
  IP_ADDRESS: 'bg-lime-200',
  URL: 'bg-green-200',
  VIN: 'bg-stone-200',
  DEVICE_ID: 'bg-gray-200',
  BIOMETRIC: 'bg-fuchsia-200',
  OTHER_ID: 'bg-slate-200',
}

export const PHI_LABELS: Record<string, string> = {
  PATIENT_NAME: 'Patient Name',
  RELATIVE_NAME: 'Relative Name',
  PROVIDER_NAME: 'Provider Name',
  DATE: 'Date',
  PHONE: 'Phone',
  FAX: 'Fax',
  EMAIL: 'Email',
  SSN: 'SSN',
  MRN: 'Medical Record #',
  HEALTH_PLAN_ID: 'Health Plan ID',
  ACCOUNT_NUMBER: 'Account Number',
  LICENSE_NUMBER: 'License Number',
  GEO_LOCATION: 'Location',
  AGE_OVER_89: 'Age (>89)',
  IP_ADDRESS: 'IP Address',
  URL: 'URL',
  VIN: 'VIN',
  DEVICE_ID: 'Device ID',
  BIOMETRIC: 'Biometric',
  OTHER_ID: 'Other ID',
}
