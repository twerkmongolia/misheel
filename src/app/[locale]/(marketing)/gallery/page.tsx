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
    <div className="shell flex flex-col gap-14 pt-12 sm:pt-16">
      <PageHeader title={t.nav.gallery} />

      {items.length === 0 ? (
        <Empty>{t.common.empty}</Empty>
      ) : (
        /* Тэнцүү нүднүүд нь холбоос хуудас шиг харагдана. Тав дахь бүрийг
           хоёр багана, босоо болгосноор эгнээ таслагдаж, нүд хуудсаар
           аялах ЗАМТАЙ болно — эвлүүлгийн хэмнэл. */
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3" data-stagger>
          {items.map((item, index) => {
            const wide = index % 5 === 0
            return (
              <div
                key={item.id}
                data-rv="clip"
                className={wide ? 'col-span-2 lg:col-span-2' : ''}
              >
                <Media
                  src={item.url}
                  alt={locale === 'en' && item.alt_en ? item.alt_en : item.alt_mn}
                  seed={index}
                  ratio={wide ? 'aspect-[16/10]' : 'aspect-[4/5]'}
                  sizes={wide ? '(max-width: 1024px) 100vw, 66vw' : '(max-width: 1024px) 50vw, 33vw'}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
