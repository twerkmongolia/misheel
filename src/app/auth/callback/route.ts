import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { defaultLocale } from '@/lib/i18n/config'

/**
 * OAuth болон и-мэйл баталгаажуулалтын буцах цэг.
 * Supabase кодыг session болгон солиод cookie-д бичнэ.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')

  const rawNext = searchParams.get('next') ?? `/${defaultLocale}/account`
  // Open redirect-ээс сэргийлж зөвхөн дотоод замыг зөвшөөрнө.
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : `/${defaultLocale}/account`

  if (!code) {
    return NextResponse.redirect(`${origin}/${defaultLocale}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/${defaultLocale}/login?error=auth`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
