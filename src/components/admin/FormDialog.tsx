'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { DialogFrame } from './Dialog'
import { AdminIcon, type NavIcon } from './AdminIcon'

/**
 * «Шинээр нэмэх» → ХАРИЛЦАХ ЦОНХ.
 *
 * ── Яагаад цонх вэ ─────────────────────────────────────────────────────
 * Өмнө нь нэмэх форм нь хуудсан дээр хумигдсан хэсэг (`<details>`) байв.
 * Хумигдсан ч гарчиг нь зай эзэлж, нээгдэхэд ХАРАХ гэж ирсэн жагсаалтаа
 * доош түлхдэг: ажилтан форм бөглөж байхдаа өгөгдлөө харахаа больдог.
 *
 * Нэмэх нь ХОВОР, харах нь БАЙНГА. Тиймээс ховор ажил нь хуудсан дээр
 * байнгын зай эзлэх ёсгүй — товч дараад цонхонд гарч ирнэ.
 *
 * Төрөлх `<dialog>` -ийн `showModal()` -ийг ашигласан шалтгаан: Esc товч,
 * фокусын урхи, дэвсгэр бүрхүүл, дээд давхарга — эдгээрийг гараар бичих
 * шаардлагагүй, хөтөч өөрөө хийнэ.
 *
 * ── Хадгалсны дараа ────────────────────────────────────────────────────
 * Доторх форм нь server action тул хадгалахад хуудас дахин ачаалагдаж цонх
 * өөрөө хаагдана. Харин АЛДАА гарвал хаягт `?error=` үлддэг — тэр үед
 * `defaultOpen` нь цонхыг дахин нээж, ажилтны бөглөсөн зүйл хаашаа алга
 * болов гэсэн эргэлзээг арилгана.
 */
export function FormDialog({
  trigger,
  icon = 'plus',
  title,
  subtitle,
  defaultOpen = false,
  rowTrigger = false,
  children,
}: {
  /** Товчны бичиг. Үйл үгээр — «Шинэ бараа нэмэх». */
  trigger: string
  /** Товчны дүрс. Засварт `pencil` — нэмэхийн `plus` нь худал дохио. */
  icon?: NavIcon
  title: string
  subtitle?: ReactNode
  defaultOpen?: boolean
  /**
   * Хүснэгтийн МӨР дарахад ч нээгдэнэ.
   *
   * ── Яагаад ────────────────────────────────────────────────────────────
   * Мөрийн сүүлд суусан жижиг товч бол ганцхан зорилтот цэг: ажилтан
   * ангийн нэр дээр дарж «юу ч болсонгүй» гэж гайхдаг. Мөр өөрөө дарагдах
   * нь хүснэгтийг ЖАГСААЛТ биш УДИРДЛАГА болгоно.
   *
   * ── Яагаад эцэг мөрөнд сонсогч зүүв ───────────────────────────────────
   * Цонх нь мөрийн сүүлчийн нүдэнд амьдардаг тул `<tr>` -ийг энэ бүрдэл
   * ӨӨРӨӨ зурдаггүй. Хүснэгтийг бүхэлд нь client бүрдэл болгох нь
   * серверийн өгөгдлийг дамжуулах олон давхарга нэмнэ — нэг сонсогч
   * хамаагүй хямд. Товч, холбоос, форм дээрх дарлагыг үл тоомсорлоно:
   * тэдгээр нь өөрсдийн ажилтай.
   */
  rowTrigger?: boolean
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (defaultOpen) ref.current?.showModal()
  }, [defaultOpen])

  useEffect(() => {
    if (!rowTrigger) return

    const row = buttonRef.current?.closest('tr')
    if (!row) return

    const open = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      // Дотоод удирдлагууд ба цонх өөрөө — тэд өөрсдийн ажилтай
      if (target?.closest('a, button, input, select, textarea, label, dialog')) return
      if (ref.current?.open) return
      ref.current?.showModal()
    }

    row.addEventListener('click', open)
    row.classList.add('cursor-pointer')
    return () => {
      row.removeEventListener('click', open)
      row.classList.remove('cursor-pointer')
    }
  }, [rowTrigger])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => ref.current?.showModal()}
        className="btn btn-solid"
      >
        <AdminIcon name={icon} className="h-4 w-4 shrink-0" />
        {trigger}
      </button>

      <dialog
        ref={ref}
        className="admin-dialog"
        onClick={(event) => {
          // Бүрхүүл дээр дарахад хаана — `<dialog>` дэвсгэрээ ч өөртөө тооцдог
          if (event.target === ref.current) ref.current?.close()
        }}
      >
        <DialogFrame title={title} subtitle={subtitle} onClose={() => ref.current?.close()}>
          {children}
        </DialogFrame>
      </dialog>
    </>
  )
}
