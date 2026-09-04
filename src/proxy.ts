import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { defaultLocale, isLocale, LOCALE_COOKIE, LOCALE_HEADER, locales } from '@/lib/i18n/config'

/**
 * Next 16-д Middleware нь Proxy болж нэрлэгдсэн — файл нь `src/proxy.ts`.
 *
 * Хоёр ажил гүйцэтгэнэ:
 *   1. Supabase-ийн session cookie-г шинэчилнэ (эс бөгөөс хэрэглэгч гэнэт гарна)
 *   2. Хэл сонгох redirect + хамгаалалттай замуудын УРЬДЧИЛСАН шалгалт
 *
 * ⚠️ Энд өгөгдлийн санд ХАНДАХГҮЙ. Proxy нь prefetch бүр дээр ажилладаг тул
 * удаан хандалт бүх сайтыг сааруулна. Жинхэнэ эрхийн шалгалт нь `lib/auth/dal.ts`
 * болон RLS дээр.
 */

/**
 * Агуулгын аюулгүй байдлын бодлого (CSP).
 *
 * ── Nonce ──────────────────────────────────────────────────────────────
 * Хүсэлт бүрд ганц удаагийн санамсаргүй мөр үүсгэнэ. Next нь `Content-
 * Security-Policy` толгойгоос уншаад өөрийн бүх скрипт, дотоод хэвэнд
 * автоматаар наана; бидний өөрийн мөрийн скрипт (§ app/layout.tsx
 * `bootScript`) түүнийг `x-nonce` толгойгоор авна.
 *
 * `strict-dynamic` нь nonce-той скриптийн ачаалсан бүхнийг зөвшөөрнө —
 * ингэснээр Next-ийн хэсэгчилсэн багцуудыг нэг бүрчлэн жагсаах
 * шаардлагагүй.
 *
 * ── Яагаад `style-src` дээр `unsafe-inline` вэ ─────────────────────────
 * Энэ сайт мөрийн хэвийн АТРИБУТ өргөн ашигладаг: `style={{ '--d': … }}`
 * нь хөдөлгөөний саатал бүрийн эх сурвалж (§ globals.css `.enter`). CSP
 * -д мөрийн style атрибут нь `style-src-attr` -аар удирдагддаг ба тэр
 * директивийг Firefox дэмждэггүй тул `style-src` руу унана. Nonce
 * тавибал Firefox дээр бүх атрибут хаагдана — өөрөөр хэлбэл хөдөлгөөн,
 * торны саатал бүгд эвдэрнэ.
 *
 * Скриптийн `unsafe-inline` бол XSS-ийн үүд; хэвийн `unsafe-inline` нь
 * хамаагүй нарийн эрсдэл. Тиймээс скрипт ХАТУУ, хэв нь буулттай.
 *
 * ── Гадаад эх сурвалж ──────────────────────────────────────────────────
 *   connect-src : Supabase (Auth, PostgREST, Realtime — тиймээс `wss:`)
 *   frame-src   : YouTube -ийн `youtube-nocookie` тоглуулагч
 *   img-src     : `i.ytimg.com` (бичлэгийн зураг), Supabase Storage.
 *                 Зургууд `/_next/image` -ээр дамждаг ч зарим нь шууд
 *                 ачаалагддаг тул хоёуланг нь зөвшөөрнө.
 */
const SUPABASE_ORIGIN = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : ''

function buildCsp(nonce: string): string {
  const dev = process.env.NODE_ENV === 'development'

  /* React нь хөгжүүлэлтэд `eval` ашиглан алдааны мөрийг сэргээдэг.
     Production-д Next ч, React ч `eval` ашигладаггүй. */
  const scriptExtra = dev ? " 'unsafe-eval'" : ''

  const supabaseWs = SUPABASE_ORIGIN ? SUPABASE_ORIGIN.replace(/^https/, 'wss') : ''

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${scriptExtra}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data: https://i.ytimg.com${SUPABASE_ORIGIN ? ` ${SUPABASE_ORIGIN}` : ''}`,
    "font-src 'self'",
    `connect-src 'self'${SUPABASE_ORIGIN ? ` ${SUPABASE_ORIGIN} ${supabaseWs}` : ''}`,
    'frame-src https://www.youtube-nocookie.com https://www.youtube.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}

/**
 * Бүх хариунд наах толгойнууд.
 *
 * `X-Frame-Options` нь `frame-ancestors` -той давхардсан мэт ч биш:
 * хуучин хөтчүүд `frame-ancestors` -ыг мэдэхгүй тул clickjacking-аас
 * зөвхөн энэ хамгаална.
 *
 * `Strict-Transport-Security` нь ЗӨВХӨН production-д — localhost дээр
 * тавибал хөтөч тухайн домэйныг HTTPS гэж САНАЖ үлдэх ба дараа нь
 * `http://localhost:3000` нээгдэхээ болино.
 */
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'on',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  ...(process.env.NODE_ENV === 'production'
    ? { 'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload' }
    : {}),
}

