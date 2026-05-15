import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { buildAnalysisReportHtml } from "@/lib/export-analysis"
import { splitStoredAnalysis } from "@/lib/analysis-display"
import { getPlanLimits } from "@/lib/limits"

export async function POST(request: Request) {
  try {
    const supabaseAuth = await createClient()
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = (await request.json()) as { contractId?: string }
    const contractId = body.contractId?.trim()
    if (!contractId) {
      return NextResponse.json({ error: "contractId is required" }, { status: 400 })
    }

    const admin = createServiceClient()

    const { data: profile } = await admin
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle()

    const limits = getPlanLimits(profile?.plan)
    if (!limits.pdfExport) {
      return NextResponse.json(
        { error: "PDF export is available on Solo and Pro plans." },
        { status: 403 },
      )
    }

    const { data: contract, error } = await admin
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .maybeSingle()

    if (error || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    if (contract.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const row = contract as { title?: string | null; party?: string | null; analysis?: unknown }
    const { analysis } = splitStoredAnalysis(row.analysis, row.party)
    const title = row.title || "Contract"
    const html = buildAnalysisReportHtml(title, analysis)

    return NextResponse.json({ html })
  } catch (e) {
    console.error(e)
    const message = e instanceof Error ? e.message : "Unexpected error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
