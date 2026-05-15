import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AnalysisNotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-bold text-[#1A3C5E]">Analysis not found</h1>
      <p className="text-sm text-muted-foreground">
        This link may be invalid or the contract may have been removed.
      </p>
      <Button asChild className="bg-[#E8401C] text-white hover:bg-[#c73516]">
        <Link href="/analyze">Upload a contract</Link>
      </Button>
    </div>
  )
}
