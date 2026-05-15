"use client"

import { useMemo } from "react"

export function RiskGauge({ score }: { score: number }) {
  const clamped = Math.min(10, Math.max(0, score))
  const color = useMemo(() => {
    if (clamped >= 8) return { stroke: "#dc2626", label: "High risk" }
    if (clamped >= 5) return { stroke: "#d97706", label: "Moderate risk" }
    return { stroke: "#16a34a", label: "Lower risk" }
  }, [clamped])

  const radius = 52
  const circumference = 2 * Math.PI * radius
  const progress = (clamped / 10) * circumference

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative size-40 sm:size-44">
        <svg className="-rotate-90 size-full" viewBox="0 0 120 120" aria-hidden>
          <circle
            cx="60"
            cy="60"
            r={radius}
            strokeWidth="10"
            className="fill-none stroke-muted"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            strokeWidth="10"
            strokeLinecap="round"
            className="fill-none transition-all duration-700"
            stroke={color.stroke}
            strokeDasharray={`${progress} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums text-[#1A3C5E] sm:text-4xl">
            {clamped}
          </span>
          <span className="text-xs text-muted-foreground">/ 10</span>
        </div>
      </div>
      <p className="text-sm font-medium" style={{ color: color.stroke }}>
        {color.label}
      </p>
    </div>
  )
}
