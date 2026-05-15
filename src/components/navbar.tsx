import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"
import { MobileNav } from "@/components/mobile-nav"

export async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#1A3C5E] text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="text-lg font-bold">ClearSign</span>
        </Link>
        <nav className="hidden flex-1 justify-center gap-8 text-sm font-medium md:flex">
          <Link href="/" className="text-white/90 hover:text-white">
            Home
          </Link>
          <Link href="/pricing" className="text-white/90 hover:text-white">
            Pricing
          </Link>
          <Link href="/analyze" className="text-white/90 hover:text-white">
            Analyze
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <MobileNav email={user?.email} />
          {user ? (
            <div className="md:hidden">
              <UserMenu email={user.email ?? ""} />
            </div>
          ) : null}
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Button
                  asChild
                  variant="secondary"
                  className="bg-white text-[#1A3C5E] hover:bg-white/90"
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <UserMenu email={user.email ?? ""} />
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="bg-[#E8401C] text-white hover:bg-[#c73516]">
                  <Link href="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}


