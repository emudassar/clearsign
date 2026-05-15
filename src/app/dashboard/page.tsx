import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getDashboardUsage } from "@/lib/dashboard-usage"
import { splitStoredAnalysis } from "@/lib/analysis-display"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/dashboard")
  }

  const [{ data: contracts, error: contractsError }, usage] = await Promise.all([
    supabase
      .from("contracts")
      .select("id, title, analysis, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    getDashboardUsage(supabase, user.id),
  ])

  if (contractsError) {
    console.error("dashboard contracts", contractsError)
  }

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

      {contractsError ? (
        <p className="mt-4 text-sm text-amber-800">
          Could not load saved contracts. Try again or run a new analysis.
        </p>
      ) : null}

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
            const { analysis: a } = splitStoredAnalysis(c.analysis)
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
