"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Menu, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function MobileNav({ email }: { email?: string | null }) {
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

  return (
    <div ref={rootRef} className="relative md:hidden">
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "text-white hover:bg-white/10",
        )}
      >
        <Menu className="size-5" />
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-52 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md">
          <Link
            href="/"
            className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/pricing"
            className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            Pricing
          </Link>
          <Link
            href="/analyze"
            className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            Analyze
          </Link>
          {email ? (
            <>
              <div className="my-1 h-px bg-border" />
              <Link
                href="/dashboard"
                className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>
              <button
                type="button"
                className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                onClick={() => void signOut()}
              >
                <LogOut className="mr-2 size-4" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
