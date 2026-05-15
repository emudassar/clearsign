import type { SupabaseClient } from "@supabase/supabase-js"
import { getPlanLimits, type Plan } from "@/lib/limits"
import {
  effectiveAnalysesUsed,
  fetchProfileUsage,
  planFromProfile,
} from "@/lib/profile-usage"

/** Read-only usage for dashboard — uses the signed-in user's client (no service role). */
export async function getDashboardUsage(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ used: number; limit: number; plan: Plan }> {
  const defaults = { used: 0, limit: 3, plan: "free" as Plan }

  const { data: profile, hasUsageMonth, error } = await fetchProfileUsage(supabase, userId)

  if (error) {
    console.error("dashboard profiles", error)
    return defaults
  }

  const plan = planFromProfile(profile)
  const limits = getPlanLimits(plan)
  const used = effectiveAnalysesUsed(profile, hasUsageMonth)

  return { used, limit: limits.analyses, plan }
}
