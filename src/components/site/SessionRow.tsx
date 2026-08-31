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
 * тохирно. Харин нүүрэнд цөөн хичээл дараалан гарах бөгөөд уншигч тэдгээрийг
 * ХАРЬЦУУЛНА — «хамгийн эрт нь хэд вэ, аль нь дүүрсэн бэ». Харьцуулалт нь
 * тор дээр биш эгнээ дээр л ажилладаг: цаг бүр нэг баганад, үнэ бүр нэг
 * баганад буудаг.
 *
 * ── Утас ⇄ дэлгэц ──────────────────────────────────────────────────────
 * Утсан дээр гурван багана боломжгүй. Тиймээс мөр нь БАГАНА болж эргэнэ:
 * цаг + өдөр дээрээ, нэр дунд, суудал/үнэ/товч доор нэг мөрөнд. Энэ нь
 * ширээний зохиомжийг шахсан хувилбар БИШ — утсанд зориулж дахин өрсөн
 * дараалал.
 */
export function SessionRow({ session, locale }: { session: SessionView; locale: Locale }) {
  const t = getDictionary(locale)
  const cancelled = session.status === 'cancelled'
  const full = session.seatsLeft === 0
  const past = new Date(session.starts_at) <= new Date()
  const dimmed = cancelled || past

  return (
    <li
      data-rv
      className={`group relative border-b border-line transition-colors duration-300 ${
        dimmed ? 'opacity-50' : 'hover:bg-surface'
      }`}
    >
      <div className="flex flex-col gap-5 py-7 md:grid md:grid-cols-[9rem_minmax(0,1fr)_auto] md:items-center md:gap-8 md:py-8">
        {/* ── Цаг — мөрийн зангуу ─────────────────────────────────────
            Бүх мөрөнд ижил өргөнтэй багана тул нүд доошоо шууд гүйнэ. */}
        <div className="flex items-baseline gap-3 md:block">
          <p className="t-num origin-left text-[2.5rem] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] md:text-[2.75rem]">
            {formatTime(session.starts_at)}
          </p>
          <p className="t-label text-muted md:mt-2.5">
            {weekdayShort(session.starts_at, locale)}
            <span className="text-faint"> · </span>
            {formatDate(session.starts_at, locale)}
          </p>
        </div>

        <div className="min-w-0">
          {/* Холбоос нь бүтэн мөрөнд тархана — гар хаана ч буусан ажиллана */}
          <Link
            href={`/${locale}/schedule/${session.id}`}
            className="t-h3 before:absolute before:inset-0 before:content-['']"
          >
            {session.classType ? loc(session.classType, 'name', locale) : '—'}
          </Link>
          <p className="t-small mt-1.5 text-muted">
            {session.instructor?.name ?? '—'}
            {session.location ? ` · ${session.location.name}` : ''}
            {session.classType ? ` · ${t.level[session.classType.level]}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 md:flex-nowrap md:justify-end">
          {cancelled ? (
            <Badge tone="danger">{t.schedule.cancelled}</Badge>
          ) : full ? (
            <Badge tone="warn">{t.common.full}</Badge>
          ) : (
            <Badge tone={session.seatsLeft <= 3 ? 'warn' : 'neutral'}>
              {session.seatsLeft} {t.schedule.seatsLeft}
            </Badge>
          )}

          <span className="t-small ml-auto font-semibold tabular-nums md:ml-0">
            {formatMnt(session.price)}
          </span>

          {!dimmed && !full && (
            /* Форм нь мөрийн холбоосын ДЭЭР байх ёстой — эс тэгвэл товч
               дарахад дэлгэрэнгүй хуудас руу үсэрнэ. */
            <form action={bookSession} className="relative z-10">
              <input type="hidden" name="session_id" value={session.id} />
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" variant="secondary" className="btn-sm">
                {t.schedule.book}
              </Button>
            </form>
          )}
        </div>
      </div>
    </li>
  )
}
