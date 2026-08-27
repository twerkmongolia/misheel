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
    <div className="flex flex-col gap-8">
      <PageHeader title={t.nav.classes} lead={t.schedule.subtitle} />

      {classTypes.length === 0 ? (
        <Empty>{t.common.empty}</Empty>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {classTypes.map((classType, index) => (
            <Link
              key={classType.id}
              href={`/${locale}/classes/${classType.slug}`}
              className="card card-link flex flex-col gap-4 p-5"
            >
              <Media
                src={classType.cover_url}
                alt={loc(classType, 'name', locale)}
                seed={index}
                ratio="aspect-[16/9]"
              />
              <div className="flex items-center gap-2">
                <Badge tone="accent">{t.level[classType.level]}</Badge>
                <span className="text-sm text-muted">
                  {classType.duration_min}
                  {t.common.minutes}
                </span>
              </div>
              <h2 className="text-lg font-semibold group-hover:text-foreground">
                {loc(classType, 'name', locale)}
              </h2>
              <p className="text-sm text-foreground-soft">{loc(classType, 'desc', locale)}</p>
              <p className="mt-auto font-medium tabular-nums">{formatMnt(classType.base_price)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
