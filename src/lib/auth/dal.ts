import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { Profile } from '@/lib/supabase/database.types'
import type { Locale } from '@/lib/i18n/config'

/**
 * Өгөгдөл хандах давхарга (DAL).
 *
 * Хуудас болон Server Action БҮРИЙН эхэнд эрхээ энд шалгана. Server Action нь
 * UI-гүйгээр шууд POST хүсэлтээр дуудагдаж болдог тул товч нуусан нь хамгаалалт
 * болохгүй. `proxy.ts` дахь шалгалт бол зөвхөн хурдан урьдчилсан шүүлт.
 */

/**
 * Нэвтэрсэн хэрэглэгчийн ТАНИХ мэдээлэл.
 *
 * Supabase-ийн бүтэн `User` объект БИШ. Шалтгаан: энэ програм түүнээс зөвхөн
 * хоёр талбар уншдаг — `id` (бүх хүснэгтийн `user_id`) ба `email` (профайлын
 * хуудсанд). Хоёулаа JWT-ийн claim дотор аль хэдийн байдаг тул бүтэн объектыг
 * авахын тулд сүлжээгээр очих шалтгаан алга.
 *
 * Нарийн төрөл нь баримт бичгийн үүрэг ч гүйцэтгэнэ: цаашид `created_at`,
 * `app_metadata` гэх мэт талбар хэрэгтэй болбол энэ төрөл өөрөө «эдгээр нь
 * энд байхгүй» гэж хэлж, зохиогчийг ухамсартай шийдвэр гаргахад хүргэнэ.
 */
export type SessionUser = {
  id: string
  email: string | null
}

/**
 * Хэн нэвтэрсэн бэ.
 *
 * ── `getUser()` БИШ `getClaims()` ─────────────────────────────────────────
 * `getUser()` нь дуудагдах бүрдээ Supabase-ийн Auth сервер рүү сүлжээгээр
 * очдог (энэ сүлжээнээс хэмжихэд 270-780ms). `getClaims()` нь токены гарын
 * үсгийг ЛОКАЛД, WebCrypto-гоор шалгана — 0.06ms. Нийтийн түлхүүр (JWKS)
 * модулийн түвшний кэшэд 10 минут хадгалагдана.
 *
 * Төсөл маань ES256 (тэгш хэмт бус) түлхүүрээр гарын үсэг зурдаг тул локал
 * шалгалт нь криптографийн хувьд бүрэн баталгаатай: хуурамч токен гарын
 * үсгийн шалгалтад унана. Хэрэв төсөл хуучин тэгш хэмт HS256 нууц руу буцвал
 * `getClaims()` өөрөө `getUser()` рүү автоматаар шилжинэ — өнөөдрийнхтэй адил
 * ажиллана, зөвхөн хурдны ашиг алдагдана.
 *
 * ⚠️ ГАНЦ БОДИТ ЯЛГАА: ХҮЧИНГҮЙ БОЛГОХ ЦОНХ
 * Локал шалгалт нь «энэ токен жинхэнэ юу» гэдгийг мэднэ, харин «энэ session
 * ОДОО Ч оршиж байна уу» гэдгийг мэдэхгүй. Өөр төхөөрөмж дээрээс гарсан,
 * эсвэл устгагдсан хэрэглэгчийн токен нь өөрийн хугацаа дуустал (Supabase-ийн
 * анхдагчаар 1 цаг) хүчинтэй хэвээр байна.
 *
 * Энэ нь ойлгож байж хийсэн буулт бөгөөд гурван зүйлээр хязгаарлагдана:
 *   1. ЭРХ нь энд биш `profiles` хүснэгтээс уншигдана (§ `getProfile`) — тиймээс
 *      ажилтны эрх хассан бол ДАРААГИЙН хүсэлт дээр шууд хүчин төгөлдөр болно.
 *   2. Өгөгдлийн сангийн давхаргад RLS нь ямар ч тохиолдолд хүчинтэй — тэр ч
 *      мөн адил JWT-ийн гарын үсгийг шалгадаг тул цонх нь өргөсөөгүй.
 *   3. Удирдлагын хэсэгт (`requireStaff`) session-ийг Auth серверээс НЭМЖ
 *      баталгаажуулна — тэнд 300ms нь шууд хүчингүй болгохын төлөө зохистой үнэ.
 * Цонхыг богиносгох бол Supabase → Authentication → Sessions дотор access
 * token-ий хугацааг багасгана.
 */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured()) return null

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data) return null

  return { id: data.claims.sub, email: data.claims.email ?? null }
})

/**
 * Session нь Auth сервер дээр ОДОО Ч оршиж байгаа эсэх.
 *
 * Энэ бол цорын ганц газар, зориуд сүлжээгээр очдог. Зөвхөн удирдлагын хэсэгт
 * дуудагдана (§ `requireStaff`) — тэнд «гарсан хүн 1 цаг хүртэл орж чадна»
 * гэдэг цонх хүлээн зөвшөөрөгдөхгүй.
 *
 * `cache()` тул хүсэлт бүрд НЭГ л удаа.
 */
const hasLiveSession = cache(async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false

  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return data.user !== null
})

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  return data ?? null
})

export async function requireUser(locale: Locale, next?: string): Promise<SessionUser> {
  const user = await getUser()
  if (!user) {
    const target = next ? `?next=${encodeURIComponent(next)}` : ''
    redirect(`/${locale}/login${target}`)
  }
  return user
}

export async function isStaff(): Promise<boolean> {
  const profile = await getProfile()
  return profile?.role === 'staff' || profile?.role === 'admin'
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getProfile()
  return profile?.role === 'admin'
}

/**
 * Удирдлагын хуудсуудад. Эрхгүй бол нүүр рүү буцаана.
 *
 * Эрхийг `profiles` -ээс уншина (үргэлж шинэ), session-ийг Auth серверээс
 * баталгаажуулна (хүчингүй болгох цонхгүй). Хоёулангийнх нь өмнө зогсож
 * чадсан хүн л удирдлагад орно.
 */
export async function requireStaff(): Promise<Profile> {
  const profile = await getProfile()
  if (!profile) redirect('/mn/login?next=/admin')
  if (profile.role !== 'staff' && profile.role !== 'admin') redirect('/mn')
  if (!(await hasLiveSession())) redirect('/mn/login?next=/admin')
  return profile
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireStaff()
  if (profile.role !== 'admin') redirect('/admin')
  return profile
}
