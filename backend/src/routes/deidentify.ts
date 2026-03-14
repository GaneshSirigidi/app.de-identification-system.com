import { Hono } from 'hono'
import { v4 as uuidv4 } from 'uuid'
import { extractText, isSupportedType } from '../services/ocr'
import { detectPHI } from '../services/phi-detector'
import { performRedaction, buildEntityCounts } from '../services/redactor'
import { saveRecord } from '../services/store'
import { DeidentifyResponse } from '../types'

const router = new Hono()

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

router.post('/deidentify', async (c) => {
  const startTime = Date.now()

  try {
    const contentType = c.req.header('content-type') || ''

    let text = ''
    let fileName = 'pasted-text.txt'
    let fileType = 'text/plain'

    if (contentType.includes('multipart/form-data')) {
      // File upload path
      const body = await c.req.parseBody()
      const file = body['file']

      if (!file || !(file instanceof File)) {
        return c.json({ error: 'No file provided. Use field name "file".' }, 400)
      }

      if (file.size > MAX_FILE_SIZE) {
        return c.json({ error: 'File exceeds 10 MB limit.' }, 400)
      }

      const mimeType = file.type || 'application/octet-stream'
      if (!isSupportedType(mimeType)) {
        return c.json(
          {
            error: `Unsupported file type: ${mimeType}. Supported: text/plain, application/pdf, image/png, image/jpeg, image/tiff`,
          },
          400,
        )
      }

      fileName = file.name
      fileType = mimeType
      const buffer = Buffer.from(await file.arrayBuffer())
      text = await extractText(buffer, mimeType)
    } else {
      // JSON / plain-text body path
      const body = await c.req.json().catch(() => null)
      if (!body || typeof body.text !== 'string') {
        return c.json({ error: 'Provide a "text" field in JSON body or upload a file.' }, 400)
      }
      text = body.text
      fileName = body.fileName || 'pasted-text.txt'
    }

    if (!text.trim()) {
      return c.json({ error: 'No text content could be extracted from the document.' }, 422)
    }

    if (text.length > 50000) {
      return c.json({ error: 'Document text exceeds 50,000 character limit.' }, 422)
    }

    // Detect PHI
    const entities = await detectPHI(text)

    // Redact
    const { redactedText, entityPositions } = performRedaction(text, entities)
    const entityCounts = buildEntityCounts(entityPositions)
    const totalEntities = Object.values(entityCounts).reduce((a, b) => a + b, 0)

    const id = uuidv4()
    const timestamp = new Date().toISOString()
    const processingTimeMs = Date.now() - startTime

    const report = {
      id,
      timestamp,
      fileName,
      fileType,
      totalEntities,
      byType: entityCounts,
      processingTimeMs,
      originalLength: text.length,
      redactedLength: redactedText.length,
    }

    // Persist for dashboard
    saveRecord({
      id,
      timestamp,
      fileName,
      fileType,
      entityCounts,
      totalEntities,
    })

    const response: DeidentifyResponse = {
      id,
      originalText: text,
      redactedText,
      entities: entityPositions,
      report,
    }

    return c.json(response)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    console.error('[/api/deidentify]', err)

    if (message.includes('API key') || message.includes('authentication')) {
      return c.json({ error: 'Invalid or missing GROQ_API_KEY.' }, 401)
    }
    if (message.includes('rate') || message.includes('overload')) {
      return c.json({ error: 'AI model is temporarily unavailable. Please retry.' }, 503)
    }

    return c.json({ error: message }, 500)
  }
})

export default router
