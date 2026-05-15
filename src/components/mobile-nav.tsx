"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function MobileNav({ email }: { email?: string | null }) {
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.refresh()
    router.push("/")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "text-white hover:bg-white/10 md:hidden",
        )}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem className="p-0">
          <Link className="block w-full px-2 py-1.5" href="/">
            Home
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="p-0">
          <Link className="block w-full px-2 py-1.5" href="/pricing">
            Pricing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="p-0">
          <Link className="block w-full px-2 py-1.5" href="/analyze">
            Analyze
          </Link>
        </DropdownMenuItem>
        {email ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="p-0">
              <Link className="block w-full px-2 py-1.5" href="/dashboard">
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void signOut()}>
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="p-0">
              <Link className="block w-full px-2 py-1.5" href="/login">
                Login
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-0">
              <Link className="block w-full px-2 py-1.5" href="/signup">
                Sign up
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
