/**
 * Turn API JSON `error` fields or thrown values into a plain string for toasts/UI.
 * Prevents Sonner from showing "[object Object]" when the payload is structured.
 */
export function formatApiErrorField(value: unknown, fallback: string): string {
  const s = errorToMessageString(value).trim()
  if (s === "" || s === "[object Object]") return fallback
  return s
}

function errorToMessageString(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (value instanceof Error) return value.message
  if (typeof value === "object") {
    const o = value as Record<string, unknown>
    if (typeof o.message === "string" && o.message.trim() !== "") return o.message
    if (typeof o.detail === "string" && o.detail.trim() !== "") return o.detail
    if (typeof o.error === "string") return o.error
    if (typeof o.error_description === "string") return o.error_description
    if (o.error != null && typeof o.error === "object") {
      const inner = errorToMessageString(o.error)
      if (inner) return inner
    }
    if (Array.isArray(o.details) && o.details.length > 0) {
      const first = o.details[0]
      if (typeof first === "string") return first
      if (first && typeof first === "object") {
        const msg = (first as { message?: unknown }).message
        if (typeof msg === "string") return msg
      }
    }
    try {
      const j = JSON.stringify(value)
      if (j && j !== "{}" && j !== "[]") return j.length > 280 ? `${j.slice(0, 280)}…` : j
    } catch {
      /* ignore */
    }
    return ""
  }
  return String(value)
}
