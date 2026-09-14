import Link from 'next/link'
import { Badge } from '@/components/ui'
import { Media } from '@/components/site/media'
import { getDictionary, loc, type Locale } from '@/lib/i18n'
import { formatMnt, formatDate } from '@/lib/format'
import type { CourseView } from '@/lib/data'

/* ───────────────────────────────────────────────────────────────────────────
   КУРСЫН КАРТ

   Анги, курсын жагсаалт (§ (marketing)/courses/page.tsx) ба нүүр хуудасны
   бүлэг ХОЁУЛАА үүнийг зурна. Хоёр газар хуулбарлавал хожим нэг дээр нь
   үнэ, төлөв, шошго нэмэгдэж, нөгөө нь хоцорно — хэрэглэгч нэг ангийг хоёр
   өөрөөр харна.
   ─────────────────────────────────────────────────────────────────────── */

export function CourseCard({
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
