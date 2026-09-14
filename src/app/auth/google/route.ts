import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { defaultLocale, isLocale } from '@/lib/i18n/config'

/**
 * Google-ээр нэвтрэх — ЭХЛЭХ цэг.
 *
 * ── Яагаад Route Handler, Server Action БИШ вэ ─────────────────────────────
 * Энэ хуудасны CSP нь `form-action 'self'` (§ proxy.ts) — өөрөөр хэлбэл
 * маягт нь зөвхөн энэ домэйн руу илгээгдэнэ. Server Action нь маягтын
 * илгээлт учраас хариуд нь `accounts.google.com` руу чиглүүлэхэд хөтөч
 * бүр өөр өөрөөр биеэ авч явдаг: Chrome, Firefox нь чиглүүлэлтийг дахин
 * шалгахгүй, WebKit нь ШАЛГАЖ болно. Тэр тохиолдолд iPhone дээр товч нь
 * чимээгүйхэн ажиллахгүй болно.
 *
 * Энгийн холбоос (`<a href>`) нь маягт биш ЖИРИЙН ШИЛЖИЛТ тул `form-action`
 * огт хамаарахгүй — гурван хөтөч дээр ижил ажиллана, JavaScript ч шаардахгүй.
 *
 * ── Яагаад СЕРВЕРТ ────────────────────────────────────────────────────────
 * `signInWithOAuth` нь PKCE-ийн нууц түлхүүрийг cookie-д бичнэ. Тэр cookie
 * нь `httpOnly` байх ёстой бөгөөд түүнийг зөвхөн сервер бичиж чадна.
 * Буцах цэг нь `/auth/callback` — тэр кодыг session болгож солино.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams, origin } = request.nextUrl

  const rawLocale = searchParams.get('locale') ?? ''
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale

  /* Open redirect-ээс сэргийлж зөвхөн дотоод зам. `//evil.com` нь протоколоо
     өвлөдөг БҮТЭН хаяг тул `/` -ээр эхэлж байгаад хууртаж болохгүй
     (§ auth/callback/route.ts дээрх ижил дүрэм). */
  const rawNext = searchParams.get('next') ?? ''
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : ''

  /* `next` БАЙХГҮЙ бол очих газрыг энд ШИЙДЭХГҮЙ — эрхээ мэдэхийн тулд
     эхлээд нэвтрэх ёстой. Буцах цэг нь session үүссэний дараа эрхийг нь
     хараад шийднэ (§ auth/callback/route.ts). Хэлээ л дамжуулна. */
  const back = new URLSearchParams({ locale })
  if (next) back.set('next', next)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?${back}`,

      /* `prompt=select_account` — Google ҮРГЭЛЖ хаяг сонгуулна.
         Үүнгүйгээр нэг хаягаар нэвтэрсэн хөтөч дээр Google асуухгүйгээр
         ТҮҮГЭЭР нь оруулна. Хувийн, ажлын хоёр хаягтай хүн буруу
         хаягаараа бүртгүүлчихээд буцаах арга олдохгүй — Google-оос
         бүрэн гарахаас өөр зам үлдэхгүй. Нэг нэмэлт товшилт нь тэр
         гацаанаас хамаагүй хямд. */
      queryParams: { prompt: 'select_account' },
    },
  })

  if (error || !data.url) {
    /* Энэ нь сүлжээ биш ТОХИРГООНЫ алдаа байх нь олонтаа (Supabase дээр
       Google идэвхгүй, түлхүүр буруу). Хэрэглэгчид харагдах мессеж түүнийг
       хэлж чадахгүй тул жинхэнэ шалтгааныг серверт үлдээнэ. */
    console.error(`[auth] Google руу чиглүүлж чадсангүй: ${error?.message ?? 'хаяг ирсэнгүй'}`)
    return NextResponse.redirect(`${origin}/${locale}/login?error=oauth_start`)
  }

  return NextResponse.redirect(data.url)
}
