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

/** Safe summary for dashboard cards when stored analysis shape varies. */
export function contractCardSummary(stored: unknown): {
  contract_type: string
  risk_score: number
} {
  try {
    const { analysis } = splitStoredAnalysis(stored)
    const riskRaw = analysis.risk_score
    const risk_score =
      typeof riskRaw === "number" && !Number.isNaN(riskRaw)
        ? riskRaw
        : typeof riskRaw === "string"
          ? Number(riskRaw) || 0
          : 0
    const contract_type =
      typeof analysis.contract_type === "string" && analysis.contract_type.trim() !== ""
        ? analysis.contract_type
        : "Contract"
    return { contract_type, risk_score }
  } catch {
    return { contract_type: "Contract", risk_score: 0 }
  }
}
