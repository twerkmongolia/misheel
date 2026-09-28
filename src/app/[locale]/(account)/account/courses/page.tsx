import { notFound } from 'next/navigation'
import { Alert, ButtonLink, Empty } from '@/components/ui'
import { bookingErrorMessage } from '@/lib/errors'
import { getDictionary, isLocale } from '@/lib/i18n'
import { requireUser } from '@/lib/auth/dal'
import { Legend } from '../Legend'
import { EnrollmentSections, loadEnrollments } from '../Enrollments'
import { BookingSections, loadBookings } from '../Bookings'

/* ───────────────────────────────────────────────────────────────────────────
   МИНИЙ ХИЧЭЭЛҮҮД

   Урьд нь хоёр таб байв: «Миний анги» (элссэн сургалт) ба «Миний хичээлүүд»
   (хуваариас захиалсан ганц хичээл). Нэр нь домэйнд зөв ч хүн уншихдаа
   ялгадаггүй: 100₮-ийн онлайн сургалтаа төлсөн хүн түүнийг «Миний
   хичээлүүд» дотроос хайж, хоосон дэлгэц хараад «төлбөр минь алга» гэж
   дүгнэсэн. Студийн ЭЗЭН өөрөө ингэж эндүүрсэн бол хэрэглэгч ч эндүүрнэ.

   Тиймээс нэг хуудас: дээр нь элссэн анги (Telegram товч гэх мэт өнөөдөр
   хийх зүйл), доор нь захиалсан хичээлүүд. Хайх газар нэг болов.

   ⚠️ Зам нь `/account/courses` хэвээр: `cancelEnrollment` нь түүнийг
   ШУУД бичсэн байдаг (§ actions/courses.ts). `/account/bookings` нь
   чиглүүлэгч болон үлдэнэ — хуучин холбоос, хавчуурга унахгүй.
   ─────────────────────────────────────────────────────────────────────── */

export default async function MyLearningPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ ok?: string; cancelled?: string; error?: string }>
}) {
  const [{ locale }, search] = await Promise.all([params, searchParams])
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const here = `/${locale}/account/courses`
  const user = await requireUser(locale, here)

  /* Хоёр талыг ЗЭРЭГ татна — нэг нь нөгөөгөө хүлээх шалтгаан алга. */
  const [enrollments, bookings] = await Promise.all([
    loadEnrollments(user.id),
    loadBookings(user.id),
  ])

  const empty =
    enrollments.rows.length === 0 && bookings.upcoming.length === 0 && bookings.past.length === 0

  return (
    <div className="flex flex-col gap-12">
      <Legend as="h1" title={t.courses.mine} lead={t.courses.mineLead} />

      {/* Хоёр урсгал хоёр өөр параметрээр буцаж ирнэ: элсэлт цуцлахад
          `?ok=cancelled`, хичээл цуцлахад `?cancelled=1`. Хоёулаа энд
          буудаг болсон тул хоёуланг нь мэдэх ёстой. */}
      {search.ok === 'cancelled' && <Alert tone="good">{t.courses.cancelled}</Alert>}
      {search.cancelled && <Alert tone="neutral">{t.booking.cancelled}</Alert>}
      {search.error && <Alert tone="danger">{bookingErrorMessage(t, search.error)}</Alert>}

      {empty ? (
        <div className="flex flex-col items-center gap-6">
          <Empty>
            {t.courses.mineEmpty}
            <span className="mt-2 block text-faint">{t.courses.mineEmptyHint}</span>
          </Empty>
          {/* Хоосон төлөв нь ЗАМ санал болгох ёстой. Мухар «юу ч алга»
              гэсэн дэлгэц нь хэрэглэгчийг буцах товч руу түлхэнэ. */}
          <ButtonLink href={`/${locale}/courses`}>{t.courses.browse}</ButtonLink>
        </div>
      ) : (
        <>
          {/* Дараалал нь «өнөөдөр яах вэ» → «юу байсан бэ». Бүлгээр нь биш
              ЯАРАЛТАЙ ЭСЭХЭЭР нь: маргааш очих хичээл нь хоёр жилийн өмнө
              дууссан ангийн доор үлдэх ёсгүй. */}
          <EnrollmentSections data={enrollments} locale={locale} part="live" />
          <BookingSections data={bookings} locale={locale} back={here} part="live" />
          <EnrollmentSections data={enrollments} locale={locale} part="history" />
          <BookingSections data={bookings} locale={locale} back={here} part="history" />
        </>
      )}
    </div>
  )
}
