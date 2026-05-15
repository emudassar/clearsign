import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  try {
    const { response, supabase } = await updateSession(request)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("next", request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    return response
  } catch (e) {
    console.error("middleware", e)
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    /* Skip API routes: they must return JSON; middleware + bad env was yielding HTML 500. */
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
