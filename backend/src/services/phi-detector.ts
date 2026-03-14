import Groq from 'groq-sdk'
import { PHIEntity } from '../types'

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const SYSTEM_PROMPT = `You are a HIPAA medical records de-identification specialist. Your job is to find ALL Protected Health Information (PHI) in clinical text according to the HIPAA Safe Harbor method (45 CFR § 164.514(b)).

You MUST return ONLY a valid JSON object — no markdown fences, no explanation, just raw JSON.

The 18 HIPAA identifiers to detect:
1. PATIENT_NAME — patient's own name (first, last, full, initials)
2. RELATIVE_NAME — names of relatives, household members, employers
3. PROVIDER_NAME — names of treating physicians, nurses, staff
4. GEO_LOCATION — street address, city, county, zip, anything smaller than state level
5. DATE — all dates except year (DOB, admission, discharge, procedure, follow-up)
6. AGE_OVER_89 — any age over 89 (use AGE_OVER_89 type)
7. PHONE — telephone numbers
8. FAX — fax numbers
9. EMAIL — email addresses
10. SSN — social security numbers
11. MRN — medical record numbers
12. HEALTH_PLAN_ID — health plan / insurance beneficiary numbers
13. ACCOUNT_NUMBER — account numbers
14. LICENSE_NUMBER — certificate or license numbers
15. VIN — vehicle identifiers, license plates
16. DEVICE_ID — device identifiers, serial numbers
17. URL — web URLs
18. IP_ADDRESS — IP addresses
19. BIOMETRIC — biometric identifiers (fingerprints, voice prints)
20. OTHER_ID — any other unique identifying number or code

Rules for synthetic replacements:
- PATIENT_NAME / RELATIVE_NAME / PROVIDER_NAME → use a common but clearly different name (e.g., "John Smith" → "Michael Turner")
- DATE → shift by roughly 2 years but preserve format (e.g., "03/15/2022" → "03/15/2024")
- PHONE → use (555) XXX-XXXX format
- SSN → use 000-XX-XXXX format
- MRN → use "MRN-" prefix + 6 random digits
- EMAIL → replace local part and use "example.com" domain
- GEO_LOCATION → use a clearly fictional address
- HEALTH_PLAN_ID / ACCOUNT_NUMBER → prefix with "ACCT-"
- All others → use a clearly fictional placeholder

Return exactly this JSON shape:
{
  "entities": [
    {
      "original": "exact verbatim text from document",
      "type": "PHI_TYPE_ENUM",
      "synthetic": "realistic replacement",
      "context": "one-line reason this is PHI"
    }
  ]
}

Be exhaustive — flag every occurrence. Do NOT redact medical terms, diagnoses, medications, lab values, or procedures.`

interface GroqResponse {
  entities: PHIEntity[]
}

export async function detectPHI(text: string): Promise<PHIEntity[]> {
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'

  // Chunk large texts to stay within token limits
  const MAX_CHARS = 12000
  if (text.length > MAX_CHARS) {
    return detectPHIChunked(text, MAX_CHARS)
  }

  return detectPHISingle(text, model)
}

async function detectPHISingle(text: string, model: string): Promise<PHIEntity[]> {
  const response = await client.chat.completions.create({
    model,
    max_tokens: 8192,
    temperature: 1,
    top_p: 1,
    stream: false as const,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Analyze this medical text and identify ALL PHI:\n\n"""\n${text}\n"""`,
      },
    ],
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from Groq')
  }

  return parseEntities(content)
}

async function detectPHIChunked(text: string, chunkSize: number): Promise<PHIEntity[]> {
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
  const chunks: string[] = []

  // Split on paragraph boundaries when possible
  let remaining = text
  while (remaining.length > 0) {
    if (remaining.length <= chunkSize) {
      chunks.push(remaining)
      break
    }
    // Find a good split point (paragraph or sentence boundary)
    const candidate = remaining.slice(0, chunkSize)
    const lastNewline = candidate.lastIndexOf('\n\n')
    const splitAt = lastNewline > chunkSize * 0.5 ? lastNewline : chunkSize
    chunks.push(remaining.slice(0, splitAt))
    remaining = remaining.slice(splitAt)
  }

  const results = await Promise.all(chunks.map((chunk) => detectPHISingle(chunk, model)))

  // Merge and deduplicate by original value
  const merged = new Map<string, PHIEntity>()
  for (const entities of results) {
    for (const entity of entities) {
      const key = entity.original.toLowerCase().trim()
      if (!merged.has(key)) {
        merged.set(key, entity)
      }
    }
  }

  return Array.from(merged.values())
}

function parseEntities(rawText: string): PHIEntity[] {
  // Strip any accidental markdown fences
  const cleaned = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim()

  // Extract first JSON object
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) {
    console.warn('[PHI Detector] No JSON object found in response')
    return []
  }

  try {
    const parsed: GroqResponse = JSON.parse(cleaned.slice(start, end + 1))
    return (parsed.entities || []).filter(
      (e) => e.original && e.original.trim().length > 0 && e.type && e.synthetic,
    )
  } catch (err) {
    console.error('[PHI Detector] JSON parse error:', err)
    return []
  }
}
