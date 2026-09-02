'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { DialogFrame } from './Dialog'
import { AdminIcon } from './AdminIcon'

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
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  /** Товчны бичиг. Үйл үгээр — «Шинэ бараа нэмэх». */
  trigger: string
  title: string
  subtitle?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (defaultOpen) ref.current?.showModal()
  }, [defaultOpen])

  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="btn btn-solid">
        <AdminIcon name="plus" className="h-4 w-4 shrink-0" />
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
