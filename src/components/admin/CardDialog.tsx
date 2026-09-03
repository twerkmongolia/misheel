'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { DialogFrame } from './Dialog'

/**
 * Карт → харилцах цонх.
 *
 * Жагсаалт нь ХАРАХ, цонх нь ЗАСАХ үүрэгтэй. Өмнө нь бараа бүр бүтэн
 * дэлгэцийн өндөртэй самбар байсан тул дөрөв дэх барааг олоход л удаан
 * гүйлгэдэг байв.
 *
 * Төрөлх `<dialog>` -ийн `showModal()` -ийг ашигласан шалтгаан: Esc товч,
 * фокусын урхи, дэвсгэр бүрхүүл, дээд давхарга — эдгээрийг гараар бичих
 * шаардлагагүй, хөтөч өөрөө хийнэ.
 *
 * Доторх формууд server action тул хадгалахад хуудас дахин ачаалагдаж цонх
 * хаагдана. `defaultOpen` нь үүнийг залруулна: үйлдэл `?open=<id>` -тэй
 * буцаадаг тул цонх байсан газраа дахин нээгдэнэ.
 */
export function CardDialog({
  title,
  subtitle,
  card,
  defaultOpen = false,
  children,
}: {
  title: string
  subtitle?: ReactNode
  /** Хаалттай үед харагдах карт. Дотроо ТОВЧ агуулж болохгүй. */
  card: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (defaultOpen) ref.current?.showModal()
  }, [defaultOpen])

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        /* Гараар бичсэн hover нь `admin-card-link` -ээр солигдов: удирдлага
           даяар дарагддаг карт бүр ЯГ ижил хариу өгөх ёстой — бараа нь
           үзүүлэлтийн картаас өөрөөр хөдөлбөл «эдгээр өөр төрлийн зүйл юм
           болов уу» гэсэн худал дохио үүснэ (§ globals.css). */
        className="admin-card admin-card-link w-full overflow-hidden text-left"
      >
        {card}
      </button>

      <dialog ref={ref} className="admin-dialog" onClick={(event) => {
          // Бүрхүүл дээр дарахад хаана — `<dialog>` дэвсгэрээ ч өөртөө тооцдог
          if (event.target === ref.current) ref.current?.close()
        }}>
        <DialogFrame title={title} subtitle={subtitle} onClose={() => ref.current?.close()}>
          {children}
        </DialogFrame>
      </dialog>
    </>
  )
}
