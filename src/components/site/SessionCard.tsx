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
 * дараа нь хичээлийн нэрийг. Тиймээс цаг нь том serif -ээр, нэр нь доор
 * нь grotesque -ээр: хоёр өөр дуу хоолой = хоёр өөр төрлийн мэдээлэл.
 *
 * Зүүн ирмэгийн зураас нь hover дээр дээрээс доош татагдана — олон хайрцаг
 * зэрэгцэхэд аль нь гарын доор байгааг өнгөгүйгээр заана.
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
      data-rv
      className={`card card-link group relative flex flex-col gap-6 overflow-hidden p-6 sm:p-7 ${
        dimmed ? 'opacity-50' : ''
      }`}
    >
      {!dimmed && (
        <span
          aria-hidden
          className="absolute top-0 bottom-0 left-0 w-px origin-top scale-y-0 bg-foreground transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100"
        />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="t-label text-muted">
            {weekdayShort(session.starts_at, locale)}
            <span className="text-faint"> · </span>
            {formatDate(session.starts_at, locale)}
          </p>
          {/* `whitespace-nowrap` — эхлэх ба дуусах цаг хоёр мөр болж хуваагдвал
              цаг нь нэг тоо биш, хоёр тусдаа зүйл мэт уншигдана. */}
          <p className="mt-3 flex items-baseline gap-2.5 whitespace-nowrap">
            <span className="t-num text-[2.5rem]">{formatTime(session.starts_at)}</span>
            <span className="t-meta text-muted">→ {formatTime(session.ends_at)}</span>
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

      <div className="min-w-0 border-t border-line pt-5">
        <Link
          href={`/${locale}/schedule/${session.id}`}
          className="t-h3 before:absolute before:inset-0 before:content-['']"
        >
          {session.classType ? loc(session.classType, 'name', locale) : '—'}
        </Link>
        <p className="t-small mt-1.5 text-muted">
          {session.instructor?.name ?? '—'}
          {session.location ? ` · ${session.location.name}` : ''}
        </p>
        {session.classType && (
          <p className="t-meta mt-1 text-faint">{t.level[session.classType.level]}</p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-4 border-t border-line pt-5">
        <span className="t-small font-semibold tabular-nums">{formatMnt(session.price)}</span>

        {!dimmed && !booked && !full && (
          <form action={bookSession} className="relative z-10">
            <input type="hidden" name="session_id" value={session.id} />
            <input type="hidden" name="locale" value={locale} />
            {back && <input type="hidden" name="back" value={back} />}
            <Button type="submit" variant="secondary" className="btn-sm">
              {t.schedule.book}
            </Button>
          </form>
        )}
      </div>
    </article>
  )
}
