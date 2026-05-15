"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { LogOut, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function UserMenu({ email }: { email: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onEscape)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onEscape)
    }
  }, [open])

  async function signOut() {
    setOpen(false)
    await supabase.auth.signOut()
    router.refresh()
    router.push("/")
  }

  const initials = email
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase()

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "rounded-full text-white hover:bg-white/10",
        )}
      >
        <Avatar className="size-8 border border-white/30">
          <AvatarFallback className="bg-white/10 text-xs text-white">
            {initials || <User className="size-4" />}
          </AvatarFallback>
        </Avatar>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <p className="truncate px-2 py-1.5 text-xs text-muted-foreground">{email}</p>
          <div className="my-1 h-px bg-border" />
          <Link
            role="menuitem"
            href="/dashboard"
            className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            Dashboard
          </Link>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
            onClick={() => void signOut()}
          >
            <LogOut className="mr-2 size-4" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
