import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  GOOGLE_CALLBACK_PATH,
  GOOGLE_COOKIE,
  exchangeGoogleCode,
  readGooglePending,
} from '@/lib/auth/google-direct'
import { landingAfterSignIn } from '@/lib/auth/landing'

/**
 * Google-ийн шууд урсгалын БУЦАХ цэг (§ lib/auth/google-direct.ts).
 *
 * Дараалал нь энэ урсгалын бүх хамгаалалт:
 *   1. cookie нь бидний бичсэн аяллынх — 10 минут, нэг удаа, энэ зам руу л;
 *   2. `state` таарна — өөр сайтаас эхлүүлсэн аялал биш;
 *   3. кодыг сервер-серверээр нууц ба PKCE-тэй солино;
 *   4. Supabase ID токеныг гарын үсэг, audience, NONCE-тай нь шалгана.
 * Аль нэг нь бүтэлгүйтвэл нэвтрэх хуудас руу — хуучин урсгалын `oauth`
 * алдааны мессеж тэнд аль хэдийн бий.
 *
 * Cookie-г ЭХЭНД нь устгана: амжилттай ч, бүтэлгүй ч нэг аялал нэг л удаа.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams, origin } = request.nextUrl
  const jar = await cookies()

  const pending = readGooglePending(jar.get(GOOGLE_COOKIE)?.value)
  jar.delete({ name: GOOGLE_COOKIE, path: GOOGLE_CALLBACK_PATH })

  const locale = pending?.locale ?? 'mn'
  const fail = (reason: string) => NextResponse.redirect(`${origin}/${locale}/login?error=${reason}`)

  // Хүн Google дээр цуцалсан — алдаа биш, дахин оролдвол болно.
  const providerError = searchParams.get('error')
  if (providerError) {
    console.error(`[auth] Google алдаа буцаалаа: ${providerError}`)
    return fail('provider')
  }

  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!pending || !code || !state || state !== pending.state) {
    // Хугацаа дууссан, өөр табаас эхэлсэн, эсвэл хуурамч буцалт.
    console.error('[auth] Google буцалт таарсангүй (cookie, state эсвэл код алга)')
    return fail('oauth_state')
  }

  const idToken = await exchangeGoogleCode(code, pending)
  if (!idToken) return fail('exchange')

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
    nonce: pending.nonce,
  })

  if (error) {
    console.error(`[auth] Supabase ID токеныг хүлээж авсангүй: ${error.code ?? '—'} — ${error.message}`)
    return fail('exchange')
  }

  return NextResponse.redirect(
    await landingAfterSignIn(supabase, data.session?.user.id, origin, pending.locale, pending.next),
  )
}
