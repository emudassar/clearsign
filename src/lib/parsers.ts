export async function parsePDF(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse")
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  try {
    const result = await parser.getText()
    return result.text ?? ""
  } finally {
    await parser.destroy()
  }
}

export async function parseDOCX(buffer: Buffer): Promise<string> {
  const mammoth = (await import("mammoth")).default
  const result = await mammoth.extractRawText({ buffer })
  return result.value ?? ""
}

export async function parseTXT(buffer: Buffer): Promise<string> {
  return buffer.toString("utf8")
}

const PDF_TYPES = new Set([
  "application/pdf",
  "application/x-pdf",
  "application/acrobat",
])

const DOCX_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])

const TXT_TYPES = new Set(["text/plain"])

export async function parseFile(buffer: Buffer, mimeType: string): Promise<string> {
  const normalized = mimeType.split(";")[0]?.trim().toLowerCase() ?? ""

  if (PDF_TYPES.has(normalized)) {
    return parsePDF(buffer)
  }
  if (DOCX_TYPES.has(normalized)) {
    return parseDOCX(buffer)
  }
  if (TXT_TYPES.has(normalized)) {
    return parseTXT(buffer)
  }

  throw new Error("Unsupported file type")
}
