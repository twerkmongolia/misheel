import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Alert, Empty } from '@/components/ui'
import { SessionList } from '@/components/site/SessionList'
import { bookingErrorMessage } from '@/lib/errors'
import { getDictionary, loc, isLocale } from '@/lib/i18n'
import { addDays, dayKey, dayOfMonth, formatDayShort, weekdayShort, weekStart } from '@/lib/format'
import {
  getClassTypes,
  getInstructors,
  getMyBookedSessionIds,
  getMyWaitlistSessionIds,
  getSessionsBetween,
} from '@/lib/data'
import { getUser } from '@/lib/auth/dal'
import { PageBanner } from '@/components/site/PageBanner'

type Search = {
  w?: string
  class?: string
  instructor?: string
  level?: string
  booked?: string
  cancelled?: string
  waitlisted?: string
  left?: string
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
  const [booked, waiting] = await Promise.all([
    getMyBookedSessionIds(user?.id ?? null),
    getMyWaitlistSessionIds(user?.id ?? null),
  ])

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

  /* Эвхэгдсэн үед шүүлт нь юугаар шүүгдсэнээ ӨӨРӨӨ хэлэх ёстой — эс тэгвэл
     «яагаад ганцхан хичээл байна вэ» гэдэг нь тайлбаргүй үлдэнэ. */
  const activeLabels = filters
    .filter((row) => row.active)
    .map((row) => row.options.find((option) => option.value === row.active)?.label)
    .filter(Boolean) as string[]

  return (
    <>
      <PageBanner page="schedule" title={t.schedule.title} lead={t.schedule.subtitle} />

      <div className="shell flex flex-col gap-8 pt-10 pb-[var(--bay-sm)] sm:pt-12">
        {search.booked && <Alert tone="good">{t.booking.success}</Alert>}
        {search.cancelled && <Alert tone="neutral">{t.booking.cancelled}</Alert>}
        {search.waitlisted && <Alert tone="good">{t.schedule.waitlisted}</Alert>}
        {search.left && <Alert tone="neutral">{t.schedule.waitlistLeft}</Alert>}
        {search.error && <Alert tone="danger">{bookingErrorMessage(t, search.error)}</Alert>}

        {/* ══ 1 · БИ ХААНА БАЙНА ═════════════════════════════════════════
            Долоо хоногийн шилжилт БА долоо хоногийн тойм нь урьд нь хоёр
            тусдаа блок байв: гарчиг, сум нэг мөрөнд, доор нь өдрүүдийн
            зурвас. Хоёулаа нэг л асуултад («аль долоо хоног, аль өдөр»)
            хариулдаг тул НЭГ хяналт болгож нийлүүлэв — сум нь зурвасын
            хоёр үзүүрт суусан есөн нүдтэй эгнээ. Нэг зүйлийг хоёр газар
            хайх шаардлагагүй болно. */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 className="t-h3">{offset === 0 ? t.schedule.thisWeek : range}</h2>
            <p className="t-meta text-muted tabular-nums">
              {offset === 0 && (
                <>
                  {range}
                  <span className="text-faint"> · </span>
                </>
              )}
              {filtered.length} {t.schedule.sessionCount}
              {offset !== 0 && (
                <>
                  <span className="text-faint"> · </span>
                  <Link href={weekLink(0)} className="lnk hover:text-foreground">
                    {t.schedule.thisWeek}
                  </Link>
                </>
              )}
            </p>
          </div>

          <nav className="grid grid-cols-[2rem_repeat(7,minmax(0,1fr))_2rem] divide-x divide-line overflow-hidden border-y border-line sm:grid-cols-[2.75rem_repeat(7,minmax(0,1fr))_2.75rem]">
            <Link
              href={weekLink(offset - 1)}
              aria-label={t.schedule.weekPrev}
              className="grid place-items-center text-muted transition-colors duration-200 hover:bg-surface hover:text-foreground"
            >
              <span aria-hidden>←</span>
            </Link>

            {week.map((day) => {
              const isToday = day.key === todayKey
              const open = day.count > 0

              /* Өнөөдөр нь ЭРГЭНЭ — хар дэвсгэр, цагаан тоо. Монохром
                 системд «энэ бол өнөөдөр» гэдгийг хэлэх хамгийн хүчтэй
                 арга нь өнгө нэмэх биш, байгаа хоёр өнгөө сольж тавих. */
              const cell = [
                'group flex flex-col items-center py-3.5 transition-colors duration-200',
                isToday ? 'bg-foreground text-background' : open ? 'hover:bg-surface' : 'opacity-40',
              ].join(' ')

              const body = (
                <>
                  <span className={`t-label ${isToday ? 'opacity-70' : 'text-muted'}`}>
                    {weekdayShort(day.date, locale)}
                  </span>
                  <span className="t-num mt-1.5 text-[1.375rem] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 sm:text-[1.75rem]">
                    {dayOfMonth(day.date)}
                  </span>
                  <span
                    className={`t-meta mt-1 tabular-nums ${
                      isToday ? 'opacity-70' : open ? 'text-foreground' : 'text-faint'
                    }`}
                  >
                    {day.count || '—'}
                  </span>
                </>
              )

              return open ? (
                <Link key={day.key} href={`#day-${day.key}`} className={cell}>
                  {body}
                </Link>
              ) : (
                <span key={day.key} className={cell} aria-label={t.schedule.noneThisDay}>
                  {body}
                </span>
              )
            })}

            <Link
              href={weekLink(offset + 1)}
              aria-label={t.schedule.weekNext}
              className="grid place-items-center text-muted transition-colors duration-200 hover:bg-surface hover:text-foreground"
            >
              <span aria-hidden>→</span>
            </Link>
          </nav>
        </section>

        {/* ══ 2 · ШҮҮЛТ — ЭВХЭГДСЭН ══════════════════════════════════════
            Гурван эгнээ чип нь хуудасны эхэнд 200px эзэлж, хичээлүүдийг
            доош түлхдэг байв. Хэрэглэгчийн дийлэнх нь юу ч шүүхгүй —
            тэдэнд энэ нь зөвхөн саад. Тиймээс эвхэгдэнэ: ганц мөр үлдэж,
            шүүсэн үед л сонголтоо ТЕКСТЭЭР хэлж, өөрөө нээлттэй гарна.

            `<details>` нь JavaScript шаарддаггүй бөгөөд хаяганд шүүлт
            байвал `open` тул хуудас сэргээхэд төлөв нь хадгалагдана. */}
        <details open={hasFilter} className="faq group border-y border-line">
          <summary className="flex cursor-pointer list-none items-center gap-4 py-4 marker:content-none">
            <span className="t-label shrink-0 text-muted">{t.schedule.filterTitle}</span>

            <span className="t-meta min-w-0 flex-1 truncate">
              {activeLabels.length > 0 ? (
                <span className="text-foreground">{activeLabels.join(' · ')}</span>
              ) : (
                <span className="text-faint">{t.common.all}</span>
              )}
            </span>

            <span
              aria-hidden
              className="relative grid h-5 w-5 shrink-0 place-items-center text-muted transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:rotate-90"
            >
              <span className="absolute h-px w-4 bg-current" />
              <span className="absolute h-4 w-px bg-current transition-opacity duration-300 group-open:opacity-0" />
            </span>
          </summary>

          <div className="flex flex-col gap-4 pb-6">
            {filters.map((row) => (
              <div
                key={row.key}
                className="flex flex-col gap-2 sm:grid sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:items-center sm:gap-4"
              >
                <span className="t-label text-faint">{row.label}</span>
                {/* Нарийн дэлгэцэд эгнээ нь хэвтээ гүйнэ — эвхэгдвэл гурван
                    шүүлт хоорондоо холилдож, аль чип аль эгнээнийх нь
                    мэдэгдэхээ болино. */}
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

            {hasFilter && (
              <Link
                href={href({})}
                className="t-meta self-start text-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-foreground"
              >
                {t.schedule.clear}
              </Link>
            )}
          </div>
        </details>

        {/* ══ 3 · ХИЧЭЭЛҮҮД ══════════════════════════════════════════════
            Нүүр хуудасны «Ойрын хичээлүүд» -тэй ЯГ ижил бүрдэл: зүүн талд
            наалдмал өдрийн зангуу, баруун талд нарийссан мөрүүд. */}
        {filtered.length === 0 ? (
          <Empty>{t.schedule.noSessions}</Empty>
        ) : (
          <SessionList
            sessions={filtered}
            locale={locale}
            booked={booked}
            waiting={waiting}
            back={`/${locale}/schedule${offset !== 0 ? `?w=${offset}` : ''}`}
          />
        )}
      </div>
    </>
  )
}
