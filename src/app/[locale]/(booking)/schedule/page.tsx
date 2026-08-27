import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Alert, Empty, PageHeader, Select } from '@/components/ui'
import { SessionCard } from '@/components/site/SessionCard'
import { bookingErrorMessage } from '@/lib/errors'
import { getDictionary, loc, isLocale } from '@/lib/i18n'
import { addDays, dayKey, formatDate, weekdayLong, weekStart } from '@/lib/format'
import { getClassTypes, getInstructors, getMyBookedSessionIds, getSessionsBetween } from '@/lib/data'
import { getUser } from '@/lib/auth/dal'

type Search = {
  w?: string
  class?: string
  instructor?: string
  level?: string
  booked?: string
  cancelled?: string
  error?: string
}

export default async function SchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Search>
}) {
  const [{ locale }, search] = await Promise.all([params, searchParams])
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)

  // Долоо хоногийн шилжилт — -8..8 хооронд хязгаарлав.
  const offset = Math.max(-8, Math.min(8, Number(search.w ?? 0) || 0))
  const from = weekStart(offset)
  const to = addDays(from, 7)

  const [sessions, classTypes, instructors, user] = await Promise.all([
    getSessionsBetween(from, to),
    getClassTypes(true),
    getInstructors(true),
    getUser(),
  ])
  const booked = await getMyBookedSessionIds(user?.id ?? null)

  const filtered = sessions.filter((session) => {
    if (search.class && session.classType?.slug !== search.class) return false
    if (search.instructor && session.instructor?.slug !== search.instructor) return false
    if (search.level && session.classType?.level !== search.level) return false
    return true
  })

  // Өдрөөр бүлэглэнэ (Улаанбаатарын цагаар).
  const days = new Map<string, typeof filtered>()
  for (const session of filtered) {
    const key = dayKey(session.starts_at)
    days.set(key, [...(days.get(key) ?? []), session])
  }

  const weekLink = (next: number) => {
    const query = new URLSearchParams()
    if (next !== 0) query.set('w', String(next))
    if (search.class) query.set('class', search.class)
    if (search.instructor) query.set('instructor', search.instructor)
    if (search.level) query.set('level', search.level)
    const qs = query.toString()
    return `/${locale}/schedule${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t.schedule.title} lead={t.schedule.subtitle} />

      {search.booked && <Alert tone="good">{t.booking.success}</Alert>}
      {search.cancelled && <Alert tone="neutral">{t.booking.cancelled}</Alert>}
      {search.error && <Alert tone="danger">{bookingErrorMessage(t, search.error)}</Alert>}

      {/* Шүүлтүүр — JavaScript-гүйгээр ажилладаг GET форм. */}
      <form className="flex flex-wrap items-end gap-3 card p-5">
        {offset !== 0 && <input type="hidden" name="w" value={offset} />}

        <label className="flex min-w-[9rem] flex-1 flex-col gap-1.5 text-sm">
          <span className="text-muted">{t.schedule.filterClass}</span>
          <Select name="class" defaultValue={search.class ?? ''}>
            <option value="">{t.common.all}</option>
            {classTypes.map((classType) => (
              <option key={classType.id} value={classType.slug}>
                {loc(classType, 'name', locale)}
              </option>
            ))}
          </Select>
        </label>

        <label className="flex min-w-[9rem] flex-1 flex-col gap-1.5 text-sm">
          <span className="text-muted">{t.schedule.filterInstructor}</span>
          <Select name="instructor" defaultValue={search.instructor ?? ''}>
            <option value="">{t.common.all}</option>
            {instructors.map((instructor) => (
              <option key={instructor.id} value={instructor.slug}>
                {instructor.name}
              </option>
            ))}
          </Select>
        </label>

        <label className="flex min-w-[9rem] flex-1 flex-col gap-1.5 text-sm">
          <span className="text-muted">{t.schedule.filterLevel}</span>
          <Select name="level" defaultValue={search.level ?? ''}>
            <option value="">{t.common.all}</option>
            <option value="beginner">{t.level.beginner}</option>
            <option value="intermediate">{t.level.intermediate}</option>
            <option value="advanced">{t.level.advanced}</option>
          </Select>
        </label>

        <button
          type="submit"
          className="rounded-xl border border-line bg-surface-2-2 px-4 py-2.5 text-sm font-medium hover:bg-surface"
        >
          {t.common.search}
        </button>
      </form>

      {/* Долоо хоногийн шилжилт */}
      <nav className="flex items-center justify-between gap-3 text-sm">
        <Link href={weekLink(offset - 1)} className="rounded-lg px-3 py-2 hover:bg-surface-2">
          ← {t.schedule.weekPrev}
        </Link>
        <span className="text-muted tabular-nums">
          {formatDate(from.toISOString(), locale)} – {formatDate(addDays(from, 6).toISOString(), locale)}
        </span>
        <Link href={weekLink(offset + 1)} className="rounded-lg px-3 py-2 hover:bg-surface-2">
          {t.schedule.weekNext} →
        </Link>
      </nav>

      {days.size === 0 ? (
        <Empty>{t.schedule.noSessions}</Empty>
      ) : (
        <div className="flex flex-col gap-8">
          {[...days.entries()].map(([key, daySessions]) => (
            <section key={key} className="flex flex-col gap-3">
              <h2 className="flex items-baseline gap-2 border-b border-line pb-2 text-lg font-semibold">
                {weekdayLong(daySessions[0]!.starts_at, locale)}
                <span className="text-sm font-normal text-muted tabular-nums">
                  {formatDate(daySessions[0]!.starts_at, locale)}
                </span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {daySessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    locale={locale}
                    booked={booked.has(session.id)}
                    back={`/${locale}/schedule${offset !== 0 ? `?w=${offset}` : ''}`}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
