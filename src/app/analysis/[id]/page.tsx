import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RiskGauge } from "@/components/risk-gauge"
import { ContractChatPanel } from "@/components/contract-chat-panel"
import { ExportAnalysisButton } from "@/components/export-analysis-button"
import { getPlanLimits } from "@/lib/limits"
import { splitStoredAnalysis } from "@/lib/analysis-display"

function severityStyles(sev: string) {
  if (sev === "HIGH") return "border-red-200 bg-red-50 text-red-800"
  if (sev === "MEDIUM") return "border-amber-200 bg-amber-50 text-amber-900"
  return "border-emerald-200 bg-emerald-50 text-emerald-900"
}

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: contractFromUser, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-[#1A3C5E]">Could not load analysis</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
        <Button asChild className="mt-8 bg-[#E8401C] text-white hover:bg-[#c73516]">
          <Link href="/analyze">Try again</Link>
        </Button>
      </div>
    )
  }

  let contract = contractFromUser

  if (!contract) {
    type AdminGate = "ok" | "not_found" | "sign_in" | "service_error"
    let adminGate: AdminGate = "ok"
    try {
      const admin = createServiceClient()
      const { data: peek } = await admin
        .from("contracts")
        .select("user_id")
        .eq("id", id)
        .maybeSingle()

      if (!peek) adminGate = "not_found"
      else if (peek.user_id != null) adminGate = "sign_in"
      else {
        const { data: full } = await admin.from("contracts").select("*").eq("id", id).maybeSingle()
        contract = full
        if (!contract) adminGate = "not_found"
      }
    } catch {
      adminGate = "service_error"
    }

    if (adminGate === "not_found") {
      return (
        <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
          <h1 className="text-2xl font-bold text-[#1A3C5E]">Analysis not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            There is no saved analysis for this link. Check the URL or run a new analysis.
          </p>
          <Button asChild className="mt-8 bg-[#E8401C] text-white hover:bg-[#c73516]">
            <Link href="/analyze">Upload a contract</Link>
          </Button>
        </div>
      )
    }
    if (adminGate === "sign_in") {
      return (
        <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
          <h1 className="text-2xl font-bold text-[#1A3C5E]">Sign in to view this analysis</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            This contract was saved to an account. Open the same site you used when uploading (for
            example <span className="rounded bg-muted px-1 font-mono text-xs">localhost</span> vs
            your LAN IP), sign in, then use your{" "}
            <Link className="font-medium text-[#E8401C]" href="/dashboard">
              dashboard
            </Link>{" "}
            or the original link while logged in.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild className="bg-[#1A3C5E] text-white hover:bg-[#15324d]">
              <Link href={`/login?next=/analysis/${id}`}>Sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/analyze">New analysis</Link>
            </Button>
          </div>
        </div>
      )
    }
    if (adminGate === "service_error") {
      return (
        <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
          <h1 className="text-2xl font-bold text-[#1A3C5E]">Analysis not available</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Could not verify this analysis. Check that{" "}
            <code className="rounded bg-muted px-1 text-xs">SUPABASE_SERVICE_ROLE_KEY</code> is set
            in <code className="rounded bg-muted px-1 text-xs">.env.local</code> for anonymous
            analyses, or sign in and open from your dashboard.
          </p>
        </div>
      )
    }
  }

  if (!contract) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-[#1A3C5E]">Analysis not available</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Something went wrong loading this page. Try again from{" "}
          <Link className="font-medium text-[#E8401C]" href="/dashboard">
            Dashboard
          </Link>{" "}
          or{" "}
          <Link className="font-medium text-[#E8401C]" href="/analyze">
            Analyze
          </Link>
          .
        </p>
      </div>
    )
  }

  const row = contract as { user_id?: string | null; party?: string | null; analysis?: unknown }
  const { analysis, partyLabel } = splitStoredAnalysis(row.analysis, row.party)

  const { data: profile } = user
    ? await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle()
    : { data: null }

  const limits = getPlanLimits(profile?.plan)
  const ownsContract = !!user && row.user_id === user.id
  const canExport = ownsContract && limits.pdfExport

  let initialMessages: { role: "user" | "assistant"; content: string }[] = []
  if (ownsContract) {
    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("contract_id", id)
      .order("created_at", { ascending: true })
    initialMessages =
      msgs?.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })) ?? []
  }

  let initialChatUsage: { used: number; limit: number } | null = null
  if (ownsContract && (profile?.plan ?? "free") === "free") {
    const { count } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("contract_id", id)
      .eq("role", "user")
    initialChatUsage = { used: count ?? 0, limit: 3 }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Analysis
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1A3C5E] sm:text-3xl">
            {contract.title ?? "Contract"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Perspective: {partyLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {analysis.contract_type}
          </Badge>
          {canExport ? (
            <ExportAnalysisButton contractId={contract.id} enabled={canExport} />
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <Card className="h-fit border-muted">
          <CardHeader>
            <CardTitle className="text-base">Risk score</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <RiskGauge score={analysis.risk_score} />
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-muted">
            <CardHeader>
              <CardTitle>Plain-language summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {analysis.summary}
              </p>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardHeader>
              <CardTitle>Key dates</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.key_dates?.length ? (
                <ul className="space-y-2 text-sm">
                  {analysis.key_dates.map((d) => (
                    <li key={`${d.label}-${d.date}`} className="flex flex-col sm:flex-row sm:gap-3">
                      <span className="font-medium text-[#1A3C5E]">{d.label}</span>
                      <span className="text-muted-foreground">{d.date}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No key dates identified.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardHeader>
              <CardTitle>Obligations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-[#1A3C5E]">Your obligations</p>
                  <Separator className="my-2" />
                  <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                    {analysis.obligations?.you?.length ? (
                      analysis.obligations.you.map((o) => <li key={o}>{o}</li>)
                    ) : (
                      <li>None listed.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A3C5E]">Their obligations</p>
                  <Separator className="my-2" />
                  <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                    {analysis.obligations?.them?.length ? (
                      analysis.obligations.them.map((o) => <li key={o}>{o}</li>)
                    ) : (
                      <li>None listed.</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardHeader>
              <CardTitle>Red flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.red_flags?.length ? (
                analysis.red_flags.map((f, idx) => (
                  <details
                    key={`${f.clause}-${idx}`}
                    className={`rounded-xl border px-4 py-3 ${severityStyles(f.severity)}`}
                  >
                    <summary className="cursor-pointer list-none font-medium [&::-webkit-details-marker]:hidden">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>{f.clause}</span>
                        <Badge variant="outline" className="border-current text-xs uppercase">
                          {f.severity}
                        </Badge>
                      </div>
                    </summary>
                    <div className="mt-3 space-y-2 text-sm">
                      <p>{f.explanation}</p>
                      <p>
                        <span className="font-semibold">Suggestion:</span> {f.suggestion}
                      </p>
                    </div>
                  </details>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No red flags returned.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardHeader>
              <CardTitle>Questions to ask</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                {analysis.questions_to_ask?.map((q, i) => <li key={i}>{q}</li>) ?? null}
              </ul>
            </CardContent>
          </Card>

          <div
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="note"
          >
            ClearSign provides AI-generated analysis for informational purposes only. This is
            NOT legal advice. Always consult a qualified attorney before signing any contract.
          </div>

          {!user ? (
            <p className="text-center text-sm text-muted-foreground">
              Want clause chat and saved history?{" "}
              <Link className="font-medium text-[#E8401C]" href="/login">
                Sign in
              </Link>
            </p>
          ) : null}
          {user && !ownsContract ? (
            <p className="text-center text-sm text-muted-foreground">
              Clause chat is available for contracts analyzed while signed in.{" "}
              <Link className="font-medium text-[#E8401C]" href="/analyze">
                Upload again
              </Link>
            </p>
          ) : null}
        </div>
      </div>

      <ContractChatPanel
        key={contract.id}
        contractId={contract.id}
        initialMessages={initialMessages}
        chatEnabled={ownsContract}
        userPresent={!!user}
        initialChatUsage={initialChatUsage}
      />
    </div>
  )
}
