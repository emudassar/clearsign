import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { chatWithContract, geminiErrorUserMessage } from "@/lib/gemini"
import { checkChatLimit } from "@/lib/limits"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const supabaseAuth = await createClient()
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = (await request.json()) as { contractId?: string; message?: string }
    const contractId = body.contractId?.trim()
    const message = body.message?.trim()
    if (!contractId || !message) {
      return NextResponse.json({ error: "contractId and message are required" }, { status: 400 })
    }

    const admin = createServiceClient()
    const { data: contract, error: cErr } = await admin
      .from("contracts")
      .select("id, user_id, raw_text")
      .eq("id", contractId)
      .maybeSingle()

    if (cErr || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    if (!contract.user_id) {
      return NextResponse.json(
        {
          error:
            "Clause chat is only available for contracts saved to your account. Sign in and re-run analysis while logged in.",
        },
        { status: 403 },
      )
    }

    if (contract.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const limits = await checkChatLimit(contractId, user.id)
    if (!limits.allowed) {
      return NextResponse.json(
        { error: "Chat question limit reached for this contract." },
        { status: 429 },
      )
    }

    const { data: historyRows } = await admin
      .from("chat_messages")
      .select("role, content")
      .eq("contract_id", contractId)
      .order("created_at", { ascending: true })

    const messages =
      historyRows?.map((m) => ({ role: m.role, content: m.content })) ?? []

    const reply = await chatWithContract(contract.raw_text, messages, message)

    await admin.from("chat_messages").insert([
      { contract_id: contractId, user_id: user.id, role: "user", content: message },
      { contract_id: contractId, user_id: user.id, role: "assistant", content: reply },
    ])

    return NextResponse.json({
      reply,
      used: limits.limit == null ? null : limits.used + 1,
      limit: limits.limit,
    })
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
