'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { isLocale, localeNames, locales, type Locale } from '@/lib/i18n/config'

/**
 * Хэл сонгогч — бөмбөрцөг дүрс + унждаг жагсаалт.
 *
 * ── Яагаад жагсаалт болов ─────────────────────────────────────────────────
 * Өмнө нь «mn / en» гэсэн хоёр код навбарт задгай сууж байв. Хоёр хэлтэй
 * үед энэ нь ажилладаг ч гурван асуудалтай: (1) хоёр үсгийн код нь хэлний
 * НЭР биш — «mn» гэдгийг таних хүн бүр «Монгол» гэж уншихгүй, (2) идэвхтэйг
 * зөвхөн гэрэлтүүлэлт заадаг тул хажуугаас нь харахад аль нь сонгогдсоныг
 * ялгахад хагас секунд зарцуулагдана, (3) навбарын баруун талд задгай
 * текст нь дүрст товчнуудын (сагс) эгнээг таслана.
 *
 * Одоо ганц дүрст товч: бөмбөрцөг + одоогийн хэлний код. Жагсаалтад хэл
 * бүр өөрийнхөө нэрээр бичигдэнэ («Монгол», «English») — сонголт хийхэд
 * ҮГ хэрэгтэй, код биш. Идэвхтэйг чагт заана: гэрэлтүүлэлтээс хамаагүй
 * тодорхой дохио.
 *
 * ── Товч биш ХОЛБООС үлдээв ───────────────────────────────────────────────
 * Мөр бүр нь жинхэнэ `<Link>` — баруун товшоод «шинэ цонхонд нээх», эсвэл
 * хуулж авах боломжтой. Хэл солих нь JS-ийн үйлдэл биш, өөр ЗАМ.
 *
 * Одоогийн замын хэлний segment-ийг сольж, бусад хэсгийг хадгална.
 */
