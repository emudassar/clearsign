import { GoogleGenerativeAI } from "@google/generative-ai"
import { formatApiErrorField } from "@/lib/api-error-message"
import type { ContractAnalysis } from "@/types/analysis"

const apiKey = process.env.GOOGLE_AI_API_KEY

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Tried in order until one succeeds. Override with GEMINI_MODEL (single model, no fallback).
 * Put lighter / older models first — gemini-2.5-flash often returns 503 under load.
 */
function modelCandidates(): string[] {
  const explicit = process.env.GEMINI_MODEL?.trim()
  if (explicit) return [explicit]

  return [
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash",
  ]
}

function getGenAI() {
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not set")
  }
  return new GoogleGenerativeAI(apiKey)
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function shouldTryNextModel(err: unknown): boolean {
  const msg = errorMessage(err).toLowerCase()
  return (
    msg.includes("429") ||
    msg.includes("503") ||
    msg.includes("502") ||
    msg.includes("500") ||
    msg.includes("404") ||
    msg.includes("resource_exhausted") ||
    msg.includes("high demand") ||
    msg.includes("unavailable") ||
    msg.includes("overloaded") ||
    msg.includes("quota") ||
    msg.includes("quota exceeded")
  )
}

const ANALYSIS_SCHEMA_INSTRUCTION = `You must respond with valid JSON only (no markdown) matching this TypeScript shape:
{
  "contract_type": string,
  "summary": string,
  "risk_score": number,
  "key_dates": { "label": string, "date": string }[],
  "obligations": { "you": string[], "them": string[] },
  "red_flags": { "clause": string, "severity": "HIGH"|"MEDIUM"|"LOW", "explanation": string, "suggestion": string }[],
  "questions_to_ask": string[]
}
Rules:
- risk_score is 0-10 where 10 is most risky for the stated party perspective.
- obligations.you = duties/risk mainly falling on the stated party; obligations.them = the other side.
- key_dates: include renewal, termination notice, effective dates when present; use ISO-like dates or "Unknown" if unclear.
- red_flags: concrete clause titles/snippets, ordered by severity.
- questions_to_ask: 3-7 practical questions for the other party.`

export async function analyzeContract(
  text: string,
  party: string,
): Promise<ContractAnalysis> {
  const genAI = getGenAI()
  const trimmed = text.length > 300_000 ? text.slice(0, 300_000) : text

  const prompt = `You are ClearSign, an AI contract explainer for non-lawyers.
Party perspective (the person uploading): ${party}

${ANALYSIS_SCHEMA_INSTRUCTION}

Contract text:
"""
${trimmed}
"""`

  const models = modelCandidates()
  let lastError: unknown = null

  for (let i = 0; i < models.length; i++) {
    const modelId = models[i]!
    try {
      const model = genAI.getGenerativeModel({
        model: modelId,
        generationConfig: {
          responseMimeType: "application/json",
        },
      })
      const result = await model.generateContent(prompt)
      const raw = result.response.text()
      return JSON.parse(raw) as ContractAnalysis
    } catch (e) {
      lastError = e
      const hasNext = i < models.length - 1
      if (shouldTryNextModel(e) && hasNext) {
        const msg = errorMessage(e).toLowerCase()
        if (msg.includes("503") || msg.includes("high demand")) {
          await sleep(600)
        }
        continue
      }
      throw e
    }
  }

  throw lastError ?? new Error("No Gemini model succeeded")
}

export async function chatWithContract(
  contractText: string,
  messages: { role: string; content: string }[],
  newMessage: string,
): Promise<string> {
  const genAI = getGenAI()
  const trimmed =
    contractText.length > 200_000 ? contractText.slice(0, 200_000) : contractText

  const transcript = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n")

  const prompt = `You are ClearSign. Answer clearly in plain English. This is not legal advice.
Use the contract as context. If unsure, say what is unknown and what to verify with an attorney.

Contract:
"""
${trimmed}
"""

Prior messages:
${transcript || "(none)"}

user: ${newMessage}

assistant:`

  const models = modelCandidates()
  let lastError: unknown = null

  for (let i = 0; i < models.length; i++) {
    const modelId = models[i]!
    try {
      const model = genAI.getGenerativeModel({ model: modelId })
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (e) {
      lastError = e
      const hasNext = i < models.length - 1
      if (shouldTryNextModel(e) && hasNext) {
        const msg = errorMessage(e).toLowerCase()
        if (msg.includes("503") || msg.includes("high demand")) {
          await sleep(600)
        }
        continue
      }
      throw e
    }
  }

  throw lastError ?? new Error("No Gemini model succeeded")
}

/** User-facing hint when Google returns quota / capacity errors */
export function geminiErrorUserMessage(err: unknown): string {
  const text = formatApiErrorField(err, "").trim()
  const probe = text.toLowerCase()
  if (
    probe.includes("503") ||
    probe.includes("high demand") ||
    probe.includes("unavailable") ||
    probe.includes("overloaded")
  ) {
    return (
      "The AI service is busy right now (high demand). Wait a minute and try again — " +
      "we automatically try other Gemini models when one is overloaded."
    )
  }
  if (
    probe.includes("429") ||
    probe.includes("resource_exhausted") ||
    probe.includes("quota exceeded") ||
    probe.includes("quota")
  ) {
    return (
      "Gemini API quota was exceeded for your key (free tier limits, or rate limit). " +
      "Wait a minute and retry, set GEMINI_MODEL in .env.local to another Flash model, " +
      "or enable billing for your Google AI project. See https://ai.google.dev/gemini-api/docs/rate-limits"
    )
  }
  return text || "Something went wrong while talking to the AI. Please try again."
}
