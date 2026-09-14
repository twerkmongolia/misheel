import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { defaultLocale, isLocale } from '@/lib/i18n/config'

/**
 * OAuth болон и-мэйл баталгаажуулалтын буцах цэг.
 * Supabase кодыг session болгон солиод cookie-д бичнэ.
 *
 * ── Алдааг ЯЛГАЖ буцаана ──────────────────────────────────────────────────
 * Өмнө нь бүх бүтэлгүйтэл `?error=auth` болж, нэвтрэх хуудсан дээр «Алдаа
 * гарлаа» гэсэн ганц мөр болж харагддаг байв. Шалтгаанууд нь огт өөр:
 *
 *   · Google дээр хүн цуцалсан            → дахин оролдвол болно
 *   · Кодгүй буцсан                        → буцах хаяг Supabase-ийн
 *     «Redirect URLs» жагсаалтад алга (тохиргооны алдаа, дахин оролдоод
 *     хэзээ ч засрахгүй)
 *   · Код солигдсонгүй                     → холбоосын хугацаа дууссан,
 *     эсвэл нэг кодыг хоёр удаа ашигласан
 *
 * Жинхэнэ мессежийг СЕРВЕРТ бичнэ — хэрэглэгчид үзүүлбэл нэвтрэлтийн
 * дотоод байдлыг задлах ба ямар ч тус болохгүй.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')

  // Open redirect-ээс сэргийлж зөвхөн дотоод замыг зөвшөөрнө.
  const rawNext = searchParams.get('next') ?? ''
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : ''

  const rawLocale = searchParams.get('locale') ?? ''
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale

  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/${defaultLocale}/login?error=${reason}`)

  /* Google, Supabase хоёулаа алдаагаа ЗАМЫН АСУУЛТААР буцаана — эдгээр нь
     кодтой хэзээ ч хамт ирэхгүй тул хамгийн түрүүнд шалгана. */
  const providerError = searchParams.get('error') ?? searchParams.get('error_code')
  if (providerError) {
    console.error(
      `[auth] нийлүүлэгч алдаа буцаалаа: ${providerError} — ${searchParams.get('error_description') ?? 'тайлбаргүй'}`,
    )
    return fail('provider')
  }

  if (!code) {
    console.error(
      '[auth] код ирсэнгүй. Supabase дээрх Redirect URLs жагсаалтад ' +
        `«${origin}/auth/callback» байгаа эсэхийг шалгана уу.`,
    )
    return fail('missing_code')
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error(`[auth] код session болсонгүй: ${error.message}`)
    return fail('exchange')
  }

  /* Дуудагч тодорхой зам хүссэн бол түүнийг хүндэтгэнэ: хүн ямар нэг
     хуудас руу орох гэж байгаад нэвтрэлт шаардсан, эсвэл нууц үг
     сэргээх холбоос дарсан байна. */
  if (next) return NextResponse.redirect(`${origin}${next}`)

  /* Зам заагаагүй бол эрхээс нь хамаарна — нэвтрэх маягттай ЯГ ижил дүрэм
     (§ actions/auth.ts `login`): ажилтан удирдлага руу, сурагч өөрийн
     хичээл рүү. Google талд «нэвтрэх» ба «бүртгүүлэх» гэсэн ялгаа байхгүй
     тул шинэ хүн ч, хуучин хүн ч энэ замаар ирнэ. */
  const userId = data.session?.user.id
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (profile?.role === 'staff' || profile?.role === 'admin') {
      return NextResponse.redirect(`${origin}/admin`)
    }
  }

  return NextResponse.redirect(`${origin}/${locale}/account/courses`)
}
