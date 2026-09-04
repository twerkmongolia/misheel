import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Alert, Button, Empty, Section } from '@/components/ui'
import { cancelBooking } from '@/actions/bookings'
import { bookingErrorMessage } from '@/lib/errors'
import { getDictionary, loc, isLocale } from '@/lib/i18n'
import { formatDayShort, formatMnt, formatTime, nowMs, weekdayLong } from '@/lib/format'
import { getClassTypes, getInstructors, indexBy } from '@/lib/data'
import { requireUser } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { BookingStatus, ClassSession } from '@/lib/supabase/database.types'
import { Legend } from '../Legend'

/**
 * Төлөвийн гэрэлтүүлэлт — ХҮРЭЭ БИШ.
 *
 * Урьд нь эдгээр нь хүрээтэй шошго байсан бөгөөд тасархай хүрээтэй
 * «Цуцлагдсан» шошго нь тасархай хүрээтэй «Цуцлах» ТОВЧТОЙ яг адилхан
 * харагддаг байв. Сайт даяар нэг дүрэм: хүрээ = дарж болно. Тиймээс төлөв
 * нь зөвхөн жин, гэрэлтүүлэлтээрээ ялгарна.
 */
const tones: Record<BookingStatus, string> = {
  pending: 'text-foreground-soft',
  confirmed: 'font-semibold text-foreground',
  cancelled: 'text-faint line-through',
  attended: 'text-muted',
  no_show: 'text-faint line-through',
}

/** Бүртгэл хүчинтэй үү — мөр бүхэлдээ бүдгэрэх эсэхийг энэ шийднэ. */
const live: Record<BookingStatus, boolean> = {
  pending: true,
  confirmed: true,
  cancelled: false,
  attended: true,
  no_show: false,
}

