import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Alert, Badge, Button, Empty, PageHeader, Section } from '@/components/ui'
import { cancelBooking } from '@/actions/bookings'
import { bookingErrorMessage } from '@/lib/errors'
import { getDictionary, loc, isLocale } from '@/lib/i18n'
import { formatDate, formatMnt, formatTime, nowMs, weekdayShort } from '@/lib/format'
import { getClassTypes, getInstructors, indexBy } from '@/lib/data'
import { requireUser } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { BookingStatus, ClassSession } from '@/lib/supabase/database.types'

const tones: Record<BookingStatus, 'neutral' | 'good' | 'warn' | 'danger'> = {
  pending: 'warn',
  confirmed: 'good',
  cancelled: 'danger',
  attended: 'neutral',
  no_show: 'danger',
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
        <PageHeader title={t.booking.myBookings} />
        <Empty>{t.booking.noBookings}</Empty>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })

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

  const render = (row: (typeof rows)[number]) => (
    <li
      key={row.booking.id}
      className="flex flex-wrap items-center justify-between gap-3 card p-5"
    >
      <div className="min-w-0">
        <Link href={`/${locale}/schedule/${row.session.id}`} className="font-medium hover:text-foreground">
          {row.classType ? loc(row.classType, 'name', locale) : '—'}
        </Link>
        <p className="t-small text-muted tabular-nums">
          {weekdayShort(row.session.starts_at, locale)} · {formatDate(row.session.starts_at, locale)} ·{' '}
          {formatTime(row.session.starts_at)}
          {row.instructor ? ` · ${row.instructor.name}` : ''}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm tabular-nums">{formatMnt(row.booking.price_paid)}</span>
        <Badge tone={tones[row.booking.status]}>{t.bookingStatus[row.booking.status]}</Badge>

        {['pending', 'confirmed'].includes(row.booking.status) &&
          new Date(row.session.starts_at).getTime() >= now && (
            <form action={cancelBooking}>
              <input type="hidden" name="booking_id" value={row.booking.id} />
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="back" value={back} />
              <Button type="submit" variant="danger" className="px-3 py-1.5 text-xs">
                {t.booking.cancelBooking}
              </Button>
            </form>
          )}
      </div>
    </li>
  )

  return (
    <div className="flex flex-col gap-10">
      <PageHeader title={t.booking.myBookings} />

      {search.cancelled && <Alert tone="neutral">{t.booking.cancelled}</Alert>}
      {search.error && <Alert tone="danger">{bookingErrorMessage(t, search.error)}</Alert>}

      <Section title={t.booking.upcoming}>
        {upcoming.length === 0 ? (
          <Empty>{t.booking.noBookings}</Empty>
        ) : (
          <ul className="flex flex-col gap-3">{upcoming.map(render)}</ul>
        )}
      </Section>

      {past.length > 0 && (
        <Section title={t.booking.past}>
          <ul className="flex flex-col gap-3">{past.slice(0, 20).map(render)}</ul>
        </Section>
      )}
    </div>
  )
}
