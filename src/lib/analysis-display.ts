import type { ContractAnalysis } from "@/types/analysis"

type ClearsignMeta = { party?: string; mime_type?: string }

/** Stored analysis may include `_clearsign` from our API; strip for model-shaped data. */
export function splitStoredAnalysis(
  stored: unknown,
  rowParty?: string | null,
): { analysis: ContractAnalysis; partyLabel: string } {
  const obj = (stored ?? {}) as Record<string, unknown>
  const meta = obj._clearsign as ClearsignMeta | undefined
  const fromRow = rowParty != null ? String(rowParty).trim() : ""
  const fromMeta = meta?.party != null ? String(meta.party).trim() : ""
  const partyLabel = fromRow || fromMeta || "Not specified"
  const rest = { ...obj }
  delete rest._clearsign
  return { analysis: rest as ContractAnalysis, partyLabel }
}
