import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from './database.types'
import { supabaseAnonKey, supabaseUrl } from './env'

/**
 * PKCE-ийн ТҮР түлхүүрийн нас — 15 минут.
 *
 * ── Яагаад энэ хязгаар байх ёстой вэ ──────────────────────────────────────
 * `signInWithOAuth` дуудалт бүр `…-code-verifier` нэртэй ШИНЭ cookie
 * үүсгэдэг бөгөөд Supabase түүнд 400 ХОНОГИЙН хугацаа өгдөг. Google руу
 * очоод буцаж ИРЭЭГҮЙ оролдлого бүр — хүн бодлоо өөрчилсөн, буцах товч
 * дарсан, таб хаасан — тэр cookie-г 400 хоног үлдээнэ.
 *
 * Тэдгээр нь чимээгүй хуримтлагдана. Хэдэн арван оролдлогын дараа хүсэлтийн
 * толгой Node-ийн хязгаарыг давж, САЙТ БҮХЭЛДЭЭ `431 Request Header Fields
 * Too Large` болж унана — нэвтрэлт биш, нүүр хуудас хүртэл. Шалтгаан нь
 * cookie гэдгийг таахад хэцүү: сервер эрүүл, код зөв, зөвхөн ТЭР хөтөч
 * орохоо больсон байдаг.
 *
 * Түлхүүр нь Google руу очоод буцах хэдхэн минутад л хэрэгтэй. 15 минут нь
 * удаан нэвтэрч байгаа хүнд (шинэ хаяг үүсгэх, 2FA) ч хүрэлцэх бөгөөд
 * орхигдсон оролдлогыг өөрөө цэвэрлэнэ.
 */
const VERIFIER_MAX_AGE = 15 * 60

/**
 * Server Component, Server Action, Route Handler-т ашиглах client.
 *
 * `cookies()` нь Next 16-д async тул энэ функц заавал `await` -тай.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            /* Session-ийн cookie нь урт наслах ЁСТОЙ — хэрэглэгчийг өдөр
               бүр нэвтрүүлэх нь зорилго биш. Богиносгох нь ЗӨВХӨН түр
               түлхүүрт хамаарна. `expires` -ийг хаяна: хоёулаа байвал
               хөтөч Max-Age -ийг сонгодог ч давхар утга нь дараагийн
               уншигчийг төөрөгдүүлнэ. */
            const short = name.includes('code-verifier')
            cookieStore.set(
              name,
              value,
              short ? { ...options, maxAge: VERIFIER_MAX_AGE, expires: undefined } : options,
            )
          }
        } catch {
          // Server Component дотроос cookie бичих боломжгүй. Session-ийг
          // `proxy.ts` шинэчилдэг тул үүнийг алгасаж болно.
        }
      },
    },
  })
}
