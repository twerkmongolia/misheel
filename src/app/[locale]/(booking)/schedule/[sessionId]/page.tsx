import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Alert, Badge, Button, ButtonLink, Card, PageHeader } from '@/components/ui'
import { Media } from '@/components/site/media'
import { bookSession, cancelBooking } from '@/actions/bookings'
import { bookingErrorMessage } from '@/lib/errors'
import { getDictionary, loc, isLocale } from '@/lib/i18n'
import { formatMnt, formatTime, weekdayLong, formatDate } from '@/lib/format'
import { getSession } from '@/lib/data'
import { getUser } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; sessionId: string }>
  searchParams: Promise<{ error?: string; booked?: string }>
}) {
  const [{ locale, sessionId }, search] = await Promise.all([params, searchParams])
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const session = await getSession(sessionId)
  if (!session) notFound()

  const user = await getUser()

  // Тухайн хэрэглэгчийн энэ хичээл дээрх идэвхтэй бүртгэл
  let myBookingId: string | null = null
  if (user) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('bookings')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .in('status', ['pending', 'confirmed', 'attended'])
      .maybeSingle()
    myBookingId = data?.id ?? null
  }

  const back = `/${locale}/schedule/${sessionId}`
  const cancelled = session.status === 'cancelled'
  const past = new Date(session.starts_at) <= new Date()
  const full = session.seatsLeft === 0

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={session.classType ? loc(session.classType, 'name', locale) : t.nav.schedule}
        lead={session.classType ? loc(session.classType, 'desc', locale) : undefined}
      />

      {search.booked && <Alert tone="good">{t.booking.success}</Alert>}
      {search.error && <Alert tone="danger">{bookingErrorMessage(t, search.error)}</Alert>}

      <div className="grid gap-8 md:grid-cols-[1.1fr_1fr]">
        <Media
          src={session.classType?.cover_url}
          alt={session.classType ? loc(session.classType, 'name', locale) : ''}
          ratio="aspect-[4/3]"
          priority
        />

        <Card className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted">
                {weekdayLong(session.starts_at, locale)} · {formatDate(session.starts_at, locale)}
              </p>
              <p className="font-display text-2xl font-bold tabular-nums">
                {formatTime(session.starts_at)}–{formatTime(session.ends_at)}
              </p>
            </div>
            {cancelled ? (
              <Badge tone="danger">{t.schedule.cancelled}</Badge>
            ) : full && !myBookingId ? (
              <Badge tone="warn">{t.common.full}</Badge>
            ) : (
              <Badge tone="neutral">
                {session.seatsLeft} {t.schedule.seatsLeft}
              </Badge>
            )}
          </div>

          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex gap-3">
              <dt className="w-24 text-muted">{t.schedule.filterInstructor}</dt>
              <dd>
                {session.instructor ? (
                  <Link
                    href={`/${locale}/instructors/${session.instructor.slug}`}
                    className="hover:text-foreground"
                  >
                    {session.instructor.name}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-24 text-muted">{t.schedule.at}</dt>
              <dd>{session.location?.name ?? '—'}</dd>
            </div>
            {session.location?.address_mn && (
              <div className="flex gap-3">
                <dt className="w-24 text-muted" />
                <dd className="text-muted">{loc(session.location, 'address', locale)}</dd>
              </div>
            )}
            <div className="flex gap-3">
              <dt className="w-24 text-muted">{t.common.price}</dt>
              <dd className="font-medium tabular-nums">{formatMnt(session.price)}</dd>
            </div>
          </dl>

          {session.note && <Alert tone="neutral">{session.note}</Alert>}

          {cancelled ? (
            <Alert tone="danger">{t.schedule.cancelled}</Alert>
          ) : myBookingId ? (
            <div className="flex flex-col gap-3">
              <Alert tone="good">{t.schedule.booked}</Alert>
              {!past && (
                <form action={cancelBooking}>
                  <input type="hidden" name="booking_id" value={myBookingId} />
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="back" value={back} />
                  <Button type="submit" variant="danger">
                    {t.booking.cancelBooking}
                  </Button>
                </form>
              )}
            </div>
          ) : past ? (
            <Alert tone="neutral">{t.booking.errors.SESSION_STARTED}</Alert>
          ) : full ? (
            <Alert tone="warn">{t.booking.errors.SESSION_FULL}</Alert>
          ) : user ? (
            <form action={bookSession}>
              <input type="hidden" name="session_id" value={session.id} />
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="back" value={back} />
              <Button type="submit">{t.schedule.book}</Button>
            </form>
          ) : (
            <ButtonLink href={`/${locale}/login?next=${encodeURIComponent(back)}`}>
              {t.schedule.loginToBook}
            </ButtonLink>
          )}
        </Card>
      </div>
    </div>
  )
}
