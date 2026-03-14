import { UploadRecord, DashboardStats } from '../types'

const MAX_RECORDS = 100
const records: UploadRecord[] = []

export function saveRecord(record: UploadRecord): void {
  records.unshift(record)
  if (records.length > MAX_RECORDS) {
    records.splice(MAX_RECORDS)
  }
}

export function getDashboardStats(): DashboardStats {
  const totalDocuments = records.length
  const totalEntitiesRemoved = records.reduce((sum, r) => sum + r.totalEntities, 0)

  const byType: Record<string, number> = {}
  for (const record of records) {
    for (const [type, count] of Object.entries(record.entityCounts)) {
      byType[type] = (byType[type] || 0) + count
    }
  }

  return {
    totalDocuments,
    totalEntitiesRemoved,
    byType,
    recentUploads: records.slice(0, 10),
  }
}
