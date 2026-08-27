import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Empty, PageHeader } from '@/components/ui'
import { Media } from '@/components/site/media'
import { getDictionary, loc, isLocale } from '@/lib/i18n'
import { getInstructors } from '@/lib/data'

export default async function InstructorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const instructors = await getInstructors()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t.nav.instructors} />

      {instructors.length === 0 ? (
        <Empty>{t.common.empty}</Empty>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {instructors.map((instructor, index) => (
            <Link
              key={instructor.id}
              href={`/${locale}/instructors/${instructor.slug}`}
              className="card card-link relative overflow-hidden p-0"
            >
              <Media
                src={instructor.photo_url}
                alt={instructor.name}
                seed={index}
                ratio="aspect-[4/5]"
                className="rounded-none border-0"
              />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="font-display text-lg font-bold">{instructor.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-foreground-soft/85">
                  {loc(instructor, 'bio', locale)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
