export type RedFlagSeverity = "HIGH" | "MEDIUM" | "LOW"

export type ContractAnalysis = {
  contract_type: string
  summary: string
  risk_score: number
  key_dates: { label: string; date: string }[]
  obligations: { you: string[]; them: string[] }
  red_flags: {
    clause: string
    severity: RedFlagSeverity
    explanation: string
    suggestion: string
  }[]
  questions_to_ask: string[]
}
