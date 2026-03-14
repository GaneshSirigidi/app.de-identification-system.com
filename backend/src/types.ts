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

export interface PHIEntity {
  original: string
  type: PHIType
  synthetic: string
  context?: string
}

export interface PHIEntityWithPosition extends PHIEntity {
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
