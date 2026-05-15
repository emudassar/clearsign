import type { SupabaseClient } from "@supabase/supabase-js"
import type { Plan } from "@/lib/limits"

export type ProfileUsageRow = {
  plan?: string | null
  analyses_used?: number | null
  usage_month?: string | null
}

function currentUsageMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

/** Works even when usage_month column is missing (older Supabase schemas). */
export async function fetchProfileUsage(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: ProfileUsageRow | null; hasUsageMonth: boolean; error: Error | null }> {
  const withMonth = await supabase
    .from("profiles")
    .select("plan, analyses_used, usage_month")
    .eq("id", userId)
    .maybeSingle()

  if (!withMonth.error) {
    return { data: withMonth.data, hasUsageMonth: true, error: null }
  }

  const msg = withMonth.error.message ?? ""
  if (!msg.includes("usage_month")) {
    return { data: null, hasUsageMonth: false, error: withMonth.error }
  }

  const basic = await supabase
    .from("profiles")
    .select("plan, analyses_used")
    .eq("id", userId)
    .maybeSingle()

  if (basic.error) {
    return { data: null, hasUsageMonth: false, error: basic.error }
  }

  return { data: basic.data, hasUsageMonth: false, error: null }
}

export function effectiveAnalysesUsed(
  profile: ProfileUsageRow | null,
  hasUsageMonth: boolean,
): number {
  const raw = profile?.analyses_used ?? 0
  if (!hasUsageMonth) return raw
  const month = currentUsageMonth()
  if (!profile?.usage_month || profile.usage_month !== month) return 0
  return raw
}

export function planFromProfile(profile: ProfileUsageRow | null): Plan {
  return (profile?.plan ?? "free") as Plan
}
