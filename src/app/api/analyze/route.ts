import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { parseFile } from "@/lib/parsers"
import { analyzeContract, geminiErrorUserMessage } from "@/lib/gemini"
import {
  checkAnalysisLimit,
  checkStorageLimit,
  incrementAnalysisUsage,
} from "@/lib/limits"
import type { ContractAnalysis } from "@/types/analysis"

export const runtime = "nodejs"

const MAX_BYTES = 20 * 1024 * 1024

const ALLOWED = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
])

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get("file")
    const party = String(form.get("party") ?? "").trim()
    if (!(file instanceof File) || !party) {
      return NextResponse.json({ error: "Missing file or party" }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 })
    }

    const mime = (file.type || "application/octet-stream").split(";")[0]?.trim() ?? ""
    if (!ALLOWED.has(mime)) {
      return NextResponse.json(
        { error: "Only PDF, DOCX, and TXT files are supported" },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const text = (await parseFile(buffer, mime)).trim()
    if (!text) {
      return NextResponse.json(
        { error: "Could not extract text from this file" },
        { status: 422 },
      )
    }

    const supabaseAuth = await createClient()
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (user) {
      const usage = await checkAnalysisLimit(user.id)
      if (!usage.allowed) {
        return NextResponse.json(
          { error: "Monthly analysis limit reached. Upgrade your plan to continue." },
          { status: 429 },
        )
      }
      const storage = await checkStorageLimit(user.id)
      if (!storage.allowed) {
        return NextResponse.json(
          { error: "Contract storage limit reached for your plan." },
          { status: 429 },
        )
      }
    }

    const analysis: ContractAnalysis = await analyzeContract(text, party)

    const admin = createServiceClient()
    const title = file.name || "Contract"

    const analysisStored = {
      ...analysis,
      _clearsign: { party, mime_type: mime },
    } as unknown as Record<string, unknown>

    const fullRow = {
      user_id: user?.id ?? null,
      title,
      party,
      mime_type: mime,
      raw_text: text,
      analysis: analysisStored,
    }

    const minimalRow = {
      user_id: user?.id ?? null,
      title,
      raw_text: text,
      analysis: analysisStored,
    }

    let { data: row, error: insertError } = await admin
      .from("contracts")
      .insert(fullRow)
      .select("id")
      .single()

    const colMismatch =
      insertError &&
      (insertError.code === "PGRST204" ||
        String(insertError.message).includes("schema cache") ||
        String(insertError.message).includes("column"))

    if (insertError && colMismatch) {
      ;({ data: row, error: insertError } = await admin
        .from("contracts")
        .insert(minimalRow)
        .select("id")
        .single())
    }

    if (insertError) {
      console.error(insertError)
      const hint =
        insertError.code === "PGRST204" ||
        String(insertError.message).includes("schema cache") ||
        String(insertError.message).includes("column")
          ? " Run the SQL in supabase/migrations/20260214130000_align_contracts_columns.sql in your Supabase SQL editor, then retry."
          : ""
      return NextResponse.json(
        { error: `Failed to save analysis: ${insertError.message}.${hint}` },
        { status: 500 },
      )
    }

    if (!row?.id) {
      return NextResponse.json({ error: "Failed to save analysis: no row id returned." }, { status: 500 })
    }

    if (user) {
      await incrementAnalysisUsage(user.id)
    }

    return NextResponse.json({ contractId: row.id, analysis })
  } catch (e) {
    console.error(e)
    const msg = geminiErrorUserMessage(e)
    const lower = msg.toLowerCase()
    const status =
      lower.includes("429") ||
      lower.includes("resource_exhausted") ||
      lower.includes("quota exceeded") ||
      lower.includes("quota")
        ? 429
        : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
