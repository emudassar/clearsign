import { createServiceClient } from "@/lib/supabase/admin"

export type Plan = "free" | "solo" | "pro"

export function getPlanLimits(plan: string | null | undefined) {
  const p = (plan ?? "free") as Plan
  switch (p) {
    case "solo":
      return {
        analyses: 25,
        chat: Number.POSITIVE_INFINITY,
        storage: 50,
        pdfExport: true,
      }
    case "pro":
      return {
        analyses: 80,
        chat: Number.POSITIVE_INFINITY,
        storage: Number.POSITIVE_INFINITY,
        pdfExport: true,
      }
    default:
      return {
        analyses: 3,
        chat: 3,
        storage: 3,
        pdfExport: false,
      }
  }
}

function currentUsageMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export async function checkAnalysisLimit(userId: string) {
  const supabase = createServiceClient()
  const month = currentUsageMonth()

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("plan, analyses_used, usage_month")
    .eq("id", userId)
    .maybeSingle()

  if (error) throw error

  const plan = (profile?.plan ?? "free") as Plan
  const limits = getPlanLimits(plan)

  let used = profile?.analyses_used ?? 0
  if (!profile?.usage_month || profile.usage_month !== month) {
    used = 0
    await supabase
      .from("profiles")
      .update({ usage_month: month, analyses_used: 0 })
      .eq("id", userId)
  }

  return {
    allowed: used < limits.analyses,
    used,
    limit: limits.analyses,
    plan,
  }
}

export async function incrementAnalysisUsage(userId: string) {
  const supabase = createServiceClient()
  const month = currentUsageMonth()

  const { data: profile } = await supabase
    .from("profiles")
    .select("analyses_used, usage_month")
    .eq("id", userId)
    .maybeSingle()

  let base = profile?.analyses_used ?? 0
  if (!profile?.usage_month || profile.usage_month !== month) {
    base = 0
  }

  await supabase
    .from("profiles")
    .update({
      analyses_used: base + 1,
      usage_month: month,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
}

export async function checkChatLimit(contractId: string, userId: string) {
  const supabase = createServiceClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle()

  const limits = getPlanLimits(profile?.plan)
  if (!Number.isFinite(limits.chat)) {
    return { allowed: true, used: 0, limit: null as number | null }
  }

  const { count, error } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("contract_id", contractId)
    .eq("role", "user")

  if (error) throw error

  const used = count ?? 0
  return {
    allowed: used < limits.chat,
    used,
    limit: limits.chat,
  }
}

export async function checkStorageLimit(userId: string) {
  const supabase = createServiceClient()
  const limits = getPlanLimits(
    (await supabase.from("profiles").select("plan").eq("id", userId).maybeSingle())
      .data?.plan,
  )

  if (!Number.isFinite(limits.storage)) {
    return { allowed: true, used: 0, limit: limits.storage }
  }

  const { count, error } = await supabase
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  if (error) throw error

  const used = count ?? 0
  return {
    allowed: used < limits.storage,
    used,
    limit: limits.storage,
  }
}
