import type { SupabaseClient } from "@supabase/supabase-js"
import { getPlanLimits, type Plan } from "@/lib/limits"

function currentUsageMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

/** Read-only usage for dashboard — uses the signed-in user's client (no service role). */
export async function getDashboardUsage(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ used: number; limit: number; plan: Plan }> {
  const defaults = { used: 0, limit: 3, plan: "free" as Plan }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("plan, analyses_used, usage_month")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    console.error("dashboard profiles", error)
    return defaults
  }

  const plan = (profile?.plan ?? "free") as Plan
  const limits = getPlanLimits(plan)
  const month = currentUsageMonth()
  let used = profile?.analyses_used ?? 0
  if (!profile?.usage_month || profile.usage_month !== month) {
    used = 0
  }

  return { used, limit: limits.analyses, plan }
}
