import { createWorker } from 'tesseract.js'

export type SupportedMimeType =
  | 'text/plain'
  | 'application/pdf'
  | 'image/png'
  | 'image/jpeg'
  | 'image/jpg'
  | 'image/tiff'
  | 'image/bmp'
  | 'image/webp'

export const SUPPORTED_TYPES: SupportedMimeType[] = [
  'text/plain',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/tiff',
  'image/bmp',
  'image/webp',
]

export function isSupportedType(mimeType: string): mimeType is SupportedMimeType {
  return SUPPORTED_TYPES.includes(mimeType as SupportedMimeType)
}

export async function extractText(buffer: Buffer, mimeType: SupportedMimeType): Promise<string> {
  switch (mimeType) {
    case 'text/plain':
      return buffer.toString('utf-8')

    case 'application/pdf':
      return extractPdfText(buffer)

    case 'image/png':
    case 'image/jpeg':
    case 'image/jpg':
    case 'image/tiff':
    case 'image/bmp':
    case 'image/webp':
      return extractImageText(buffer)

    default:
      throw new Error(`Unsupported MIME type: ${mimeType}`)
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid test file creation issue with pdf-parse
  const pdfParse = await import('pdf-parse')
  const fn = (pdfParse as any).default ?? pdfParse
  const data = await fn(buffer)
  return data.text?.trim() || ''
}

async function extractImageText(buffer: Buffer): Promise<string> {
  const worker = await createWorker('eng', 1, {
    logger: () => {}, // suppress logs
    errorHandler: (err: unknown) => console.error('[Tesseract]', err),
  })

  try {
    const {
      data: { text },
    } = await worker.recognize(buffer)
    return text?.trim() || ''
  } finally {
    await worker.terminate()
  }
}
