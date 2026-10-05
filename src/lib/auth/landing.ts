import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Locale } from '@/lib/i18n/config'

/**
 * Шинэ session-ий дараа хаашаа явах вэ — Google-ийн ХОЁР буцах цэг
 * (`/auth/callback` — Supabase-ийн чиглүүлэлт, и-мэйлийн холбоос;
 * `/auth/google/callback` — шууд урсгал) хоёулаа энийг дуудна. Хоёр хуулбар
 * бол нэг нь шинэчлэгдээд нөгөө нь хоцрох хоёр газар.
 *
 * Нэвтрэх маягттай ЯГ ижил дүрэм (§ actions/auth.ts `login`):
 *   · дуудагч тодорхой зам хүссэн бол (`next`) — тийшээ;
 *   · ажилтан — удирдлага руу;
 *   · бусад — өөрийн хичээл рүү.
 * Google талд «нэвтрэх», «бүртгүүлэх» гэсэн ялгаа алга тул шинэ хүн ч, хуучин
 * хүн ч энэ замаар ирнэ. Эрхийг `profiles`-оос УНШИНА — токенд хожуу орно.
 */
export async function landingAfterSignIn(
  supabase: SupabaseClient,
  userId: string | undefined,
  origin: string,
  locale: Locale,
  next: string,
): Promise<string> {
  if (next) return `${origin}${next}`

  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (profile?.role === 'staff' || profile?.role === 'admin') return `${origin}/admin`
  }

  return `${origin}/${locale}/account/courses`
}
