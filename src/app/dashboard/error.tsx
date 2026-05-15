"use client"

import Link from "next/link"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("dashboard error", error)
  }, [error])

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-bold text-[#1A3C5E]">Dashboard unavailable</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Something went wrong loading your saved analyses. Try again, or run a new analysis.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/analyze">New analysis</Link>
        </Button>
      </div>
    </div>
  )
}


