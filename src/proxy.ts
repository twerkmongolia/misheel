import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { defaultLocale, isLocale, LOCALE_COOKIE, locales } from '@/lib/i18n/config'

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

  let response = NextResponse.next({ request })

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
          response = NextResponse.next({ request })
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
      return NextResponse.redirect(login)
    }
    return response
  }

  // ── 3. Хэлний segment ────────────────────────────────────────────────────
  const [, first, ...rest] = pathname.split('/')

  if (first && NON_LOCALIZED.includes(first)) {
    return response
  }

  if (!first || !isLocale(first)) {
    // Монгол руу. Хөтчийн хэлийг ҮЛ асууна — зөвхөн хэрэглэгч өөрөө сольсон
    // бол тэр сонголтыг нь хүндэтгэнэ.
    const saved = request.cookies.get(LOCALE_COOKIE)?.value
    const locale = saved && isLocale(saved) ? saved : defaultLocale
    const target = new URL(`/${locale}${pathname === '/' ? '' : pathname}${search}`, request.url)
    return NextResponse.redirect(target)
  }

  // ── 4. Нэвтрэлт шаардсан замууд (урьдчилсан шүүлт) ───────────────────────
  const segment = rest[0] ?? ''
  if (!userId && PROTECTED_SEGMENTS.includes(segment)) {
    const login = new URL(`/${first}/login`, request.url)
    login.searchParams.set('next', pathname)
    return NextResponse.redirect(login)
  }

  // Нэвтэрсэн хүнийг login/signup хуудаснаас буцаана
  if (userId && (segment === 'login' || segment === 'signup')) {
    return NextResponse.redirect(new URL(`/${first}/account`, request.url))
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
     */
    '/((?!api|_next/static|_next/image|media|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}

export { locales }
