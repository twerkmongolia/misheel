import { redirect } from 'next/navigation'
import { defaultLocale, isLocale } from '@/lib/i18n/config'

/* ───────────────────────────────────────────────────────────────────────────
   ХУУЧИН ЗАМ → `/account/courses`

   «Миний анги», «Миний хичээлүүд» хоёр нэг хуудас болов
   (§ account/courses/page.tsx). Энэ зам нь устгагдаагүй: хүмүүс хавчуурга
   хийсэн, бид и-мэйлд холбоос явуулсан, `cancelBooking` нь маягтын
   `back` талбараар хаана ч буцаж болно.

   ⚠️ 307, 308 БИШ. Байнгын чиглүүлэлтийг хөтөч кэшэлдэг тул хожим хоёр
   хуудсыг дахин салгахаар шийдвэл зочдын хөтөч энэ хаягийг хэдэн сараар
   буруу газар аваачсаар байна — сервер юу гэж хариулснаас үл хамааран.
   ─────────────────────────────────────────────────────────────────────── */

export default async function MyBookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ locale }, search] = await Promise.all([params, searchParams])

  /* Асуултыг ДАГУУЛНА: хичээлээ цуцалсан хүн `?cancelled=1` -тэй ирдэг тул
     үүнийг хаявал «болсон уу, болоогүй юү» гэсэн мэдэгдэл алга болно. */
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    if (typeof value === 'string') query.set(key, value)
  }

  const to = `/${isLocale(locale) ? locale : defaultLocale}/account/courses`
  redirect(query.size > 0 ? `${to}?${query}` : to)
}
