import { notFound } from 'next/navigation'
import { PageHeader, Card } from '@/components/ui'
import { Media } from '@/components/site/media'
import { content, getDictionary, loc, isLocale } from '@/lib/i18n'
import { getInstructors, getSiteContent } from '@/lib/data'

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const [site, instructors] = await Promise.all([getSiteContent(['about']), getInstructors()])
  const about = content(site.get('about'), locale)

  return (
    <div className="flex flex-col gap-10">
      <PageHeader title={about.title ?? t.nav.about} />

      <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
        <p className="text-lg leading-relaxed text-foreground-soft">{about.body}</p>
        <Media src="/media/studio-1.svg" alt={String(about.title ?? '')} ratio="aspect-[4/3]" />
      </div>

      <div className="grid grid-cols-3 gap-4 border-y border-line py-6">
        {[
          [about.stat_students, t.home.students],
          [about.stat_years, t.home.years],
          [about.stat_classes, t.home.weekly],
        ].map(([value, label]) => (
          <div key={String(label)} className="flex flex-col gap-1">
            <span className="font-display text-3xl font-bold tabular-nums">{value}</span>
            <span className="text-sm text-muted">{label}</span>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-5">
        <h2 className="text-2xl font-semibold">{t.home.instructorsTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {instructors.map((instructor, index) => (
            <Card key={instructor.id} className="flex flex-col gap-3">
              <Media src={instructor.photo_url} alt={instructor.name} seed={index} ratio="aspect-square" />
              <p className="font-medium">{instructor.name}</p>
              <p className="text-sm text-muted">{loc(instructor, 'bio', locale)}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
