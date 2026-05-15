"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import { formatApiErrorField } from "@/lib/api-error-message"

export function ExportAnalysisButton({
  contractId,
  enabled,
}: {
  contractId: string
  enabled: boolean
}) {
  async function exportPdf() {
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId }),
      })
      const data = (await res.json()) as { html?: string; error?: unknown }
      if (!res.ok) {
        toast.error(formatApiErrorField(data.error, "Export failed"))
        return
      }
      if (!data.html) {
        toast.error("No HTML returned")
        return
      }
      const w = window.open("", "_blank")
      if (!w) {
        toast.error("Popup blocked — allow popups to print.")
        return
      }
      w.document.open()
      w.document.write(data.html)
      w.document.close()
      w.focus()
      w.print()
    } catch {
      toast.error("Export failed")
    }
  }

  if (!enabled) return null

  return (
    <Button
      type="button"
      variant="outline"
      className="border-[#1A3C5E] text-[#1A3C5E] hover:bg-[#1A3C5E]/5"
      onClick={() => void exportPdf()}
    >
      <FileDown className="mr-2 size-4" />
      Export PDF
    </Button>
  )
}
