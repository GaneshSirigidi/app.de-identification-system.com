import { PHIEntity, PHIEntityWithPosition } from '../types'

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function deduplicateEntities(entities: PHIEntity[]): PHIEntity[] {
  const seen = new Map<string, PHIEntity>()
  for (const entity of entities) {
    const key = entity.original.toLowerCase().trim()
    if (key && !seen.has(key)) {
      seen.set(key, entity)
    }
  }
  return Array.from(seen.values())
}

export interface RedactionResult {
  redactedText: string
  entityPositions: PHIEntityWithPosition[]
}

export function performRedaction(text: string, entities: PHIEntity[]): RedactionResult {
  const unique = deduplicateEntities(entities)

  // Build consistent replacement map (original_lower → synthetic)
  const replacementMap = new Map<string, string>()
  for (const entity of unique) {
    replacementMap.set(entity.original.toLowerCase().trim(), entity.synthetic)
  }

  // Find all positions of each entity in original text
  const allPositions: PHIEntityWithPosition[] = []
  for (const entity of unique) {
    if (!entity.original.trim()) continue
    const regex = new RegExp(escapeRegExp(entity.original), 'gi')
    let match: RegExpExecArray | null
    let occurrences = 0
    let firstStart = -1
    let firstEnd = -1

    while ((match = regex.exec(text)) !== null) {
      occurrences++
      if (firstStart === -1) {
        firstStart = match.index
        firstEnd = match.index + match[0].length
      }
    }

    if (firstStart !== -1) {
      allPositions.push({
        ...entity,
        start: firstStart,
        end: firstEnd,
        occurrences,
      })
    }
  }

  // Sort by start position
  allPositions.sort((a, b) => a.start - b.start)

  // Remove overlapping entities (keep the first/longer one)
  const nonOverlapping: PHIEntityWithPosition[] = []
  let lastEnd = 0
  for (const pos of allPositions) {
    if (pos.start >= lastEnd) {
      nonOverlapping.push(pos)
      lastEnd = pos.end
    }
  }

  // Apply all replacements globally (sort by length desc to avoid partial replacements)
  const sortedByLength = [...unique].sort((a, b) => b.original.length - a.original.length)
  let redactedText = text

  for (const entity of sortedByLength) {
    if (!entity.original.trim()) continue
    const synthetic = replacementMap.get(entity.original.toLowerCase().trim()) || entity.synthetic
    const regex = new RegExp(escapeRegExp(entity.original), 'gi')
    redactedText = redactedText.replace(regex, synthetic)
  }

  return { redactedText, entityPositions: nonOverlapping }
}

export function buildEntityCounts(entities: PHIEntityWithPosition[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const entity of entities) {
    counts[entity.type] = (counts[entity.type] || 0) + entity.occurrences
  }
  return counts
}
