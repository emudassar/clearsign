import crypto from "crypto"
import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/admin"
import type { Plan } from "@/lib/limits"

export const runtime = "nodejs"

function verifySignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false
  const hmac = crypto.createHmac("sha256", secret)
  hmac.update(rawBody)
  const digest = Buffer.from(hmac.digest("hex"), "utf8")
  const incoming = Buffer.from(signature, "utf8")
  if (incoming.length !== digest.length) return false
  return crypto.timingSafeEqual(incoming, digest)
}

function variantToPlan(variantId: string | undefined): Plan | null {
  if (!variantId) return null
  const solo = process.env.LEMONSQUEEZY_SOLO_VARIANT_ID
  const pro = process.env.LEMONSQUEEZY_PRO_VARIANT_ID
  if (solo && variantId === solo) return "solo"
  if (pro && variantId === pro) return "pro"
  return null
}

function extractVariantId(body: Record<string, unknown>): string | undefined {
  const included = body.included as
    | { type?: string; attributes?: { variant_id?: number } }[]
    | undefined
  const item = included?.find((i) => i.type === "subscription-items")
  if (item?.attributes?.variant_id != null) {
    return String(item.attributes.variant_id)
  }
  const attrs = (body.data as { attributes?: Record<string, unknown> } | undefined)
    ?.attributes
  if (attrs?.variant_id != null) return String(attrs.variant_id)
  return undefined
}

function extractUserId(body: Record<string, unknown>): string | undefined {
  const meta = body.meta as { custom_data?: Record<string, string> } | undefined
  const fromMeta = meta?.custom_data?.user_id
  if (fromMeta) return fromMeta
  const top = body.meta as { user_id?: string } | undefined
  return top?.user_id
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET

  if (secret) {
    const signature = request.headers.get("x-signature")
    if (!verifySignature(rawBody, signature, secret)) {
      return new NextResponse("Invalid signature", { status: 401 })
    }
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 })
  }

  const eventName = (body.meta as { event_name?: string } | undefined)?.event_name
  const userId = extractUserId(body)

  if (!userId) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const admin = createServiceClient()

  if (
    eventName === "subscription_cancelled" ||
    eventName === "subscription_expired"
  ) {
    await admin
      .from("profiles")
      .update({ plan: "free", updated_at: new Date().toISOString() })
      .eq("id", userId)
    return NextResponse.json({ ok: true })
  }

  if (
    eventName === "subscription_created" ||
    eventName === "subscription_updated"
  ) {
    const attrs = (body.data as { attributes?: Record<string, unknown> } | undefined)
      ?.attributes
    const status = String(attrs?.status ?? "").toLowerCase()
    if (status === "cancelled" || status === "expired" || status === "unpaid") {
      await admin
        .from("profiles")
        .update({ plan: "free", updated_at: new Date().toISOString() })
        .eq("id", userId)
      return NextResponse.json({ ok: true })
    }

    const variantId = extractVariantId(body)
    const plan = variantToPlan(variantId)
    if (plan) {
      await admin
        .from("profiles")
        .update({ plan, updated_at: new Date().toISOString() })
        .eq("id", userId)
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true, ignored: eventName })
}
