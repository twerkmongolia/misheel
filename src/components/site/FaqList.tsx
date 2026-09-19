import { loc, type Locale } from '@/lib/i18n'
import type { FaqItem } from '@/lib/supabase/database.types'

/* ───────────────────────────────────────────────────────────────────────────
   ТҮГЭЭМЭЛ АСУУЛТЫН ЖАГСААЛТ

   Хайрцаг биш ЖАГСААЛТ. Асуулт бүр өөрийн шугам дээр сууж, нээгдэхэд
   хариулт доор нь дэлгэгдэнэ (§ globals.css `.faq`).

   ЯАГААД тусдаа бүрэлдэхүүн: яг энэ жагсаалт НҮҮР хуудас болон /faq
   хоёр дээр зэрэг гарна. Хоёр хувь болгон хуулбал нэгийг нь засахад
   нөгөө нь хуучирна — аккордеоны зан үйл (дугаар, нээх тэмдэг, мөр
   таслалт) нь агуулгаас илүү удаан засагддаг хэсэг тул нэг эх сурвалж.
   ─────────────────────────────────────────────────────────────────────── */
export function FaqList({
  items,
  locale,
  /** Эхнийхийг нээлттэй эхлүүлэх эсэх — § доорх тайлбар. */
  openFirst = true,
}: {
  items: FaqItem[]
  locale: Locale
  openFirst?: boolean
}) {
  return (
    <div className="border-t border-line" data-stagger>
      {items.map((item, index) => (
        <details
          key={item.id}
          /* Эхнийх нь нээлттэй — хариулт ямар байдгийг үзүүлэхгүй бол
             уншигч хаалттай олон мөрийг «цэс» гэж уншиж, дарж үзэхээ ч
             мартдаг. */
          open={openFirst && index === 0}
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

          {/* Хариулт нь асуултынхаа ШУГАМААС эхэлнэ — дугаарын доор биш.
              Нүд нэг босоо шугам дагаж уншина.

              `whitespace-pre-line` — зарим хариулт нь жагсаалттай (жишээ
              нь хувцасны шаардлага: Twerk / Heels тусдаа). Үүнгүйгээр
              админаас мөр таслаж бичсэн бүхэн нэг урт цулгуй догол мөр
              болж нийлнэ. */}
          <p className="t-body max-w-[58ch] whitespace-pre-line pb-7 text-muted sm:pl-[3.75rem]">
            {loc(item, 'answer', locale)}
          </p>
        </details>
      ))}
    </div>
  )
}
