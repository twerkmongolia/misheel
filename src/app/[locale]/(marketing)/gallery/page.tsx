import { notFound } from 'next/navigation'
import { Empty, PageHeader } from '@/components/ui'
import { Media } from '@/components/site/media'
import { getDictionary, isLocale } from '@/lib/i18n'
import { getGallery } from '@/lib/data'

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const items = await getGallery()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t.nav.gallery} />

      {items.length === 0 ? (
        <Empty>{t.common.empty}</Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Media
              key={item.id}
              src={item.url}
              alt={locale === 'en' && item.alt_en ? item.alt_en : item.alt_mn}
              seed={index}
              ratio="aspect-[4/3]"
            />
          ))}
        </div>
      )}
    </div>
  )
}
