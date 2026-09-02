import Link from 'next/link'
import { getDictionary, loc, type Locale } from '@/lib/i18n'
import { getUpcomingSessions } from '@/lib/data'
import { dayKey, formatTime, weekdayLong } from '@/lib/format'

/**
 * Хуудасны хамгийн дээд мөр — цагаан тууз.
 *
 * ── Яагаад ЦАГААН ─────────────────────────────────────────────────────────
 * Сайт бүхэлдээ харанхуй тул энэ ганц эргүүлсэн тууз нь дэлгэц нээгдэхэд
 * нүд хамгийн түрүүнд унах цэг болно. Хамгийн хурдан уншигдах газарт
 * хамгийн шинэ мэдээллийг тавина: өнөөдөр хичээл байгаа эсэх.
 *
 * ── Яагаад СЕРВЕРТ ────────────────────────────────────────────────────────
 * Огноог хөтөч дээр бодох нь хоёр асуудалтай: (1) серверийн зурсан HTML
 * дээр текст хоосон байгаад дараа нь үсрэн орж ирнэ, (2) хэрэглэгчийн
 * төхөөрөмжийн цагийн бүсээр бодогдоно. Студи Улаанбаатарт байдаг —
 * Берлинд амарч буй хүн ч УБ-ын хуваарийг харах ёстой. Тиймээс огноо,
 * хичээл хоёулаа серверт, `Asia/Ulaanbaatar` бүсээр бодогдоно
 * (§ lib/format.ts `TIMEZONE`).
 *
 * ── Яагаад ЖИНХЭНЭ ӨГӨГДӨЛ ────────────────────────────────────────────────
 * Хуваарь нь удирдлагаас өдөр бүр өөрчлөгддөг. Гараар бичсэн хуваарь нь
 * эхний долоо хоногт зөв, дараа нь чимээгүйгээр худал болно — тиймээс
 * энэ тууз `class_sessions` -ээс уншина.
 */
export async function TodayBar({ locale }: { locale: Locale }) {
  const t = getDictionary(locale)

  /* Өнөөдрийн хичээлийг олохын тулд ойрын хэдэн хичээлийг л татна —
     12 нь нэг өдөрт багтах хамгийн олон хичээлээс хамаагүй их. */
  const sessions = await getUpcomingSessions(12)
  const today = dayKey(new Date().toISOString())
  /* `classType` нь `null` байж болно (лавлах мөр устсан) — тэр тохиолдолд
     нэргүй хичээл харуулахаас юу ч харуулахгүй нь дээр. */
  const first = sessions.find(
    (session) => dayKey(session.starts_at) === today && session.classType !== null,
  )

  const now = new Date()
  const month = Number(today.slice(5, 7))
  const day = Number(today.slice(8, 10))
  const weekday = weekdayLong(now.toISOString(), locale)

  const date =
    locale === 'en'
      ? `${weekday}, ${new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: 'Asia/Ulaanbaatar' }).format(now)}`
      : `${month} сарын ${day}, ${weekday} ${t.today.weekday}`

  return (
    <div className="bg-foreground text-background">
      <div className="shell flex flex-wrap items-center justify-center gap-x-2 gap-y-1 py-2.5 text-center text-[0.9rem] leading-normal">
        <span className="font-bold">{t.today.label}:</span>
        <span>{date}</span>

        {first ? (
          <>
            <span aria-hidden className="opacity-40">
              ·
            </span>
            {/* Хичээл байвал тэр нь ХОЛБООС — уншсан хүн шууд бүртгүүлэх
                хуудас руу очно. Мэдээлэл өгөөд замыг нь хаах нь дутуу. */}
            <Link
              href={`/${locale}/schedule/${first.id}`}
              className="font-medium underline decoration-background/35 underline-offset-4 transition-colors hover:decoration-background"
            >
              {t.today.classToday}: {loc(first.classType!, 'name', locale)} — {formatTime(first.starts_at)}
            </Link>
          </>
        ) : (
          <>
            <span aria-hidden className="opacity-40">
              ·
            </span>
            <span className="opacity-70">{t.today.noClass}</span>
          </>
        )}
      </div>
    </div>
  )
}
