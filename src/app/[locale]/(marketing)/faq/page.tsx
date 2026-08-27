import { notFound } from 'next/navigation'
import { Empty, PageHeader } from '@/components/ui'
import { getDictionary, loc, isLocale } from '@/lib/i18n'
import { getFaq } from '@/lib/data'

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const items = await getFaq()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t.nav.faq} />

      {items.length === 0 ? (
        <Empty>{t.common.empty}</Empty>
      ) : (
        <div className="flex flex-col divide-y divide-line card">
          {items.map((item) => (
            <details key={item.id} className="group px-5 py-4">
              <summary className="cursor-pointer list-none font-medium marker:content-none">
                {loc(item, 'question', locale)}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-foreground-soft">
                {loc(item, 'answer', locale)}
              </p>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
