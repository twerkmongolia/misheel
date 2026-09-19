import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Arrow, Empty, Eyebrow } from '@/components/ui'
import { FaqList } from '@/components/site/FaqList'
import { getDictionary, isLocale } from '@/lib/i18n'
import { pageMetadata } from '@/lib/seo'
import { getFaq } from '@/lib/data'
import { ContactTrigger } from '@/components/site/ContactDialog'
import { PageBanner } from '@/components/site/PageBanner'

/* ───────────────────────────────────────────────────────────────────────────
   ТҮГЭЭМЭЛ АСУУЛТ

   Дөрвөн асуулт байхад нэг багана хангалттай байв. Арван хоёр болоход хоёр
   зүйл өөрчлөгдөнө:

     1. Уншигч ЖАГСААЛТ ДОТОР төөрөх боломжтой болно — «би хэддэх дээр
        байна вэ, цааш хэд үлдсэн бэ». Тиймээс асуулт бүр дугаартай.
        Дугаар нь нүүр хуудасны бүлгийн дугаарлалттай нэг хэлээр ярина.

     2. Жагсаалтын ТӨГСГӨЛД тавьсан «Холбоо барих» товч харагдахаа болино
        — арван хоёр асуултын доор нуугдана. Тиймээс тэр нь баруун талын
        баганад гарч, гүйлтийн турш наалдаж үлдэнэ: хариултаа олоогүй хүн
        яг тэр агшинд, доош гүйлгэлгүйгээр гарц олно.
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
    title: t.nav.faq,
    description: t.meta.faq,
    path: '/faq',
    image: '/media/banners/faq.jpg',
  })
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const items = await getFaq()

  return (
    <>
      <PageBanner page="faq" title={t.nav.faq} lead={t.faq.lead} />

      {items.length === 0 ? (
        <div className="shell pt-10 pb-[var(--bay-sm)] sm:pt-12">
          <Empty>{t.common.empty}</Empty>
        </div>
      ) : (
        <div className="shell g12 gap-y-14 pt-10 pb-[var(--bay-sm)] sm:pt-14">
          {/* ── Асуултууд — 7 багана ───────────────────────────────────── */}
          <div className="col-span-12 lg:col-span-7">
            <FaqList items={items} locale={locale} />
          </div>

          {/* ── Гарц — 4 багана, наалдмал ──────────────────────────────── */}
          <aside className="col-span-12 lg:col-span-4 lg:col-start-9">
            <div className="flex flex-col items-start gap-5 lg:sticky lg:top-28" data-rv>
              <Eyebrow>{t.contact.directTitle}</Eyebrow>
              <h2 className="t-h3">{t.faq.asideTitle}</h2>
              <p className="t-small max-w-[36ch] text-muted">{t.contact.lead}</p>
              {/* Асуултынхаа хариуг олоогүй хүн ХАМГИЙН ойрхон бичих
                  боломжтой байх ёстой. Хуудас солиод буцаж ирэх нь тэр
                  хүнийг жагсаалтын эхэнд буцаана. */}
              <ContactTrigger className="btn btn-line w-full sm:w-auto">
                {t.contact.title}
                <Arrow />
              </ContactTrigger>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
