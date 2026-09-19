import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { defaultLocale, isLocale } from '@/lib/i18n/config'

/**
 * Нэг хөтөч дээр зэрэг оршиж болох PKCE түлхүүрийн тоо.
 *
 * Гурав нь эхний урсгалд аль хэдийн үүсдэг (`…-flow-<id>-`, `…-flows-`,
 * хуучин нэгдмэл `…-code-verifier`) тул хязгаар нь түүнээс мэдэгдэхүйц
 * дээгүүр байх ёстой — эс бөгөөс цэвэрлэгээ хүсэлт болгонд ажиллаж,
 * хүчин төгөлдөр урсгалуудыг тасална.
 */
const VERIFIER_BUDGET = 8

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

  /* ── Хуримтлагдсан PKCE түлхүүрүүдийг цэвэрлэнэ ────────────────────────
     PKCE урсгал эхлэх бүрд `@supabase/ssr` нь ӨӨР НЭРТЭЙ cookie үүсгэдэг
     (`…-auth-token-flow-<id>-code-verifier`). Google руу очоод БУЦАЖ
     ИРЭЭГҮЙ оролдлого бүр — хүн бодлоо өөрчилсөн, буцах товч дарсан, таб
     хаасан — өөрийн түлхүүрээ үлдээнэ. Нэр нь тус бүрдээ өөр учир дарж
     бичигдэхгүй, ХУРИМТЛАГДАНА.

     Тэдгээр нь чимээгүй өснө: хүсэлтийн толгой Node-ийн хязгаарыг давахад
     САЙТ БҮХЭЛДЭЭ `431 Request Header Fields Too Large` болж унана —
     нэвтрэлт биш, нүүр хуудас хүртэл.

     ── Яагаад БҮРИЙГ НЬ ҮРГЭЛЖ арчихгүй вэ (өмнө нь тэгдэг байсан) ────────
     Нууц үг сэргээх, и-мэйл баталгаажуулах урсгалууд ЯГ ИЖИЛ нэртэй
     түлхүүр бичдэг. Бүрийг нь арчих нь дараах бодит дарааллыг эвдэнэ:

         «нууц үгээ мартсан» → и-мэйл удаж байна → «Google-ээр
          үргэлжлүүлэх» дарлаа → и-мэйл ирлээ → холбоос нь ҮХСЭН

     Хүн юу ч буруу хийгээгүй мөртлөө сэргээх холбоос нь ажиллахгүй.

     Тиймээс зөвхөн ХУРИМТЛАЛ үүссэн үед л цэвэрлэнэ. Түлхүүр тус бүр
     ~190 байт; хэдхэн ширхэг нь хязгаараас хол хэвээр. Хязгаараас давсан
     үед л «энд ямар нэг зүйл хуримтлагдаж байна» гэж үзээд бүгдийг арчина
     — тэр үед сэргээх холбоос золиослох нь сайт бүхэлдээ унахаас хямд.
     Үлдсэн хамгаалалт нь насны хязгаар (§ lib/supabase/server.ts). */
  const jar = await cookies()
  const verifiers = jar.getAll().filter((cookie) => cookie.name.endsWith('code-verifier'))

  if (verifiers.length > VERIFIER_BUDGET) {
    for (const cookie of verifiers) jar.delete(cookie.name)
  }

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
