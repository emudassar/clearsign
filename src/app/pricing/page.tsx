import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { buildLemonCheckoutUrl } from "@/lib/checkout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

const navy = "#1A3C5E"
const orange = "#E8401C"

const features = [
  { label: "Analyses / month", free: "3", solo: "25", pro: "80" },
  { label: "Chat questions", free: "3 per contract", solo: "Unlimited", pro: "Unlimited" },
  { label: "Saved contracts", free: "3", solo: "50", pro: "Unlimited" },
  { label: "Export analysis PDF", free: "—", solo: "Included", pro: "Included" },
]

export default async function PricingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const soloVariant = process.env.LEMONSQUEEZY_SOLO_VARIANT_ID ?? ""
  const proVariant = process.env.LEMONSQUEEZY_PRO_VARIANT_ID ?? ""

  const soloUrl = buildLemonCheckoutUrl(soloVariant, user?.id)
  const proUrl = buildLemonCheckoutUrl(proVariant, user?.id)

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: navy }}>
          Simple pricing
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          USD pricing for individuals and growing teams. Start free, upgrade when ClearSign
          becomes part of your workflow.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <Card className="border-muted">
          <CardHeader>
            <CardTitle className="text-2xl">Free</CardTitle>
            <p className="text-4xl font-extrabold" style={{ color: navy }}>
              $0
            </p>
            <p className="text-sm text-muted-foreground">Forever</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                3 analyses / month
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                3 chat questions per saved contract
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                3 saved contracts
              </li>
            </ul>
            <Button asChild className="w-full" variant="outline" style={{ borderColor: navy, color: navy }}>
              <Link href="/analyze">Get started</Link>
            </Button>
          </CardContent>
        </Card>

        <Card
          className="relative border-2 shadow-xl"
          style={{ borderColor: orange, boxShadow: `0 18px 60px ${navy}14` }}
        >
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: orange }}
          >
            Most popular
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">Solo</CardTitle>
            <p className="text-4xl font-extrabold" style={{ color: navy }}>
              $9
            </p>
            <p className="text-sm text-muted-foreground">per month</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                25 analyses / month
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                Unlimited chat
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                50 saved contracts + PDF export
              </li>
            </ul>
            {soloUrl ? (
              <Button asChild className="w-full text-white" style={{ backgroundColor: orange }}>
                <a href={soloUrl}>Subscribe</a>
              </Button>
            ) : (
              <Button asChild variant="outline" className="w-full">
                <Link href="/signup">Create account and set store subdomain</Link>
              </Button>
            )}
            {!soloUrl ? (
              <p className="text-xs text-muted-foreground">
                Set <code className="rounded bg-muted px-1">NEXT_PUBLIC_LEMONSQUEEZY_STORE_SUBDOMAIN</code>{" "}
                and variant IDs in env to enable checkout links.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader>
            <CardTitle className="text-2xl">Pro</CardTitle>
            <p className="text-4xl font-extrabold" style={{ color: navy }}>
              $19
            </p>
            <p className="text-sm text-muted-foreground">per month</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                80 analyses / month
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                Unlimited chat
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                Unlimited contracts + PDF export
              </li>
            </ul>
            {proUrl ? (
              <Button asChild className="w-full bg-[#1A3C5E] text-white hover:bg-[#15324d]">
                <a href={proUrl}>Subscribe</a>
              </Button>
            ) : (
              <Button asChild variant="outline" className="w-full">
                <Link href="/signup">Create account</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-16 overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-4 py-3 font-semibold">Feature</th>
              <th className="px-4 py-3 font-semibold">Free</th>
              <th className="px-4 py-3 font-semibold">
                Solo <Badge className="ml-2 bg-[#E8401C] text-white">Popular</Badge>
              </th>
              <th className="px-4 py-3 font-semibold">Pro</th>
            </tr>
          </thead>
          <tbody>
            {features.map((row) => (
              <tr key={row.label} className="border-t">
                <td className="px-4 py-3 font-medium">{row.label}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.free}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.solo}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
