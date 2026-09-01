import { notFound } from 'next/navigation'
import { Arrow, ButtonLink, Empty, Eyebrow } from '@/components/ui'
import { getDictionary, loc, isLocale } from '@/lib/i18n'
import { getFaq } from '@/lib/data'
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
          {/* ── Асуултууд — 7 багана ─────────────────────────────────────
              Хайрцаг биш ЖАГСААЛТ. Асуулт бүр өөрийн шугам дээр сууж,
              нээгдэхэд хариулт доор нь дэлгэгдэнэ (§ globals.css `.faq`). */}
          <div className="col-span-12 border-t border-line lg:col-span-7" data-stagger>
            {items.map((item, index) => (
              <details
                key={item.id}
                /* Эхнийх нь нээлттэй — хариулт ямар байдгийг үзүүлэхгүй бол
                   уншигч хаалттай арван хоёр мөрийг «цэс» гэж уншиж,
                   дарж үзэхээ ч мартдаг. */
                open={index === 0}
                className="faq group border-b border-line"
                data-rv
              >
                <summary className="grid cursor-pointer list-none grid-cols-[2rem_minmax(0,1fr)_1.25rem] items-start gap-x-4 py-6 marker:content-none sm:grid-cols-[2.75rem_minmax(0,1fr)_1.25rem] sm:gap-x-5">
                  <span className="t-label mt-1.5 text-faint tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <span className="t-h3">{loc(item, 'question', locale)}</span>

                  {/* Нэмэх → хасах. Эргэлт нь «нээгдлээ» гэдгийг чиглэлээр хэлнэ. */}
                  <span
                    aria-hidden
                    className="relative mt-1 grid h-5 w-5 place-items-center text-muted transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:rotate-90"
                  >
                    <span className="absolute h-px w-4 bg-current" />
                    <span className="absolute h-4 w-px bg-current transition-opacity duration-300 group-open:opacity-0" />
                  </span>
                </summary>

                {/* Хариулт нь асуултынхаа ШУГАМААС эхэлнэ — дугаарын доор
                    биш. Нүд нэг босоо шугам дагаж уншина. */}
                <p className="t-body max-w-[58ch] pb-7 text-muted sm:pl-[3.75rem]">
                  {loc(item, 'answer', locale)}
                </p>
              </details>
            ))}
          </div>

          {/* ── Гарц — 4 багана, наалдмал ──────────────────────────────── */}
          <aside className="col-span-12 lg:col-span-4 lg:col-start-9">
            <div className="flex flex-col items-start gap-5 lg:sticky lg:top-28" data-rv>
              <Eyebrow>{t.contact.directTitle}</Eyebrow>
              <h2 className="t-h3">{t.faq.asideTitle}</h2>
              <p className="t-small max-w-[36ch] text-muted">{t.contact.lead}</p>
              <ButtonLink
                href={`/${locale}/contact`}
                variant="secondary"
                className="w-full sm:w-auto"
              >
                {t.contact.title}
                <Arrow />
              </ButtonLink>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