export function LocaleSwitch({
  current,
  label,
  placement = 'down',
}: {
  current: Locale
  /** Дэлгэц уншигчид зориулсан нэр — «Хэл» / «Language». */
  label: string
  /** Гар утасны цэсэнд сонгогч нь доод талд суудаг тул самбар ДЭЭШЭЭ нээгдэнэ. */
  placement?: 'down' | 'up'
}) {
  const pathname = usePathname()
  const search = useSearchParams().toString()

  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  // Хуудас солигдвол самбар нээлттэй үлдэх ёсгүй. Render дотор тааруулах нь
  // effect-ээс нэг render хурдан — самбар анивчихгүй.
  const [renderedAt, setRenderedAt] = useState(pathname)
  if (renderedAt !== pathname) {
    setRenderedAt(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      /* Esc нь ЗӨВХӨН энэ самбарыг хаана. Гар утасны цэс мөн Esc сонсдог тул
         (§ MobileMenu) зогсоолгүй бол нэг товшилт хоёр давхаргыг зэрэг хааж,
         хэрэглэгч цэсээ дахин нээх шаардлагатай болно. Энэ сонсогч `document`
         дээр суудаг тул цэсний `window` сонсогчоос ӨМНӨ ажиллана. */
      event.stopPropagation()
      setOpen(false)
      // Фокус товч дээрээ буцна — эс бөгөөс Tab нь хуудасны эхнээс эхэлнэ.
      trigger.current?.focus()
    }

    /* Гүйлгэхэд хаана. Навбар доош гүйхэд БҮТНЭЭР ухардаг (§ HeaderShell)
       тул нээлттэй самбар түүнтэй хамт дэлгэцээс гарна — хэрэглэгчийн хувьд
       сонголт нь «алга болсон» мэт харагдана. Хаасан нь илүү шулуухан. */
    const onScroll = () => setOpen(false)

    window.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll)
    }
  }, [open])

  const segments = pathname.split('/')
  const query = search ? `?${search}` : ''

  const hrefFor = (locale: Locale) => {
    const next = [...segments]
    if (isLocale(next[1] ?? '')) next[1] = locale
    else next.splice(1, 0, locale)
    return `${next.join('/')}${query}`
  }

  const up = placement === 'up'

  return (
    <div ref={root} className="relative">
      {/* Сагсны товчтой ИЖИЛ гэр бүлээс (`.icon-btn`): дугуй, тайван үедээ
          хүрээгүй, hover дээр л хүрээ гарч ирнэ. Ялгаа нь ганцхан — өргөн нь
          агуулгаараа тэлж, дүрсний хажууд одоогийн хэлний код багтана. */}
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className={`icon-btn flex w-auto gap-1.5 px-2.5 ${open ? 'border-line bg-surface-2 text-foreground' : ''}`}
      >
        <GlobeIcon />
        <span className="t-label text-[0.7rem] tracking-[0.12em] uppercase">{current}</span>
        <ChevronIcon open={open} />
      </button>

      {/* ── Самбар ────────────────────────────────────────────────────────
          Хөвж буй давхарга тул СҮҮДЭР зөвшөөрөгдөнө (§ globals.css: сүүдэр
          нь зөвхөн энэ нэг зорилготой). Дээд ирмэгийн гэрэл нь «энэ гадарга
          навбарын ДЭЭР байна» гэдгийг хэлнэ.

          Хаалттай үедээ DOM-д үлдэнэ — ингэснээр нээх/хаах хөдөлгөөн хоёр
          талдаа жигд. `inert` нь хаалттай самбарыг Tab-ын замаас гаргана. */}
      <div
        role="menu"
        aria-label={label}
        inert={!open}
        className={`absolute right-0 z-50 w-[11.5rem] rounded border border-line-strong bg-surface p-1 shadow-[inset_0_1px_0_var(--edge-strong),var(--lift)] transition-[opacity,transform] duration-200 ease-out ${
          up ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'
        } ${open ? 'translate-y-0 opacity-100' : `pointer-events-none opacity-0 ${up ? 'translate-y-1' : '-translate-y-1'}`}`}
      >
        {locales.map((locale) => {
          const active = locale === current

          return (
            <Link
              key={locale}
              href={hrefFor(locale)}
              role="menuitem"
              hrefLang={locale}
              aria-current={active ? 'true' : undefined}
              onClick={() => setOpen(false)}
              className={`flex items-center justify-between gap-3 rounded-sm px-3 py-2.5 transition-colors duration-200 hover:bg-surface-2 ${
                active ? 'text-foreground' : 'text-muted hover:text-foreground'
              }`}
            >
              <span className="flex items-baseline gap-2.5">
                {/* Код нь ЖИЖИГ, бүдэг — нэрийг орлохгүй, зөвхөн батална. */}
                <span className="t-label w-5 shrink-0 text-[0.65rem] tracking-[0.1em] text-faint uppercase">
                  {locale}
                </span>
                <span className="t-small">{localeNames[locale]}</span>
              </span>
              {active && <CheckIcon />}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/* Дүрсүүд нь навбарын сагстай нэг зурлагатай: 1.4 өргөн, шулуун үзүүр. */

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      className="h-[17px] w-[17px] shrink-0"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.6" />
      <path d="M3.4 12h17.2" />
      {/* Меридиан — бөмбөрцгийг хавтгай дугуйгаас ялгах цорын ганц зурлага */}
      <path d="M12 3.4c2.3 2.5 3.5 5.4 3.5 8.6s-1.2 6.1-3.5 8.6c-2.3-2.5-3.5-5.4-3.5-8.6S9.7 5.9 12 3.4Z" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={`h-[11px] w-[11px] shrink-0 text-faint transition-transform duration-300 ease-out ${
        open ? 'rotate-180' : ''
      }`}
      aria-hidden="true"
    >
      <path d="M6 9.5l6 6 6-6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  )
}
