import { notFound } from 'next/navigation'
import { Arrow, ButtonLink, Empty } from '@/components/ui'
import { getDictionary, loc, isLocale } from '@/lib/i18n'
import { getFaq } from '@/lib/data'
import { PageBanner } from '@/components/site/PageBanner'

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const items = await getFaq()

  return (
    <>
      <PageBanner
        page="faq"
        title={t.nav.faq}
      />

      <div className="shell flex flex-col gap-12 pt-10 sm:pt-12">
      {items.length === 0 ? (
        <Empty>{t.common.empty}</Empty>
      ) : (
        /* Хайрцаг биш ЖАГСААЛТ. Асуулт бүр өөрийн шугам дээр сууж, нээгдэхэд
           хариулт доор нь дэлгэгдэнэ (§ globals.css `.faq`). */
        <div className="max-w-[68ch] border-t border-line" data-stagger>
          {items.map((item) => (
            <details key={item.id} className="faq group border-b border-line" data-rv>
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 marker:content-none">
                <span className="t-h3 pr-2">{loc(item, 'question', locale)}</span>
                {/* Нэмэх → хасах. Эргэлт нь «нээгдлээ» гэдгийг чиглэлээр хэлнэ. */}
                <span
                  aria-hidden
                  className="relative mt-1 grid h-5 w-5 shrink-0 place-items-center text-muted transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:rotate-90"
                >
                  <span className="absolute h-px w-4 bg-current" />
                  <span className="absolute h-4 w-px bg-current transition-opacity duration-300 group-open:opacity-0" />
                </span>
              </summary>
              <p className="t-body max-w-[58ch] pb-7 text-muted">{loc(item, 'answer', locale)}</p>
            </details>
          ))}

          {/* Жагсаалтын төгсгөл нь ХААЛТ биш ЗАМ байх ёстой. Арван хоёр
              асуулт уншаад хариултаа олоогүй хүн яг тэр агшинд «за яахав»
              гэж хуудсаа хаадаг — тэнд нь дараагийн алхмыг тавина. */}
          <div className="flex flex-col items-start gap-4 pt-10" data-rv>
            <p className="t-small text-muted">{t.contact.lead}</p>
            <ButtonLink href={`/${locale}/contact`} variant="secondary">
              {t.contact.title}
              <Arrow />
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
