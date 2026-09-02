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
      <div className="flex shrink-0 items-center gap-4 border-b border-line px-6 py-4">
        <div className="min-w-0">
          <h2 className="t-h3 truncate">{title}</h2>
          {subtitle && <p className="t-meta truncate text-muted">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Хаах"
          className="icon-btn ml-auto shrink-0"
        >
          <AdminIcon name="close" className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  )
}
