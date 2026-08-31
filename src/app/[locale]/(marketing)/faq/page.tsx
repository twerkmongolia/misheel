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
    <div className="shell flex flex-col gap-14 pt-12 sm:pt-16">
      <PageHeader title={t.nav.faq} />

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
        </div>
      )}
    </div>
  )
}
