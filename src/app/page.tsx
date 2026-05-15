import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Gauge,
  MessageSquare,
  Shield,
  Sparkles,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const navy = "#1A3C5E"
const orange = "#E8401C"

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section
        className="relative overflow-hidden text-white"
        style={{ backgroundColor: navy }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div
            className="absolute -right-24 -top-24 size-72 rounded-full blur-3xl"
            style={{ backgroundColor: orange }}
          />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 sm:py-24 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-6">
            <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
              AI contract clarity
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Understand Any Contract in 60 Seconds
            </h1>
            <p className="text-lg text-white/85 sm:text-xl">
              Upload your PDF, Word, or text agreement and get a plain-English summary, risk
              score, red flags, and negotiation-ready questions — before you sign.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="text-base font-semibold text-white shadow-lg"
                style={{ backgroundColor: orange }}
              >
                <Link href="/analyze">
                  Upload a contract
                  <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/40 bg-transparent text-white hover:bg-white/10"
              >
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
            <p className="text-sm text-white/70">
              No credit card required to try. Built for freelancers, tenants, employees, and
              small businesses.
            </p>
          </div>
          <Card className="w-full max-w-md border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">What you get instantly</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-white/90">
              <div className="flex gap-2">
                <Gauge className="mt-0.5 size-4 shrink-0" />
                <span>Risk score with plain-language context</span>
              </div>
              <div className="flex gap-2">
                <Shield className="mt-0.5 size-4 shrink-0" />
                <span>Red flags ranked by severity with suggestions</span>
              </div>
              <div className="flex gap-2">
                <MessageSquare className="mt-0.5 size-4 shrink-0" />
                <span>Follow-up clause chat on paid tiers</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: navy }}>
            How it works
          </h2>
          <p className="mt-3 text-muted-foreground">
            Three simple steps from upload to confident signing.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Upload",
              desc: "Drag-and-drop PDF, DOCX, or TXT — up to 20MB.",
              icon: Upload,
            },
            {
              title: "AI analyzes",
              desc: "ClearSign reads clauses, dates, and obligations from your perspective.",
              icon: Sparkles,
            },
            {
              title: "Get a clear report",
              desc: "See risk, red flags, and questions to ask — saveable in your dashboard.",
              icon: FileText,
            },
          ].map((s) => (
            <Card key={s.title} className="border-muted">
              <CardHeader className="space-y-3">
                <div
                  className="inline-flex size-11 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: navy }}
                >
                  <s.icon className="size-5" />
                </div>
                <CardTitle className="text-xl">{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{s.desc}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: navy }}>
              Built to be different
            </h2>
            <p className="mt-3 text-muted-foreground">
              Six reasons people choose ClearSign over skimming legalese at midnight.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Party-aware summaries",
                body: "Context for employees, tenants, freelancers, and owners — not generic boilerplate.",
              },
              {
                title: "Negotiation-ready red flags",
                body: "Each flag includes severity and a practical suggestion for what to push back on.",
              },
              {
                title: "Plain-language chat",
                body: "Ask follow-ups about confusing clauses with the full contract in context.",
              },
              {
                title: "Fast, calm UX",
                body: "Progress cues and readable typography so the experience feels trustworthy.",
              },
              {
                title: "Saved analyses",
                body: "Return anytime from your dashboard — no more digging through email threads.",
              },
              {
                title: "Exportable reports (Solo+)",
                body: "Print a branded HTML report to PDF for your records or advisor review.",
              },
            ].map((f) => (
              <Card key={f.title} className="h-full border-muted bg-background">
                <CardHeader>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{f.body}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: navy }}>
            Pricing
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start free. Upgrade when contracts become a monthly habit.
          </p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {[
            {
              name: "Free",
              price: "$0",
              blurb: "Try ClearSign on real agreements.",
              features: ["3 analyses / month", "3 chat questions / contract", "3 saved contracts"],
              cta: { href: "/analyze", label: "Start free" },
              highlight: false,
            },
            {
              name: "Solo",
              price: "$9",
              blurb: "For individuals signing often.",
              features: [
                "25 analyses / month",
                "Unlimited chat",
                "50 saved contracts",
                "Export analysis to PDF",
              ],
              cta: { href: "/pricing", label: "Upgrade on pricing" },
              highlight: true,
            },
            {
              name: "Pro",
              price: "$19",
              blurb: "For heavier contract volume.",
              features: [
                "80 analyses / month",
                "Unlimited chat",
                "Unlimited saved contracts",
                "Export analysis to PDF",
              ],
              cta: { href: "/pricing", label: "Upgrade on pricing" },
              highlight: false,
            },
          ].map((tier) => (
            <Card
              key={tier.name}
              className={`relative flex flex-col border-muted ${
                tier.highlight ? "border-2 shadow-lg" : ""
              }`}
              style={
                tier.highlight
                  ? { borderColor: orange, boxShadow: `0 18px 60px ${navy}14` }
                  : undefined
              }
            >
              {tier.highlight ? (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: orange }}
                >
                  Most popular
                </div>
              ) : null}
              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <div className="flex items-baseline gap-2">
                  <div className="text-4xl font-extrabold" style={{ color: navy }}>
                    {tier.price}
                  </div>
                  <div className="text-sm text-muted-foreground">/ month</div>
                </div>
                <p className="text-sm text-muted-foreground">{tier.blurb}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <ul className="space-y-2 text-sm">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="mt-auto w-full"
                  variant={tier.highlight ? "default" : "outline"}
                  style={
                    tier.highlight
                      ? { backgroundColor: orange, color: "white" }
                      : { borderColor: navy, color: navy }
                  }
                >
                  <Link href={tier.cta.href}>{tier.cta.label}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: navy }}>
              What people say
            </h2>
            <p className="mt-3 text-muted-foreground">
              Early feedback from freelancers and renters (illustrative testimonials).
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  "I finally understood my client’s NDA without spending an hour on Google. The red flags were scarily accurate.",
                name: "Jordan M.",
                role: "Freelance designer",
              },
              {
                quote:
                  "My lease looked fine until ClearSign flagged the early-termination section. I negotiated cleaner language the same day.",
                name: "Priya K.",
                role: "Tenant",
              },
              {
                quote:
                  "We sign vendor agreements weekly. ClearSign is the first pass before anything hits counsel — saves time and money.",
                name: "Alex R.",
                role: "Small business owner",
              },
            ].map((t) => (
              <Card key={t.name} className="border-muted bg-background">
                <CardContent className="space-y-4 pt-6">
                  <p className="text-sm leading-relaxed text-muted-foreground">“{t.quote}”</p>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-10" style={{ backgroundColor: navy }}>
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 px-4 text-sm text-white/80 sm:flex-row sm:px-6">
          <div>
            <p className="text-base font-semibold text-white">ClearSign</p>
            <p className="mt-2 max-w-md">
              AI-generated contract explanations for informational purposes only. Not legal
              advice.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Link className="hover:text-white" href="/pricing">
              Pricing
            </Link>
            <Link className="hover:text-white" href="/analyze">
              Analyze
            </Link>
            <Link className="hover:text-white" href="/login">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
