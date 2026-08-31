'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { AdminIcon } from './AdminIcon'

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
        className="admin-card block w-full overflow-hidden text-left transition-colors hover:border-line-strong hover:bg-surface-2/40"
      >
        {card}
      </button>

      <dialog
        ref={ref}
        className="admin-dialog"
        // Бүрхүүл дээр дарахад хаана. `<dialog>` өөрөө дэвсгэрээ ч хамруулж
        // мэдэрдэг тул зорилт нь цонх өөрөө эсэхийг шалгана.
        onClick={(event) => {
          if (event.target === ref.current) ref.current?.close()
        }}
      >
        <div className="flex max-h-[inherit] flex-col">
          <div className="flex shrink-0 items-center gap-3 border-b border-line px-5 py-3.5">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">{title}</h2>
              {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Хаах"
              className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <AdminIcon name="close" className="h-[18px] w-[18px]" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        </div>
      </dialog>
    </>
  )
}
