import { getDictionary, type Locale } from '@/lib/i18n'
import { dayKey, weekdayLong } from '@/lib/format'

/**
 * Хуудасны хамгийн дээд мөр — ӨНӨӨДӨР ХЭДЭН БЭ.
 *
 * ── Яагаад ГАДАРГЫН ШАТ ───────────────────────────────────────────────────
 * Өмнө нь энэ нь ЭРГҮҮЛСЭН цагаан тууз байв — харанхуй хуудсан дээрх
 * хамгийн хүчтэй эсрэг тэсрэг. Гэвч сайт ганц горимтой болмогц тэр нь
 * системийн гадна үлдсэн ганц цагаан талбай болж, «энд өөр ертөнц эхэлж
 * байна» гэж уншигдана.
 *
 * Одоо ялгааг ӨНГӨ БИШ БАЙРЛАЛ хийнэ: тууз нь суурийн дээрх нэг шат,
 * доороо ганц шугам.
 *
 * ── Яагаад ЗӨВХӨН ОГНОО ───────────────────────────────────────────────────
 * Урьд нь энэ тууз өнөөдрийн хичээлийг ч зарладаг байв — хичээл байвал
 * холбоос, БАЙХГҮЙ бол «Өнөөдөр хичээл байхгүй». Асуудал нь тэр хоёр дахь
 * тохиолдолд: заал долоо хоногт хэдхэн удаа ажилладаг тул хүн сайт руу
 * ороход хамгийн эхэлж УНШИХ мөр нь ихэнхдээ ҮГҮЙСГЭЛ байв. Дээд тууз бол
 * хуудасны эхний амьсгал — тэр нь юу ч БОЛОХГҮЙ гэж эхэлж болохгүй.
 * Хуваарь өөрийн хуудсандаа бүрэн бий.
 *
 * ── Яагаад СЕРВЕРТ ────────────────────────────────────────────────────────
 * Огноог хөтөч дээр бодох нь хоёр асуудалтай: (1) серверийн зурсан HTML
 * дээр текст хоосон байгаад дараа нь үсрэн орж ирнэ, (2) хэрэглэгчийн
 * төхөөрөмжийн цагийн бүсээр бодогдоно. Студи Улаанбаатарт байдаг —
 * Берлинд амарч буй хүн ч УБ-ын өдрийг харах ёстой
 * (§ lib/format.ts `TIMEZONE`).
 */
export function TodayBar({ locale }: { locale: Locale }) {
  const t = getDictionary(locale)

  const now = new Date()
  /* `dayKey` нь Улаанбаатарын өдрийг өгнө — сар, өдрийг серверийн
     бүсээр биш ТҮҮНЭЭС л таслан авна. */
  const today = dayKey(now.toISOString())
  const month = Number(today.slice(5, 7))
  const day = Number(today.slice(8, 10))
  const weekday = weekdayLong(now.toISOString(), locale)

  const date =
    locale === 'en'
      ? `${weekday}, ${new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: 'Asia/Ulaanbaatar' }).format(now)}`
      : `${month} сарын ${day}, ${weekday} ${t.today.weekday}`

  return (
    <div className="border-b border-line bg-surface text-foreground">
      <div className="shell flex flex-wrap items-center justify-center gap-x-2 gap-y-1 py-2.5 text-center text-[0.9rem] leading-normal">
        <span className="font-bold">{t.today.label}:</span>
        <span>{date}</span>
      </div>
    </div>
  )
}
