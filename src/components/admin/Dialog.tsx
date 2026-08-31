'use client'

import type { ReactNode } from 'react'
import { AdminIcon } from './AdminIcon'

/**
 * Харилцах цонхны хүрээ — гарчиг, хаах товч, гүйдэг их бие.
 *
 * `<dialog>` -ийг өөрийг нь дуудагч тал эзэмшинэ (ref, `showModal()`); энд
 * зөвхөн ДОТОР талын байрлал. Ингэснээр карт нээдэг, мөр нээдэг хоёр өөр
 * цонх нэг л төрхтэй үлдэнэ.
 */
export function DialogFrame({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: ReactNode
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="flex max-h-[inherit] flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-line px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{title}</h2>
          {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Хаах"
          className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <AdminIcon name="close" className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
    </div>
  )
}
