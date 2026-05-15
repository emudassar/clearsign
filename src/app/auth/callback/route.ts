import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  let next = searchParams.get("next") ?? "/dashboard"
  if (!next.startsWith("/")) {
    next = "/dashboard"
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const forwardedHost = request.headers.get("x-forwarded-host")
  const isLocalEnv = process.env.NODE_ENV === "development"
  const redirectBase =
    isLocalEnv || !forwardedHost ? origin : `https://${forwardedHost}`
  const redirectUrl = `${redirectBase}${next}`

  /* Cookies must be written onto the redirect response (Vercel / App Router). */
  const response = NextResponse.redirect(redirectUrl)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  if (data.user) {
    try {
      const admin = createServiceClient()
      await admin.from("profiles").upsert(
        { id: data.user.id, updated_at: new Date().toISOString() },
        { onConflict: "id", ignoreDuplicates: true },
      )
    } catch (e) {
      console.error("profile upsert after auth", e)
    }
  }

  return response
}