export default async function MyBookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ cancelled?: string; error?: string }>
}) {
  const [{ locale }, search] = await Promise.all([params, searchParams])
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  await requireUser(locale, `/${locale}/account/bookings`)

  if (!isSupabaseConfigured()) {
    return (
      <div className="flex flex-col gap-10">
        <Legend as="h1" title={t.booking.myBookings} />
        <Empty>{t.booking.noBookings}</Empty>
      </div>
    )
  }

  const supabase = await createClient()

  /**
   * ⚠️ `limit` нь ЗААВАЛ.
   *
   * Урьд нь энэ асуулга хэрэглэгчийн БҮХ бүртгэлийг татдаг байв — дараа нь
   * доор `past.slice(0, 20)` -оор зөвхөн ХАРУУЛАХАД нь хязгаарладаг.
   * Өөрөөр хэлбэл гурван жил хичээллэсэн хүний 400 мөрийг татаж, JSON
   * болгож, дамжуулаад 380-ыг нь хаядаг. Тэр бүх мөрийн `session_id` нь
   * дараагийн `class_sessions` асуулгад ч ордог тул зардал хоёр дахин.
   *
   * «Ирэх» ба «өнгөрсөн» -ийг ялгах хугацаа нь `class_sessions` дээр
   * байдаг тул серверийн шүүлт хийх боломжгүй. Тиймээс сүүлийн 200 мөрийг
   * авна: харуулах дээд хэмжээнээс (ирэх бүгд + өнгөрсөн 20) хамаагүй
   * илүү, гэхдээ хязгаартай.
   */
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  const sessionIds = [...new Set((bookings ?? []).map((booking) => booking.session_id))]
  const { data: sessions } = sessionIds.length
    ? await supabase.from('class_sessions').select('*').in('id', sessionIds)
    : { data: [] as ClassSession[] }

  const [classTypes, instructors] = await Promise.all([getClassTypes(true), getInstructors(true)])
  const bySession = indexBy(sessions ?? [], 'id')
  const byClass = indexBy(classTypes, 'id')
  const byInstructor = indexBy(instructors, 'id')

  const rows = (bookings ?? []).flatMap((booking) => {
    const session = bySession.get(booking.session_id)
    if (!session) return []
    return [
      {
        booking,
        session,
        classType: byClass.get(session.class_type_id) ?? null,
        instructor: session.instructor_id ? (byInstructor.get(session.instructor_id) ?? null) : null,
      },
    ]
  })

  const now = nowMs()
  const upcoming = rows
    .filter((row) => new Date(row.session.starts_at).getTime() >= now)
    .sort((a, b) => a.session.starts_at.localeCompare(b.session.starts_at))
  const past = rows
    .filter((row) => new Date(row.session.starts_at).getTime() < now)
    .sort((a, b) => b.session.starts_at.localeCompare(a.session.starts_at))

  const back = `/${locale}/account/bookings`

  /**
   * Бүртгэлийн мөр — хуваарийн `SessionRow` -той ИЖИЛ хэлээр ярина:
   * зүүн талд цаг нь зангуу, дунд нь хичээл, баруун талд төлөв ба үйлдэл.
   * Хайрцаг биш шугам ашиглав — хайрцаг бүр өөрийн ирмэгтэй тул олноороо
   * жагсахад «жагсаалт» биш «овоолго» болдог.
   */
  const render = (row: (typeof rows)[number]) => {
    const cancellable =
      ['pending', 'confirmed'].includes(row.booking.status) &&
      new Date(row.session.starts_at).getTime() >= now

    return (
      <li key={row.booking.id} className="group relative border-b border-line last:border-b-0">
        {/* Hover нь дэвсгэр биш ЗУРААС — § `SessionRow` -той нэг дүрэм. */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[2px] origin-top scale-y-0 bg-foreground transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100"
        />

        <div
          className={`flex flex-col gap-4 py-5 pl-4 sm:py-6 md:grid md:grid-cols-[7rem_minmax(0,1fr)_auto_auto] md:items-center md:gap-x-7 md:gap-y-0 ${
            live[row.booking.status] ? '' : 'opacity-55'
          }`}
        >
          {/* ── 1 · Хэзээ ── */}
          <div className="flex items-baseline gap-2.5 md:block">
            <p className="t-num text-[1.75rem] md:text-[1.875rem]">
              {formatTime(row.session.starts_at)}
            </p>
            <p className="t-meta text-muted md:mt-1.5">
              {weekdayLong(row.session.starts_at, locale)}
              <span className="text-faint"> · </span>
              {formatDayShort(row.session.starts_at, locale)}
            </p>
          </div>

          {/* ── 2 · Юу ── */}
          <div className="min-w-0">
            <Link
              href={`/${locale}/schedule/${row.session.id}`}
              className="t-h3 decoration-line-strong underline-offset-4 before:absolute before:inset-0 before:content-[''] group-hover:underline"
            >
              {row.classType ? loc(row.classType, 'name', locale) : '—'}
            </Link>
            {row.instructor && <p className="t-small mt-1 text-muted">{row.instructor.name}</p>}
          </div>

          {/* ── 3+4 · Үнэ, төлөв, үйлдэл ── */}
          <div className="flex items-center justify-between gap-4 md:contents">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 md:flex-col md:items-end md:gap-1">
              <span className="t-small font-semibold tabular-nums">
                {formatMnt(row.booking.price_paid)}
              </span>
              {/* Төлөв нь ГАНЦ УДАА гарна. Цуцалж болох мөрөнд баруун талыг
                  товч эзэлдэг тул төлөв нь үнийн дэргэд; бусад мөрөнд төлөв
                  өөрөө товчны байрыг эзэлнэ (доор). */}
              {cancellable && (
                <>
                  <span aria-hidden className="text-faint md:hidden">
                    ·
                  </span>
                  <span className={`t-meta whitespace-nowrap ${tones[row.booking.status]}`}>
                    {t.bookingStatus[row.booking.status]}
                  </span>
                </>
              )}
            </div>

            {/* Сүүлийн багана нь ҮРГЭЛЖ товчны хэлбэртэй: цуцалж болно =
                жинхэнэ товч, болохгүй = тасархай хүрээтэй тэмдэг. Хоосон
                зай үлдээвэл «яагаад энд юу ч байхгүй вэ» гэсэн асуулт
                хариултгүй үлддэг. */}
            <div className="flex shrink-0 justify-end">
              {cancellable ? (
                <form action={cancelBooking} className="relative z-10">
                  <input type="hidden" name="booking_id" value={row.booking.id} />
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="back" value={back} />
                  <Button type="submit" variant="danger" className="btn-sm">
                    {t.booking.cancelBooking}
                  </Button>
                </form>
              ) : (
                <span className="btn btn-sm btn-state">{t.bookingStatus[row.booking.status]}</span>
              )}
            </div>
          </div>
        </div>
      </li>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      <Legend as="h1" title={t.booking.myBookings} />

      {search.cancelled && <Alert tone="neutral">{t.booking.cancelled}</Alert>}
      {search.error && <Alert tone="danger">{bookingErrorMessage(t, search.error)}</Alert>}

      <Section title={t.booking.upcoming}>
        {upcoming.length === 0 ? (
          <Empty>{t.booking.noBookings}</Empty>
        ) : (
          <ul className="max-w-[60rem] border-t border-line-strong">{upcoming.map(render)}</ul>
        )}
      </Section>

      {past.length > 0 && (
        <Section title={t.booking.past}>
          <ul className="max-w-[60rem] border-t border-line-strong opacity-70">
            {past.slice(0, 20).map(render)}
          </ul>
        </Section>
      )}
    </div>
  )
}
