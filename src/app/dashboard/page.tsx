import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { checkAnalysisLimit } from "@/lib/limits"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ContractAnalysis } from "@/types/analysis"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const [{ data: contracts }, usage] = await Promise.all([
    supabase
      .from("contracts")
      .select("id, title, analysis, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    checkAnalysisLimit(user.id),
  ])

  const rows = contracts ?? []

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1A3C5E]">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Your saved contract analyses.</p>
        </div>
        <Button asChild className="bg-[#E8401C] text-white hover:bg-[#c73516]">
          <Link href="/analyze">New analysis</Link>
        </Button>
      </div>

      <Card className="mt-8 border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Usage this month</CardTitle>
          <CardDescription>
            {usage.used}/{usage.limit} analyses used
            {usage.plan === "free" ? (
              <>
                {" "}
                ·{" "}
                <Link className="font-medium text-[#E8401C]" href="/pricing">
                  Upgrade for more
                </Link>
              </>
            ) : null}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {rows.length === 0 ? (
          <Card className="border-dashed sm:col-span-2">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No saved contracts yet.{" "}
              <Link className="font-medium text-[#E8401C]" href="/analyze">
                Run your first analysis
              </Link>
              .
            </CardContent>
          </Card>
        ) : (
          rows.map((c) => {
            const a = c.analysis as unknown as ContractAnalysis
            const risk = a.risk_score ?? 0
            const riskVariant =
              risk >= 8 ? "destructive" : risk >= 5 ? "secondary" : "default"
            return (
              <Link key={c.id} href={`/analysis/${c.id}`} className="block">
                <Card className="h-full border-muted transition-shadow hover:shadow-md">
                  <CardHeader className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="line-clamp-2 text-lg">
                        {c.title ?? "Untitled contract"}
                      </CardTitle>
                      <Badge variant="outline">{a.contract_type ?? "Contract"}</Badge>
                    </div>
                    <CardDescription>
                      {new Date(c.created_at ?? "").toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    <Badge variant={riskVariant}>Risk {risk}/10</Badge>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
