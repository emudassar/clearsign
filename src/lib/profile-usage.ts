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

function isMissingColumnError(error: { message?: string }): boolean {
  const msg = error.message ?? ""
  return msg.includes("does not exist") || msg.includes("PGRST204") || msg.includes("column")
}

/** Works when profiles table is missing optional columns (partial migrations). */
export async function fetchProfileUsage(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: ProfileUsageRow | null; hasUsageMonth: boolean; error: Error | null }> {
  const full = await supabase
    .from("profiles")
    .select("plan, analyses_used, usage_month")
    .eq("id", userId)
    .maybeSingle()

  if (!full.error) {
    return { data: full.data as ProfileUsageRow, hasUsageMonth: true, error: null }
  }
  if (!isMissingColumnError(full.error)) {
    return { data: null, hasUsageMonth: false, error: full.error }
  }

  const basic = await supabase
    .from("profiles")
    .select("plan, analyses_used")
    .eq("id", userId)
    .maybeSingle()

  if (!basic.error) {
    return { data: basic.data as ProfileUsageRow, hasUsageMonth: false, error: null }
  }
  if (!isMissingColumnError(basic.error)) {
    return { data: null, hasUsageMonth: false, error: basic.error }
  }

  const planOnly = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle()

  if (!planOnly.error) {
    return { data: planOnly.data as ProfileUsageRow, hasUsageMonth: false, error: null }
  }
  if (!isMissingColumnError(planOnly.error)) {
    return { data: null, hasUsageMonth: false, error: planOnly.error }
  }

  return { data: null, hasUsageMonth: false, error: null }
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
