import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader, Badge, Empty } from '@/components/ui'
import { Media } from '@/components/site/media'
import { getDictionary, loc, isLocale } from '@/lib/i18n'
import { formatMnt } from '@/lib/format'
import { getClassTypes } from '@/lib/data'

export default async function ClassesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const classTypes = await getClassTypes()

  return (
    <div className="shell flex flex-col gap-14 pt-12 sm:pt-16">
      <PageHeader title={t.nav.classes} lead={t.schedule.subtitle} />

      {classTypes.length === 0 ? (
        <Empty>{t.common.empty}</Empty>
      ) : (
        // Хайрцаг биш ШУГАМ. Зураг өөрөө хайрцаг тул дээр нь хүрээ нэмэх
        // нь давхардал — доогуур татсан нэг зураас хангалттай.
        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" data-stagger>
          {classTypes.map((classType, index) => (
            <Link
              key={classType.id}
              href={`/${locale}/classes/${classType.slug}`}
              className="group flex flex-col gap-5"
              data-rv
            >
              <Media
                src={classType.cover_url}
                alt={loc(classType, 'name', locale)}
                seed={index}
                ratio="aspect-[4/3]"
                sizes="(max-width: 640px) 100vw, 33vw"
              />

              <div className="flex flex-col gap-3 border-t border-line pt-4">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="t-h3 transition-opacity duration-200 group-hover:opacity-60">
                    {loc(classType, 'name', locale)}
                  </h2>
                  <span className="t-small shrink-0 font-semibold tabular-nums">
                    {formatMnt(classType.base_price)}
                  </span>
                </div>

                <p className="t-small line-clamp-2 text-muted">
                  {loc(classType, 'desc', locale)}
                </p>

                <div className="mt-1 flex items-center gap-3">
                  <Badge tone="warn">{t.level[classType.level]}</Badge>
                  <span className="t-meta text-faint">
                    {classType.duration_min}
                    {t.common.minutes}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
