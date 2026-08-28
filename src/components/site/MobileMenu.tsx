'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { NavLink } from './NavLink'
import { TAB, TAB_ACTIVE, TAB_IDLE } from './tab'

export type MenuItem = { href: string; label: string }

/** `useSyncExternalStore` -д зориулсан хоосон захиалга — утга нь хэзээ ч өөрчлөгдөхгүй. */
const subscribeNever = () => () => {}

/**
 * Гар утасны цэс — баруун талаас гулсдаг самбар.
 *
 * `<details>` -ийг орлов. Шалтгаан: цэс нээгдэхэд хуудас доошоо түлхэгдэж,
 * мөрүүд нь хуруунд жижиг байсан. Одоо самбар контентын дээгүүр гарч,
 * мөр бүр 52px өндөртэй — эрхий хуруугаар алдалгүй дардаг.
 *
 * Самбарыг `document.body` руу portal-ддэг: header нь гүйлгэхэд `transform`
 * авдаг тул дотор нь үлдвэл `fixed` байрлал header-ийн хайрцгаар хэмжигдэнэ.
 */
export function MobileMenu({
  label,
  primary,
  secondary,
  footer,
}: {
  label: string
  primary: MenuItem[]
  secondary: MenuItem[]
  footer?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const [renderedAt, setRenderedAt] = useState(pathname)

  // Portal нь сервер дээр байхгүй — `document` бэлэн болсны дараа л залгана.
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false)

  // Буцах товч зэрэг холбоос дарахгүйгээр хуудас солигдвол цэс нээлттэй үлдэх
  // ёсгүй. Render дотор тааруулах нь effect-ээс нэг render хурдан.
  if (renderedAt !== pathname) {
    setRenderedAt(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const row =
    'flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-[17px] font-medium transition-colors active:scale-[0.99]'

  /**
   * Хаана — гэхдээ зөвхөн хаа нэгтээ ХӨТЛӨХ зүйл дарагдсан үед.
   *
   * Бүх даралтад хаавал өнгөний горим солих товч цэсийг хаачихна: хэрэглэгч
   * өөрчлөлтөө харах ч завгүй үлдэнэ.
   */
  const closeIfNavigating = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('a, button[type="submit"]')) setOpen(false)
  }

  const panel = (
    // Хаалттай үед `pointer-events-none` ЗААВАЛ хэрэгтэй: энэ хайрцаг бүтэн
    // дэлгэцийг эзэлдэг тул үгүй бол навбар, хуудсын аль ч даралтыг залгина.
    <div
      className={`fixed inset-0 z-50 lg:hidden ${open ? '' : 'pointer-events-none'}`}
      inert={!open}
      aria-hidden={!open}
    >
      {/* Дэвсгэр — дарвал хаагдана */}
      <button
        type="button"
        tabIndex={-1}
        aria-label={label}
        onClick={() => setOpen(false)}
        className={`absolute inset-0 h-full w-full bg-scrim backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`absolute inset-y-0 right-0 flex h-[100dvh] w-[86%] max-w-sm flex-col overflow-y-auto overscroll-contain border-l border-line bg-surface transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">{label}</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={label}
            className="grid h-11 w-11 place-items-center rounded-full text-foreground-soft transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Холбоос дарагдмагц хаана — нэг хуудсан дээрээ үлдсэн ч гэсэн */}
        <nav className="flex flex-col gap-1 px-3 pb-2" onClick={closeIfNavigating}>
          {primary.map((item) => (
            <NavLink key={item.href} href={item.href} className={row}>
              {item.label}
              <Chevron />
            </NavLink>
          ))}

          <div className="mx-4 my-3 h-px bg-line" />

          {secondary.map((item) => (
            <NavLink key={item.href} href={item.href} className={`${row} text-[15px]`}>
              {item.label}
              <Chevron />
            </NavLink>
          ))}
        </nav>

        {footer && (
          <div
            onClick={closeIfNavigating}
            className="mt-auto flex flex-col gap-2 border-t border-line px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Доод самбарын сүүлчийн таб. Бусад табтай ижил хэлбэртэй байх нь
          чухал — «энэ бол өөр төрлийн товч» гэсэн дохио өгөх шаардлагагүй. */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`${TAB} ${open ? TAB_ACTIVE : TAB_IDLE}`}
      >
        <span className="relative block h-[22px] w-[22px]" aria-hidden="true">
          <span
            className={`absolute left-[2px] h-[1.6px] w-[18px] rounded-full bg-current transition-all duration-300 ${
              open ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-[5px]'
            }`}
          />
          {/* Дунд зураас — X болох үед арилна */}
          <span
            className={`absolute top-1/2 left-[2px] h-[1.6px] w-[18px] -translate-y-1/2 rounded-full bg-current transition-opacity duration-200 ${
              open ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`absolute left-[2px] h-[1.6px] w-[18px] rounded-full bg-current transition-all duration-300 ${
              open ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'top-[15px]'
            }`}
          />
        </span>
        {label}
      </button>

      {mounted && createPortal(panel, document.body)}
    </>
  )
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 text-faint"
      aria-hidden="true"
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}
