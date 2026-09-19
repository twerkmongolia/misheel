import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from './database.types'
import { supabaseAnonKey, supabaseUrl } from './env'

/**
 * PKCE-ийн ТҮР түлхүүрийн нас — 1 цаг.
 *
 * ── Яагаад энэ хязгаар байх ёстой вэ ──────────────────────────────────────
 * PKCE урсгал эхлэх бүрд `@supabase/ssr` нь ӨӨР НЭРТЭЙ cookie үүсгэдэг
 * (`…-auth-token-flow-<id>-code-verifier`) бөгөөд Supabase түүнд 400
 * ХОНОГИЙН хугацаа өгдөг. Google руу очоод буцаж ИРЭЭГҮЙ оролдлого бүр —
 * хүн бодлоо өөрчилсөн, буцах товч дарсан, таб хаасан — өөрийн түлхүүрээ
 * үлдээнэ. Нэр нь тус бүрдээ өөр учир дарж бичигдэхгүй, ХУРИМТЛАГДАНА.
 *
 * Хэдэн арван оролдлогын дараа хүсэлтийн толгой Node-ийн хязгаарыг давж,
 * САЙТ БҮХЭЛДЭЭ `431 Request Header Fields Too Large` болж унана —
 * нэвтрэлт биш, нүүр хуудас хүртэл. Шалтгаан нь cookie гэдгийг таахад
 * хэцүү: сервер эрүүл, код зөв, зөвхөн ТЭР хөтөч орохоо больсон байдаг.
 *
 * ── Яагаад 15 минут БИШ вэ (өмнө нь тэгж байсан) ──────────────────────────
 * Энэ түлхүүрийг ЗӨВХӨН Google-ийн буцах аялал ашигладаг гэж үзсэн нь
 * АЛДАА байв. `signUp` ба `resetPasswordForEmail` ч мөн PKCE урсгал
 * эхлүүлж, ЯГ ИЖИЛ нэртэй cookie бичдэг — гэхдээ тэдгээрийн «буцах аялал»
 * нь и-мэйл дамждаг тул хэдэн минут биш ХЭДЭН АРВАН МИНУТ үргэлжилнэ.
 *
 * Үр дүнд нь: нууц үг сэргээх хүсэлт илгээгээд 15 минутын дараа и-мэйлээ
 * нээсэн хүн бүр «холбоосын хугацаа дууссан» гэсэн хана мөргөж байв —
 * холбоос нь Supabase дээр ХҮЧИНТЭЙ хэвээр атлаа. Дахин оролдох нь ч
 * тусалдаггүй: и-мэйл дахиад л 15 минутын дараа уншигдана.
 *
 * 1 цаг нь Supabase-ийн и-мэйл холбоосын анхдагч хугацаатай (`MAILER_OTP_EXP`
 * = 3600 сек) ТААРНА — өөрөөр хэлбэл холбоос хүчинтэй байх бүх хугацаанд
 * түлхүүр нь бас байна. Хуримтлалаас `auth/google/route.ts` дахь цэвэрлэгээ
 * хамгаална: шинэ урсгал эхлэхэд өмнөх бүх түлхүүрийг арчина.
 */
const VERIFIER_MAX_AGE = 60 * 60

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