const PROTECTED_SEGMENTS = ['account', 'checkout']

/**
 * Хэлний segment-гүй замууд.
 *   auth      — OAuth callback (Supabase энэ хаяг руу яг буцаана)
 *   admin     — удирдлага, зөвхөн монголоор
 *   mock-pay, dev — төлбөрийн mock (§ payments)
 */
const NON_LOCALIZED = ['auth', 'admin', 'mock-pay', 'dev']

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  const [, first, ...rest] = pathname.split('/')

  /**
   * Хэлийг ҮНДСЭН layout руу дамжуулна.
   *
   * `<html lang>` нь `app/layout.tsx` дээр амьдардаг ба тэр нь `[locale]`
   * segment-ээс ДЭЭР байрладаг тул хэлээ мэдэх ямар ч арга байхгүй:
   * `params` хүрэхгүй, `next/root-params` нь зөвхөн үндсэн layout-аас
   * ДЭЭШ байгаа segment-д ажиллана (§ next/root-params). Тиймээс өмнө нь
   * `lang="mn"` гэж хатуу бичсэн байсан — англи хуудас бүр өөрийгөө
   * монгол гэж зарлаж, дэлгэц уншигч англи текстийг монгол дуудлагаар
   * уншиж, хайлтын систем буруу индекслэж байлаа.
   *
   * Хамгийн богино зам: замаас нь уншаад хүсэлтийн толгойд наана. Proxy
   * нь хуудасны хүсэлт БҮРД ажилладаг тул layout үүнд найдаж болно;
   * толгой ирээгүй тохиолдолд (matcher-аас гадуур) монгол руу унана.
   *
   * ⚠️ Толгойг `request.headers` -ээс ЯГ ТЭР МӨЧИД шинээр хуулна —
   * `request.cookies.set()` нь cookie толгойг дотор нь өөрчилдөг тул
   * эрт хийсэн хуулбар нь session шинэчлэлтийг залгичина.
   */
  const localeHeader = first && isLocale(first) ? first : defaultLocale

  /**
   * Prefetch дээр CSP тавихгүй.
   *
   * `<Link>` нь харагдах холбоос бүрийг урьдчилан татдаг. Тэдгээр хариу
   * нь хэзээ ч ЗУРАГДАХГҮЙ — зөвхөн router-ийн кэшэд орно — атлаа тус бүр
   * шинэ nonce авбал кэш дэх payload ба эцсийн хуудасны nonce хоёр зөрнө.
   * Next-ийн баримт бичиг мөн үүнийг зөвлөдөг.
   */
  const isPrefetch =
    request.headers.get('next-router-prefetch') !== null ||
    request.headers.get('purpose') === 'prefetch'

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp(nonce)

  /** Аюулгүйн толгойнууд БҮХ хариунд — redirect-д ч мөн адил. */
  function harden<T extends NextResponse>(res: T): T {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) res.headers.set(key, value)
    if (!isPrefetch) res.headers.set('Content-Security-Policy', csp)
    return res
  }

  const forward = () => {
    const headers = new Headers(request.headers)
    headers.set(LOCALE_HEADER, localeHeader)
    if (!isPrefetch) {
      // Next нь эдгээрийг уншиж, өөрийн скрипт бүрд nonce наана.
      headers.set('x-nonce', nonce)
      headers.set('Content-Security-Policy', csp)
    }
    return harden(NextResponse.next({ request: { headers } }))
  }

  let response = forward()

  // ── 1. Session шинэчлэх ──────────────────────────────────────────────────
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let userId: string | null = null

  if (url && anonKey) {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = forward()
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    })

    /**
     * `getUser()` БИШ `getClaims()`.
     *
     * ── Ялгаа нь ──────────────────────────────────────────────────────────
     * `getUser()` нь дуудагдах БҮРДЭЭ Supabase-ийн Auth сервер рүү сүлжээгээр
     * очиж токеныг шалгуулдаг. Харин proxy нь хуудасны хүсэлт бүр дээр —
     * түүнчлэн Next-ийн `<Link>` нь харагдах хэсэгт орсон холбоос БҮРИЙГ
     * урьдчилан татдаг тул тэдгээр prefetch бүр дээр ч — ажилладаг. Өөрөөр
     * хэлбэл нэг хуудас нээхэд арваад сүлжээний дуудлага үүсэж, бүгд нь
     * хэрэглэгчийн харах ёстой агуулгын өмнө дараалалд зогсоно.
     *
     * `getClaims()` нь токены гарын үсгийг ЛОКАЛД, WebCrypto-гоор шалгана —
     * сүлжээ огт хөндөхгүй. Нийтийн түлхүүрийг (JWKS) нэг л удаа татаад
     * модулийн түвшний кэшэд 10 минут барина, тиймээс дараагийн хүсэлтүүд
     * шууд шалгагдана.
     *
     * ── Аюулгүй байдал ────────────────────────────────────────────────────
     * Энэ бол сулруулалт БИШ. Төсөл маань ES256 (тэгш хэмт бус) түлхүүрээр
     * гарын үсэг зурдаг тул локал шалгалт нь криптографийн хувьд бүрэн
     * баталгаатай: хуурамч токен гарын үсгийн шалгалтад унана.
     * (Хэрэв төсөл хуучин тэгш хэмт HS256 нууцад буцвал `getClaims()` өөрөө
     * `getUser()` рүү автоматаар шилжинэ — өнөөдрийнхтэй яг адил ажиллана,
     * зүгээр л хурдны ашиг алдагдана. Энэ бол найдвартай уналт.)
     *
     * ── Cookie шинэчлэлт ──────────────────────────────────────────────────
     * Хэвээрээ. `getClaims()` нь дотроо `getSession()` дуудах ба тэр нь
     * токены хугацаа дуусахад ойртсон бол ШИНЭЧИЛЖ, дээрх `setAll` дамжуулан
     * шинэ cookie-г хариу руу бичнэ. Proxy-ийн эхний ажил хөндөгдөөгүй.
     */
    const { data } = await supabase.auth.getClaims()
    userId = data?.claims.sub ?? null
  }

  // ── 2. Удирдлагын хэсэг (хэлгүй) ─────────────────────────────────────────
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!userId) {
      const login = new URL(`/${defaultLocale}/login`, request.url)
      login.searchParams.set('next', pathname)
      return harden(NextResponse.redirect(login))
    }
    return response
  }

  // ── 3. Хэлний segment ────────────────────────────────────────────────────
  if (first && NON_LOCALIZED.includes(first)) {
    return response
  }

  if (!first || !isLocale(first)) {
    // Монгол руу. Хөтчийн хэлийг ҮЛ асууна — зөвхөн хэрэглэгч өөрөө сольсон
    // бол тэр сонголтыг нь хүндэтгэнэ.
    const saved = request.cookies.get(LOCALE_COOKIE)?.value
    const locale = saved && isLocale(saved) ? saved : defaultLocale
    const target = new URL(`/${locale}${pathname === '/' ? '' : pathname}${search}`, request.url)
    return harden(NextResponse.redirect(target))
  }

  // ── 4. Нэвтрэлт шаардсан замууд (урьдчилсан шүүлт) ───────────────────────
  const segment = rest[0] ?? ''
  if (!userId && PROTECTED_SEGMENTS.includes(segment)) {
    const login = new URL(`/${first}/login`, request.url)
    login.searchParams.set('next', pathname)
    return harden(NextResponse.redirect(login))
  }

  // Нэвтэрсэн хүнийг login/signup хуудаснаас буцаана
  if (userId && (segment === 'login' || segment === 'signup')) {
    return harden(NextResponse.redirect(new URL(`/${first}/account`, request.url)))
  }

  // Сонголтыг санана — дараагийн удаа `/` шууд тэр хэлээр нээгдэнэ.
  if (request.cookies.get(LOCALE_COOKIE)?.value !== first) {
    response.cookies.set(LOCALE_COOKIE, first, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Дараахаас БУСАД бүх замд ажиллана:
     *   api        — webhook нь өөрийн гарын үсгээр хамгаалагдана
     *   _next      — бүтээгдсэн файлууд
     *   media, зураг, favicon — статик агуулга
     *
     *   ⚠️ robots.txt, sitemap.xml, manifest.webmanifest — эдгээр нь
     *   ХЭЛГҮЙ, үндэсэд амьдардаг файлууд. Хасахгүй бол доорх «хэлний
     *   segment алга» дүрэм тэднийг `/mn/robots.txt` рүү 307-оор
     *   шидэх ба хайлтын робот хоосон гараад буцна: sitemap хэзээ ч
     *   уншигдахгүй, дүрэм хэзээ ч хүчин төгөлдөр болохгүй.
     */
    '/((?!api|_next/static|_next/image|media|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}

export { locales }
