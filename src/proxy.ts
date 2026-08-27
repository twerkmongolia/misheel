import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { defaultLocale, isLocale, locales, pickLocale } from '@/lib/i18n/config'

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

    const { data } = await supabase.auth.getUser()
    userId = data.user?.id ?? null
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
    const locale = pickLocale(request.headers.get('accept-language'))
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
