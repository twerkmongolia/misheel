'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { ChannelList } from './ChannelList'
import type { Channel } from '@/lib/contact'

/**
 * Холбоо барих цонх.
 *
 * ── Яагаад хуудас биш цонх ────────────────────────────────────────────────
 * «Холбоо барих» дарсан хүн ХУУДАС ХАРАХ гэж байгаа юм биш, ХОЛБОГДОХ гэж
 * байна. Хуудас руу үсрэх нь тэр хоёрын хооронд шаардлагагүй алхам нэмнэ:
 * агуулга нь алга болж, шинэ хаяг ачаалагдаж, буцахдаа дахин ачаалагдана.
 * Уншиж байсан газраа дээр нь цонх нээгдвэл контекст алдагдахгүй.
 *
 * ── Яагаад форм биш СУВГУУД ───────────────────────────────────────────────
 * Урьд нь энд дөрвөн талбартай форм байв. Түүнийг бөглөсөн мессеж
 * `contact_messages` хүснэгт рүү бичигддэг байсан ч түүнийг УНШИХ хуудас
 * удирдлагад байгаагүй — өөрөөр хэлбэл бичсэн хүн хариу хүлээж, хэн ч
 * хараагүй. Ажилладаггүй суваг санал болгохоос үзүүлэхгүй нь дээр.
 *
 * Одоо шууд сувгууд: утас, Instagram, Facebook, и-мэйл. Дөрвүүлээ хүн
 * бодитоор хардаг хаяг, бөглөх талбаргүй, хүлээх хугацаагүй.
 *
 * ── Яагаад НЭГ л цонх ─────────────────────────────────────────────────────
 * Товч бүрд өөрийн цонх өгвөл нэг хуудсанд дөрөв, тав нь DOM-д зэрэг сууна.
 * Оронд нь цонх нь `[locale]/layout.tsx` -д НЭГ л удаа холбогдоно, товчнууд
 * нь зөвхөн цонхыг дуудах ЯВДЛЫГ илгээнэ. Ингэснээр товчнууд хоорондоо ч,
 * цонхтой ч холбогдох шаардлагагүй — хуудасны аль ч гүнээс дуудагдана.
 *
 * ── Яагаад уугуул `<dialog>` ──────────────────────────────────────────────
 * Фокусын урхи, Esc товч, дэвсгэрийн бүрхүүл, дээд давхарга (top layer) —
 * дөрвүүлээ хөтчөөс бэлнээр ирнэ. Гараар бичсэн modal бүр эдгээрийн аль
 * нэгийг мартдаг.
 */

/** Цонхыг нээх дохио. Товч, цонх хоёрын хооронд ганц холбоос. */
const OPEN_EVENT = 'tm:contact-open'

export function ContactDialog({
  title,
  eyebrow,
  note,
  closeLabel,
  channels,
}: {
  title: string
  eyebrow: string
  note: string
  closeLabel: string
  channels: Channel[]
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const open = () => {
      const dialog = ref.current
      // Аль хэдийн нээлттэй байхад `showModal()` дуудвал алдаа шиднэ
      if (dialog && !dialog.open) dialog.showModal()
    }

    window.addEventListener(OPEN_EVENT, open)
    return () => window.removeEventListener(OPEN_EVENT, open)
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby="contact-dialog-title"
      className="site-dialog panel"
      /* Дэвсгэр дээр дарвал хаагдана. `<dialog>` -ийн хайрцаг нь бүрхүүлээ
         ХАМРУУЛДАГ тул даралт цонхон дээр өөр дээр нь болсон эсэхийг
         байрлалаар нь шалгана — эс бөгөөс форм дотор дарахад ч хаагдана. */
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const box = event.currentTarget.getBoundingClientRect()
        const inside =
          event.clientX >= box.left &&
          event.clientX <= box.right &&
          event.clientY >= box.top &&
          event.clientY <= box.bottom
        if (!inside) event.currentTarget.close()
      }}
    >
      <div className="flex max-h-[inherit] flex-col">
        <div className="flex shrink-0 items-start gap-4 px-6 pt-6 pb-4 sm:px-8 sm:pt-8">
          <div className="min-w-0 flex-1">
            <p className="t-label text-faint">{eyebrow}</p>
            <h2 id="contact-dialog-title" className="t-h2 mt-2">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label={closeLabel}
            className="icon-btn -mt-1 shrink-0"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="square"
              className="h-[18px] w-[18px]"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Богино дэлгэцэд бүх суваг багтахгүй — их бие нь дотроо гүйнэ,
            гарчиг ба хаах товч дээрээ байрандаа үлдэнэ. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 sm:px-8 sm:pb-8">
          <ChannelList channels={channels} />

          <p className="t-meta mt-6 text-muted">{note}</p>
        </div>
      </div>
    </dialog>
  )
}

/**
 * Цонх нээх товч.
 *
 * Гаднаас нь харахад холбоос мэт харагдана (навбарын мөр, товч) ч ХОЛБООС
 * БИШ: хаяг өөрчлөгдөхгүй тул хуудас дахин зурагдахгүй. Тиймээс `<a>` биш
 * `<button>` — дэлгэц уншигч «холбоос» гэж зарлаад юу ч нээгдэхгүй байвал
 * төөрөгдөнө.
 */
export function ContactTrigger({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode
  className?: string
  /** Дуудагч талын нэмэлт ажил — жишээ нь гар утасны цэсийг хаах. */
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        onClick?.()
        window.dispatchEvent(new Event(OPEN_EVENT))
      }}
    >
      {children}
    </button>
  )
}
