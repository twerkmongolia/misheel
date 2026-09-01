import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Alert, Empty } from '@/components/ui'
import { SessionList } from '@/components/site/SessionList'
import { bookingErrorMessage } from '@/lib/errors'
import { getDictionary, loc, isLocale } from '@/lib/i18n'
import { addDays, dayKey, dayOfMonth, formatDayShort, weekdayShort, weekStart } from '@/lib/format'
import { getClassTypes, getInstructors, getMyBookedSessionIds, getSessionsBetween } from '@/lib/data'
import { getUser } from '@/lib/auth/dal'
import { PageBanner } from '@/components/site/PageBanner'

type Search = {
  w?: string
  class?: string
  instructor?: string
  level?: string
  booked?: string
  cancelled?: string
  error?: string
}

/* ───────────────────────────────────────────────────────────────────────────
   ХУВААРИЙН ХУУДАС

   Уншигч энд ГУРВАН асуулттай ирнэ, хуудас нь тэр дарааллаар хариулна:

     1. Би ямар долоо хоногийг харж байна вэ?  → долоо хоногийн зурвас
     2. Аль өдөр хичээл байгаа вэ?             → 7 хоногийн тойм
     3. Тэр өдөр яг юу байгаа вэ?              → өдрөөр бүлэглэсэн жагсаалт

   Өмнөх хувилбарт эхний хоёр асуулт хариултгүй үлддэг байв: том шүүлтүүрийн
   хайрцаг эхэлж тааралдаад («Бүгд / Бүгд / Бүгд» — юу ч хэлдэггүй), долоо
   хоногийн шилжилт нь бүтэн өргөнд сарнисан нимгэн текст байсан бөгөөд аль
   өдөр хоосон, аль нь дүүрэн болохыг мэдэхийн тулд бүх хуудсыг гүйлгэх
   шаардлагатай байлаа.
   ─────────────────────────────────────────────────────────────────────── */

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

  const hasFilter = Boolean(search.class || search.instructor || search.level)

  /* Долоо хоногийн тойм — өдөр тус бүрд хэдэн хичээл байгаа. Хоосон өдөр ч
     ЖАГСААЛТАД БАЙХ ёстой: «Бямбад хичээл алга» гэдгийг мэдэхийн тулд бүх
     хуудсыг гүйлгэх шаардлагагүй болно. */
  const counts = new Map<string, number>()
  for (const session of filtered) {
    const key = dayKey(session.starts_at)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const week = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(from, index).toISOString()
    const key = dayKey(date)
    return { key, date, count: counts.get(key) ?? 0 }
  })

  const todayKey = dayKey(new Date().toISOString())
  const range = `${formatDayShort(from.toISOString(), locale)} – ${formatDayShort(
    addDays(from, 6).toISOString(),
    locale,
  )}`

  /* Хуудасны бүх төлөв ХАЯГАНД амьдарна: долоо хоног, гурван шүүлт. Тиймээс
     ганц холбоос үүсгэгчээс бүх шилжилт гарна — долоо хоног солих ч, шүүлт
     солих ч ялгаагүй. Ингэснээр «шүүлтээ хадгалаад дараа долоо хоног руу
     очих» гэх мэт хослол өөрөө ажиллана. */
  type Filters = { w?: number; class?: string; instructor?: string; level?: string }

  const href = (next: Filters) => {
    const query = new URLSearchParams()
    const week = next.w ?? offset
    if (week !== 0) query.set('w', String(week))
    if (next.class) query.set('class', next.class)
    if (next.instructor) query.set('instructor', next.instructor)
    if (next.level) query.set('level', next.level)
    const qs = query.toString()
    return `/${locale}/schedule${qs ? `?${qs}` : ''}`
  }

  const current: Filters = {
    class: search.class,
    instructor: search.instructor,
    level: search.level,
  }

  const weekLink = (week: number) => href({ ...current, w: week })

  /* Шүүлтийн эгнээ — нэр, идэвхтэй утга, сонголтууд. Хоосон мөр («Бүгд» -ээс
     өөр сонголтгүй) огт гарахгүй: сонгох юмгүй шүүлт бол чимээ. */
  const filters = [
    {
      key: 'class' as const,
      label: t.schedule.filterClass,
      active: search.class ?? '',
      options: classTypes.map((item) => ({
        value: item.slug,
        label: loc(item, 'name', locale),
      })),
    },
    {
      key: 'instructor' as const,
      label: t.schedule.filterInstructor,
      active: search.instructor ?? '',
      options: instructors.map((item) => ({ value: item.slug, label: item.name })),
    },
    {
      key: 'level' as const,
      label: t.schedule.filterLevel,
      active: search.level ?? '',
      options: [
        { value: 'beginner', label: t.level.beginner },
        { value: 'intermediate', label: t.level.intermediate },
        { value: 'advanced', label: t.level.advanced },
      ],
    },
  ].filter((row) => row.options.length > 0)

  return (
    <>
      <PageBanner
        page="schedule"
        title={t.schedule.title}
        lead={t.schedule.subtitle}
      />

      <div className="shell flex flex-col gap-10 pt-10 sm:pt-12">
      {search.booked && <Alert tone="good">{t.booking.success}</Alert>}
      {search.cancelled && <Alert tone="neutral">{t.booking.cancelled}</Alert>}
      {search.error && <Alert tone="danger">{bookingErrorMessage(t, search.error)}</Alert>}

      {/* ══ 1 · БИ ХААНА БАЙНА ═══════════════════════════════════════════
          Долоо хоног нь хуудасны ГАРЧИГ — нимгэн навигацийн мөр биш.
          Хажууд нь тухайн долоо хоногийн нийт тоо: «энэ долоо хоног дүүрэн
          үү, хоосон уу» гэдгийг ганц харцаар хэлнэ. */}
      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <h2 className="t-h3">{offset === 0 ? t.schedule.thisWeek : range}</h2>
            <p className="t-meta mt-1.5 text-muted tabular-nums">
              {offset === 0 && (
                <>
                  {range}
                  <span className="text-faint"> · </span>
                </>
              )}
              {filtered.length} {t.schedule.sessionCount}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {offset !== 0 && (
              <Link href={weekLink(0)} className="btn btn-bare btn-sm">
                {t.schedule.thisWeek}
              </Link>
            )}
            <Link href={weekLink(offset - 1)} aria-label={t.schedule.weekPrev} className="icon-btn">
              <span aria-hidden>←</span>
            </Link>
            <Link href={weekLink(offset + 1)} aria-label={t.schedule.weekNext} className="icon-btn">
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        {/* ══ 2 · АЛЬ ӨДӨР ХИЧЭЭЛ БАЙНА ══════════════════════════════════
            Долоо хоногийн тойм. Хичээлтэй өдөр нь ДАРАГДАЖ жагсаалтын
            тухайн бүлэг рүү үсэрнэ; хоосон өдөр нь дарагдахгүй, тоо нь
            зураас болно. Ингэснээр «Бямбад юу байна?» гэсэн асуултад
            гүйлгэлгүйгээр хариулна. */}
        <nav className="grid grid-cols-7 divide-x divide-line overflow-hidden border-y border-line">
          {week.map((day) => {
            const isToday = day.key === todayKey
            const label = (
              <>
                <span className="t-label text-muted">{weekdayShort(day.date, locale)}</span>
                <span className="t-num mt-1.5 text-[1.375rem] sm:text-[1.75rem]">
                  {dayOfMonth(day.date)}
                </span>
                <span
                  className={`t-meta mt-1 tabular-nums ${day.count ? 'text-foreground' : 'text-faint'}`}
                >
                  {day.count || '—'}
                </span>
              </>
            )

            const shell = `flex flex-col items-center py-3 transition-colors duration-200 ${
              isToday ? 'bg-surface-2' : ''
            }`

            return day.count > 0 ? (
              <Link key={day.key} href={`#day-${day.key}`} className={`${shell} hover:bg-surface-3`}>
                {label}
              </Link>
            ) : (
              <span key={day.key} className={`${shell} opacity-45`} aria-label={t.schedule.noneThisDay}>
                {label}
              </span>
            )
          })}
        </nav>
      </section>

      {/* ══ 3 · ШҮҮЛТ ════════════════════════════════════════════════════
          Уугуул `<select>` -ийг ХАСАВ. Тэр нь дарахад үйлдлийн системийн
          өөрийн цонхыг дуудаж, монохром системийн дундуур цайвар дугуйрсан
          хайрцаг гаргаж ирдэг — загварт огт захирагддаггүй.

          Оронд нь холбоос-чип. Гурван давуу тал:
            · Бүх сонголт НЭЭЛГҮЙГЭЭР харагдана — ямар хичээл, ямар багш
              байдгийг шүүхээсээ өмнө мэднэ;
            · «Хайх» товч хэрэггүй — дарсан даруйдаа шүүгдэнэ;
            · JavaScript шаардахгүй, зүгээр нэг холбоос. */}
      <section className="flex flex-col gap-4 border-y border-line py-6">
        <div className="flex items-center justify-between gap-4">
          <span className="t-label text-muted">{t.schedule.filterTitle}</span>
          {hasFilter && (
            <Link
              href={href({})}
              className="t-meta text-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-foreground"
            >
              {t.schedule.clear}
            </Link>
          )}
        </div>

        {filters.map((row) => (
          <div
            key={row.key}
            className="flex flex-col gap-2 sm:grid sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:items-center sm:gap-4"
          >
            <span className="t-label text-faint">{row.label}</span>
            {/* Нарийн дэлгэцэд эгнээ нь хэвтээ гүйнэ — эвхэгдвэл гурван
                шүүлт хоорондоо холилдож, аль чип аль эгнээнийх нь мэдэгдэхээ
                болино. */}
            <div className="rail flex gap-2 overflow-x-auto">
              <Link
                href={href({ ...current, [row.key]: undefined })}
                className={`chip ${row.active ? '' : 'chip-on'}`}
              >
                {t.common.all}
              </Link>
              {row.options.map((option) => (
                <Link
                  key={option.value}
                  href={href({ ...current, [row.key]: option.value })}
                  className={`chip ${row.active === option.value ? 'chip-on' : ''}`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ══ 4 · ХИЧЭЭЛҮҮД ════════════════════════════════════════════════
          Нүүр хуудасны «Ойрын хичээлүүд» -тэй ЯГ ижил бүрдэл: зүүн талд
          наалдмал өдрийн зангуу, баруун талд нарийссан мөрүүд. Хоёр хуудас
          хоорондоо шилжихэд уншигч дахин сурах юмгүй. */}
      {filtered.length === 0 ? (
        <Empty>{t.schedule.noSessions}</Empty>
      ) : (
        <SessionList
          sessions={filtered}
          locale={locale}
          booked={booked}
          back={`/${locale}/schedule${offset !== 0 ? `?w=${offset}` : ''}`}
        />
      )}
    </div>
    </>
  )
}
