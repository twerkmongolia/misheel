import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge, Empty } from '@/components/ui'
import { Media } from '@/components/site/media'
import { PageBanner } from '@/components/site/PageBanner'
import { getDictionary, loc, isLocale, type Locale } from '@/lib/i18n'
import { formatMnt, formatDate } from '@/lib/format'
import { getCourses, type CourseView } from '@/lib/data'
import type { CourseMode } from '@/lib/supabase/database.types'

/* ───────────────────────────────────────────────────────────────────────────
   АНГИ, КУРС

   Танхим ба онлайн НЭГ жагсаалтад. Хоёр тусдаа хуудас болговол хүн хоёуланг
   нь харьцуулж чадахгүй — гэтэл сонголт нь яг тэр: «би танхимд явж чадах уу,
   эсвэл гэрээсээ үзэх үү». Шүүлтүүр нь хоёр төрлийг ЗЭРЭГЦҮҮЛЖ байгаад,
   хүсвэл л нарийсгана.
   ─────────────────────────────────────────────────────────────────────── */

export default async function CoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ mode?: string }>
}) {
  const [{ locale }, search] = await Promise.all([params, searchParams])
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const all = await getCourses()

  const mode: CourseMode | null =
    search.mode === 'studio' || search.mode === 'online' ? search.mode : null
  const courses = mode ? all.filter((course) => course.mode === mode) : all

  const filters: { key: CourseMode | null; label: string }[] = [
    { key: null, label: t.courses.all },
    { key: 'studio', label: t.courses.studio },
    { key: 'online', label: t.courses.online },
  ]

  const href = (key: CourseMode | null) =>
    key ? `/${locale}/courses?mode=${key}` : `/${locale}/courses`

  return (
    <>
      {/* Гарчиг нь ШҮҮЛТҮҮРЭЭ дагана. Навбараас «Онлайн анги» дарсан хүн
          «Анги, курс» гэсэн гарчигтай хуудсанд буувал зөв газраа ирсэн
          эсэхээ шүүлтүүрийн чипээс хайж баталгаажуулах ёстой болно. */}
      <PageBanner
        page={mode ? `courses-${mode}` : 'courses'}
        title={
          mode === 'studio'
            ? t.nav.studioCourses
            : mode === 'online'
              ? t.nav.onlineCourses
              : t.courses.title
        }
        lead={t.courses.lead}
        fallbackSrc="/media/banners/courses.jpg"
      />

      <div className="shell flex flex-col gap-10 pt-10 sm:pt-12">
        {/* Шүүлтүүр нь НЭГ Л анги байхад утгагүй — сонголтгүй сонголт нь
            хуудсыг өөрөөсөө илүү нарийн мэт харагдуулна. */}
        {all.length > 1 && (
          <nav
            aria-label={t.courses.title}
            className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]"
          >
            {filters.map((filter) => {
              const count = filter.key
                ? all.filter((course) => course.mode === filter.key).length
                : all.length

              return (
                <Link
                  key={filter.label}
                  href={href(filter.key)}
                  aria-current={mode === filter.key ? 'true' : undefined}
                  className={`chip ${mode === filter.key ? 'chip-on' : ''}`}
                >
                  {filter.label}
                  {/* Тоо нь дарахаас ӨМНӨ юу байгааг хэлнэ — хоосон
                      шүүлтүүр рүү дарж мэдэх шаардлагагүй болно. */}
                  <span className="ml-1.5 tabular-nums opacity-60">{count}</span>
                </Link>
              )
            })}
          </nav>
        )}

        {courses.length === 0 ? (
          <Empty>
            {all.length === 0 ? (
              <>
                {t.courses.empty}
                <span className="mt-2 block text-faint">{t.courses.emptyHint}</span>
              </>
            ) : (
              t.courses.emptyFiltered
            )}
          </Empty>
        ) : (
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" data-stagger>
            {courses.map((course, index) => (
              <CourseCard key={course.id} course={course} locale={locale} index={index} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function CourseCard({
  course,
  locale,
  index,
}: {
  course: CourseView
  locale: Locale
  index: number
}) {
  const t = getDictionary(locale)
  const online = course.mode === 'online'

  /* Картан дээрх ГАНЦ мөрийн мета. Гурав, дөрөв багана болгон нэрлэвэл
     карт нь тодорхойлолтын хүснэгт болж, нэр нь живнэ. Онлайнд хамгийн
     чухал нь хичээлийн тоо, танхимд эхлэх өдөр — тус бүр ӨӨРИЙНХӨӨ
     хамгийн эхний асуултад хариулна. */
  const meta = online
    ? course.lesson_count > 0
      ? `${course.lesson_count} ${t.courses.lessons}`
      : null
    : course.starts_on
      ? `${t.courses.startsOn} · ${formatDate(`${course.starts_on}T00:00:00+08:00`, locale)}`
      : loc(course, 'schedule', locale) || null

  return (
    <Link
      href={`/${locale}/courses/${course.slug}`}
      className="group flex flex-col gap-5"
      data-rv
    >
      <div className="relative">
        <Media
          src={course.cover_url}
          alt={loc(course, 'name', locale)}
          seed={index}
          ratio="aspect-[4/3]"
          sizes="(max-width: 640px) 100vw, 33vw"
        />
        {/* Төрөл нь зургийн ДЭЭР — нүд зурган дээр эхэлж буудаг тул
            «танхим уу, онлайн уу» гэдэг хамгийн эхний асуулт тэндээ
            хариулагдана. */}
        <span className="absolute top-3 left-3">
          <Badge tone={online ? 'accent' : 'neutral'}>
            {online ? t.courses.onlineBadge : t.courses.studioBadge}
          </Badge>
        </span>
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="t-h3 transition-opacity duration-200 group-hover:opacity-60">
            {loc(course, 'name', locale)}
          </h2>
          <span className="t-small shrink-0 font-semibold tabular-nums">
            {course.price === 0 ? t.courses.free : formatMnt(course.price)}
          </span>
        </div>

        {loc(course, 'summary', locale) && (
          <p className="t-small line-clamp-2 text-muted">{loc(course, 'summary', locale)}</p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Badge tone="warn">{t.level[course.level]}</Badge>
          {meta && <span className="t-meta text-faint">{meta}</span>}
          <CardStatus course={course} locale={locale} />
        </div>
      </div>
    </Link>
  )
}

/**
 * Картан дээрх төлөв — ЗӨВХӨН хэлэх зүйл байвал гарна.
 *
 * Ердийн нээлттэй ангид юу ч бичихгүй: «боломжтой» гэдэг нь анхдагч төлөв
 * бөгөөд түүнийг давтан хэлэх нь жинхэнэ мэдээлэл болох «сүүлийн 2 суудал»
 * -ийг бусад дундаас ялгарахгүй болгоно.
 */
function CardStatus({ course, locale }: { course: CourseView; locale: Locale }) {
  const t = getDictionary(locale)

  if (course.closedReason === 'full') {
    return <span className="t-meta font-medium text-foreground">{t.courses.full}</span>
  }

  if (course.closedReason === 'not_open') {
    return <span className="t-meta text-faint">{t.courses.closedNotOpen}</span>
  }

  if (course.closedReason !== null) {
    return <span className="t-meta text-faint">{t.courses.closedClosed}</span>
  }

  // Яаралтай байдал нь ҮНЭН байх ёстой: 3 ба түүнээс цөөн үед л гарна.
  if (course.seatsLeft !== null && course.seatsLeft <= 3) {
    return (
      <span className="t-meta font-medium text-foreground">
        {course.seatsLeft} {t.courses.seatsLeft}
      </span>
    )
  }

  return null
}
