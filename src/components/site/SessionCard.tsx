import Link from 'next/link'
import { Badge, Button } from '@/components/ui'
import { bookSession } from '@/actions/bookings'
import { getDictionary, loc, type Locale } from '@/lib/i18n'
import { formatMnt, formatTime, weekdayShort, formatDate } from '@/lib/format'
import type { SessionView } from '@/lib/data'

/**
 * Хуваарийн нэгж хайрцаг.
 *
 * Харааны гол цэг нь ЦАГ — сурагч эхлээд «хэдэн цагт вэ» гэдгийг хардаг,
 * дараа нь хичээлийн нэрийг. Тиймээс цаг нь том display үсгээр, нэр нь
 * доор нь энгийн жинтэй.
 */
export function SessionCard({
  session,
  locale,
  booked = false,
  back,
}: {
  session: SessionView
  locale: Locale
  booked?: boolean
  back?: string
}) {
  const t = getDictionary(locale)
  const cancelled = session.status === 'cancelled'
  const full = session.seatsLeft === 0
  const past = new Date(session.starts_at) <= new Date()
  const dimmed = cancelled || past

  return (
    <article
      className={`card card-link flex flex-col gap-5 p-6 ${dimmed ? 'opacity-55' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
            {weekdayShort(session.starts_at, locale)} · {formatDate(session.starts_at, locale)}
          </p>
          <p className="font-display mt-1.5 text-3xl leading-none font-bold tracking-[-0.04em] tabular-nums">
            {formatTime(session.starts_at)}
          </p>
          <p className="mt-1 text-xs text-muted tabular-nums">
            {formatTime(session.ends_at)} хүртэл
          </p>
        </div>

        {cancelled ? (
          <Badge tone="danger">{t.schedule.cancelled}</Badge>
        ) : booked ? (
          <Badge tone="good">{t.schedule.booked}</Badge>
        ) : full ? (
          <Badge tone="warn">{t.common.full}</Badge>
        ) : (
          <Badge tone={session.seatsLeft <= 3 ? 'warn' : 'neutral'}>
            {session.seatsLeft} {t.schedule.seatsLeft}
          </Badge>
        )}
      </div>

      <div className="min-w-0 border-t border-line pt-4">
        <Link
          href={`/${locale}/schedule/${session.id}`}
          className="text-lg font-semibold transition-colors hover:text-foreground"
        >
          {session.classType ? loc(session.classType, 'name', locale) : '—'}
        </Link>
        <p className="mt-1.5 text-sm text-muted">
          {session.instructor?.name ?? '—'}
          {session.location ? ` · ${session.location.name}` : ''}
        </p>
        {session.classType && (
          <p className="mt-0.5 text-xs text-muted">{t.level[session.classType.level]}</p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="font-display text-base font-bold tabular-nums">
          {formatMnt(session.price)}
        </span>

        {!dimmed && !booked && !full && (
          <form action={bookSession}>
            <input type="hidden" name="session_id" value={session.id} />
            <input type="hidden" name="locale" value={locale} />
            {back && <input type="hidden" name="back" value={back} />}
            <Button type="submit" className="px-4 py-2">
              {t.schedule.book}
            </Button>
          </form>
        )}
      </div>
    </article>
  )
}
