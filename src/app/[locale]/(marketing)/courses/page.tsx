import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Empty } from '@/components/ui'
import { CourseCard } from '@/components/site/CourseCard'
import { PageBanner } from '@/components/site/PageBanner'
import { getDictionary, isLocale } from '@/lib/i18n'
import { pageMetadata } from '@/lib/seo'
import { getCourses } from '@/lib/data'
import type { CourseMode } from '@/lib/supabase/database.types'

/* ───────────────────────────────────────────────────────────────────────────
   АНГИ, КУРС

   Танхим ба онлайн НЭГ жагсаалтад. Хоёр тусдаа хуудас болговол хүн хоёуланг
   нь харьцуулж чадахгүй — гэтэл сонголт нь яг тэр: «би танхимд явж чадах уу,
   эсвэл гэрээсээ үзэх үү». Шүүлтүүр нь хоёр төрлийг ЗЭРЭГЦҮҮЛЖ байгаад,
   хүсвэл л нарийсгана.
   ─────────────────────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const t = getDictionary(locale)
  return pageMetadata({
    locale,
    title: t.courses.title,
    description: t.meta.courses,
    path: '/courses',
    image: '/media/banners/courses.jpg',
  })
}

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
