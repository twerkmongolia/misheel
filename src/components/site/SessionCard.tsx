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
      className={`card card-link group relative flex flex-col gap-5 overflow-hidden p-6 ${
        dimmed ? 'opacity-55' : ''
      }`}
    >
      {/* Зүүн ирмэгийн зураас — hover дээр дээрээс доош татагдана. Хайрцаг
          олон байхад аль нь гарын доор байгааг өнгөгүйгээр хэлнэ. */}
      {!dimmed && (
        <span
          aria-hidden
          className="absolute top-0 bottom-0 left-0 w-[2px] origin-top scale-y-0 bg-foreground transition-transform duration-300 ease-out group-hover:scale-y-100"
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">
            {weekdayShort(session.starts_at, locale)} · {formatDate(session.starts_at, locale)}
          </p>
          {/* Цаг ба «хүртэл» -ийг нэг суурь дээр — эхлэл нь том, төгсгөл нь жижиг */}
          <p className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-[2.6rem] leading-none font-bold tracking-[-0.045em] tabular-nums">
              {formatTime(session.starts_at)}
            </span>
            <span className="text-xs text-muted tabular-nums">
              → {formatTime(session.ends_at)}
            </span>
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
        {/* Бүтэн хайрцгийг дарж болно — холбоос нь өөрөө дээр нь тархана */}
        <Link
          href={`/${locale}/schedule/${session.id}`}
          className="text-lg font-semibold transition-colors before:absolute before:inset-0 before:content-[''] hover:text-foreground"
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

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line/60 pt-4">
        <span className="font-display text-base font-bold tabular-nums">
          {formatMnt(session.price)}
        </span>

        {!dimmed && !booked && !full && (
          /* Форм нь хайрцгийн холбоосын ДЭЭР байх ёстой — эс тэгвэл товч дарахад
             дэлгэрэнгүй хуудас руу үсэрнэ. */
          <form action={bookSession} className="relative z-10">
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
