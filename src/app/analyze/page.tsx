"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import { ChevronDown, UploadCloud } from "lucide-react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ContractAnalysis } from "@/types/analysis"
import { cn } from "@/lib/utils"
import { formatApiErrorField } from "@/lib/api-error-message"

const MAX_BYTES = 20 * 1024 * 1024

const ACCEPT = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
}

const PARTIES = [
  "Employee",
  "Tenant",
  "Freelancer",
  "Business Owner",
  "Other",
] as const

const PHASES = [
  "Reading contract...",
  "Identifying clauses...",
  "Calculating risk score...",
  "Almost done...",
]

export default function AnalyzePage() {
  const router = useRouter()
  const [party, setParty] = useState<(typeof PARTIES)[number]>("Freelancer")
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0]
    if (!f) return
    if (f.size > MAX_BYTES) {
      toast.error("Max file size is 20MB")
      return
    }
    setFile(f)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: ACCEPT,
  })

  const partyLabel = useMemo(() => `I am the ${party}`, [party])

  async function submit() {
    if (!file) {
      toast.error("Choose a file to upload")
      return
    }
    setBusy(true)
    setProgress(8)
    setPhaseIndex(0)
    const timers: number[] = []
    const tick = window.setInterval(() => {
      setPhaseIndex((i) => Math.min(PHASES.length - 1, i + 1))
      setProgress((p) => Math.min(92, p + 6))
    }, 1100)
    timers.push(tick)

    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("party", partyLabel)

      const res = await fetch("/api/analyze", { method: "POST", body: fd })
      const rawBody = await res.text()
      let data: {
        contractId?: string
        analysis?: ContractAnalysis
        error?: unknown
      }
      try {
        data = rawBody ? (JSON.parse(rawBody) as typeof data) : {}
      } catch {
        toast.error("Server error (not JSON)", {
          description:
            "Vercel: set NEXT_PUBLIC_SUPABASE_URL (full name), GOOGLE_AI_API_KEY, Supabase keys — redeploy. See function logs for /api/analyze.",
        })
        return
      }

      if (!res.ok) {
        toast.error(formatApiErrorField(data.error, "Analysis failed"))
        return
      }

      if (!data.contractId) {
        toast.error("Missing contract id")
        return
      }

      setProgress(100)
      setPhaseIndex(PHASES.length - 1)
      router.push(`/analysis/${data.contractId}`)
    } catch {
      toast.error("Could not reach the server. Check your connection or try again in a moment.")
    } finally {
      timers.forEach((t) => window.clearInterval(t))
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#1A3C5E]">
          Analyze a contract
        </h1>
        <p className="text-muted-foreground">
          Upload a PDF, DOCX, or TXT file (max 20MB). No account required for your first
          analysis.
        </p>
      </div>

      <Card className="border-muted">
        <CardHeader>
          <CardTitle>Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            {...getRootProps()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
              isDragActive ? "border-[#E8401C] bg-[#E8401C]/5" : "border-muted hover:bg-muted/40"
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="mb-3 size-10 text-[#1A3C5E]" />
            <p className="text-sm font-medium">
              {isDragActive ? "Drop the file here" : "Drag & drop, or click to select"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, or TXT · max 20MB</p>
            {file ? (
              <p className="mt-4 text-sm font-semibold text-[#1A3C5E]">{file.name}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Your role</p>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full justify-between font-normal",
                )}
              >
                <span className="truncate">{partyLabel}</span>
                <ChevronDown className="size-4 shrink-0 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                {PARTIES.map((p) => (
                  <DropdownMenuItem key={p} onClick={() => setParty(p)}>
                    I am the {p}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {busy ? (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground">{PHASES[phaseIndex]}</p>
            </div>
          ) : null}

          <Button
            type="button"
            disabled={!file || busy}
            className="w-full bg-[#E8401C] text-white hover:bg-[#c73516]"
            onClick={() => void submit()}
          >
            {busy ? "Analyzing..." : "Run analysis"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
