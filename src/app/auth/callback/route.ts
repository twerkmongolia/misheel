import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { defaultLocale, isLocale } from '@/lib/i18n/config'
import { landingAfterSignIn } from '@/lib/auth/landing'

/**
 * OAuth болон и-мэйл баталгаажуулалтын буцах цэг.
 * Supabase-ийн буцаасан баталгааг session болгон cookie-д бичнэ.
 *
 * ── ХОЁР өөр баталгаа ирж болно ───────────────────────────────────────────
 *
 *   1. `?code=…`        — PKCE. Google-ийн урсгал ба и-мэйлийн анхдагч
 *                         загварууд үүнийг ашиглана. Хөтөч дээр үлдсэн
 *                         НУУЦ ТҮЛХҮҮР (`…-code-verifier` cookie) шаардана.
 *
 *   2. `?token_hash=…&type=…` — нэг удаагийн код (OTP). Түлхүүр ШААРДАХГҮЙ.
 *
 * Хоёр дахийг нь дэмжих нь чимээгүй ч байнга тохиолддог нэг гэмтлийг
 * засна: хүн нууц үг сэргээх хүсэлтээ КОМПЬЮТЕР дээрээ илгээгээд и-мэйлээ
 * УТСАНДАА нээдэг. Утсан дээр PKCE түлхүүр байхгүй — тэр нь хүсэлт
 * илгээсэн хөтөч дээр үлдсэн — тул `code` урсгал заавал унана. Хүн юу
 * буруу хийснээ ойлгохгүй, дахин оролдоод дахин л ижил хана мөргөнө.
 *
 * `token_hash` нь хөтчөөс хамаарахгүй тул энэ тохиолдолд ажиллана.
 * Идэвхжүүлэхийн тулд Supabase → Authentication → Emails дотор загварын
 * `{{ .ConfirmationURL }}` -ийг дараах байдлаар солино (§ README):
 *
 *   {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/mn/reset-password
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

const OTP_TYPES: readonly EmailOtpType[] = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]

function isOtpType(value: string): value is EmailOtpType {
  return (OTP_TYPES as readonly string[]).includes(value)
}

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams, origin } = request.nextUrl

  // Open redirect-ээс сэргийлж зөвхөн дотоод замыг зөвшөөрнө.
  const rawNext = searchParams.get('next') ?? ''
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : ''

  /* Хэлийг эхлээд тодорхой параметрээс, дараа нь `next` замын эхний
     хэсгээс уншина: и-мэйлийн загвар `locale` дамжуулдаггүй ч `next` нь
     `/en/reset-password` гэж ирнэ — тэгэхэд алдааны хуудас нь англи байх
     ёстой. Өмнө нь алдаа ҮРГЭЛЖ монгол хуудас руу буудаг байв. */
  const rawLocale = searchParams.get('locale') ?? next.split('/')[1] ?? ''
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale

  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/${locale}/login?error=${reason}`)

  /* Google, Supabase хоёулаа алдаагаа ЗАМЫН АСУУЛТААР буцаана — эдгээр нь
     баталгаатай хэзээ ч хамт ирэхгүй тул хамгийн түрүүнд шалгана. */
  const providerError = searchParams.get('error') ?? searchParams.get('error_code')
  if (providerError) {
    console.error(
      `[auth] нийлүүлэгч алдаа буцаалаа: ${providerError} — ${searchParams.get('error_description') ?? 'тайлбаргүй'}`,
    )
    return fail('provider')
  }

  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const rawType = searchParams.get('type') ?? ''

  if (!code && !tokenHash) {
    console.error(
      '[auth] баталгаа ирсэнгүй (`code` ч, `token_hash` ч алга). Supabase дээрх ' +
        `Redirect URLs жагсаалтад «${origin}/auth/callback» байгаа эсэхийг шалгана уу.`,
    )
    return fail('missing_code')
  }

  const supabase = await createClient()

  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash as string,
        type: isOtpType(rawType) ? rawType : 'email',
      })

  if (error) {
    console.error(`[auth] баталгаа session болсонгүй: ${error.code ?? '—'} — ${error.message}`)
    return fail('exchange')
  }

  /* Дуудагч тодорхой зам хүссэн бол түүнийг хүндэтгэнэ: хүн ямар нэг
     хуудас руу орох гэж байгаад нэвтрэлт шаардсан, эсвэл нууц үг
     сэргээх холбоос дарсан байна. */
  if (next) return NextResponse.redirect(`${origin}${next}`)

  /* Нууц үг сэргээх холбоос `next` -гүй ирвэл (и-мэйлийн загвар дээр
     бичихээ мартсан) хүнийг хичээл рүү нь шидэх нь буруу: тэр нууц үгээ
     солих гэж ирсэн. Төрлөөс нь мэдээд зөв хуудас руу нь хүргэнэ. */
  if (rawType === 'recovery') {
    return NextResponse.redirect(`${origin}/${locale}/reset-password`)
  }

  /* Зам заагаагүй бол эрхээс нь хамаарна — шууд Google урсгалтай НЭГ функц
     (§ lib/auth/landing.ts). */
  return NextResponse.redirect(
    await landingAfterSignIn(supabase, data.session?.user.id, origin, locale, ''),
  )
}
