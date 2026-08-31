import Link from 'next/link'
import { Badge, Button } from '@/components/ui'
import { bookSession } from '@/actions/bookings'
import { getDictionary, loc, type Locale } from '@/lib/i18n'
import { formatMnt, formatTime, weekdayShort, formatDate } from '@/lib/format'
import type { SessionView } from '@/lib/data'

/**
 * Хуваарийн нэгж — МӨР.
 *
 * `SessionCard` нь хайрцаг: хуваарийн хуудсанд долоо хоногийн тор үүсгэхэд
 * тохирно. Харин нүүрэнд ердөө 4 хичээл дараалан гарах бөгөөд уншигч
 * тэдгээрийг ХАРЬЦУУЛНА — «хамгийн эрт нь хэд вэ, аль нь дүүрсэн бэ».
 * Харьцуулалт нь тор дээр биш, эгнээ дээр л ажилладаг: цаг бүр нэг
 * баганад, үнэ бүр нэг баганад буудаг.
 */
export function SessionRow({ session, locale }: { session: SessionView; locale: Locale }) {
  const t = getDictionary(locale)
  const cancelled = session.status === 'cancelled'
  const full = session.seatsLeft === 0
  const past = new Date(session.starts_at) <= new Date()
  const dimmed = cancelled || past

  return (
    <li
      className={`group relative grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-4 py-6 transition-[background-color,translate] duration-300 lg:grid-cols-[8.5rem_1fr_auto] ${
        dimmed ? 'opacity-55' : 'hover:translate-x-1 hover:bg-surface/70'
      }`}
    >
      {/* Цаг — мөрийн зангуу. Бүх мөрөнд ижил өргөнтэй багана тул нүд
          доошоо шууд гүйнэ. */}
      <div className="col-span-2 flex items-baseline gap-3 lg:col-span-1 lg:block">
        <p className="font-display origin-left text-[2.4rem] leading-none font-bold tracking-[-0.045em] tabular-nums transition-transform duration-300 ease-out group-hover:scale-105">
          {formatTime(session.starts_at)}
        </p>
        <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase lg:mt-2">
          {weekdayShort(session.starts_at, locale)} · {formatDate(session.starts_at, locale)}
        </p>
      </div>

      <div className="min-w-0">
        {/* Холбоос нь бүтэн мөрөнд тархана — гар хаана ч буусан ажиллана */}
        <Link
          href={`/${locale}/schedule/${session.id}`}
          className="text-lg font-semibold before:absolute before:inset-0 before:content-[''] hover:underline hover:underline-offset-4"
        >
          {session.classType ? loc(session.classType, 'name', locale) : '—'}
        </Link>
        <p className="mt-1 text-sm text-muted">
          {session.instructor?.name ?? '—'}
          {session.location ? ` · ${session.location.name}` : ''}
          {session.classType ? ` · ${t.level[session.classType.level]}` : ''}
        </p>
      </div>

      <div className="col-span-2 flex items-center gap-4 justify-self-start lg:col-span-1 lg:justify-self-end">
        {cancelled ? (
          <Badge tone="danger">{t.schedule.cancelled}</Badge>
        ) : full ? (
          <Badge tone="warn">{t.common.full}</Badge>
        ) : (
          <Badge tone={session.seatsLeft <= 3 ? 'warn' : 'neutral'}>
            {session.seatsLeft} {t.schedule.seatsLeft}
          </Badge>
        )}

        <span className="font-display text-base font-bold tabular-nums">
          {formatMnt(session.price)}
        </span>

        {!dimmed && !full && (
          /* Мөрийн холбоосын ДЭЭР байх ёстой — эс тэгвэл товч дарахад
             дэлгэрэнгүй хуудас руу үсэрнэ. */
          <form action={bookSession} className="relative z-10">
            <input type="hidden" name="session_id" value={session.id} />
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" className="px-4 py-2">
              {t.schedule.book}
            </Button>
          </form>
        )}
      </div>
    </li>
  )
}
