'use client'

import { useRef } from 'react'
import { DialogFrame } from '@/components/admin/Dialog'
import { Badge, Button, EmptyState, Select, Sub, Table, Td, Th } from '@/components/admin/ui'
import { updateEnrollmentStatus } from '@/actions/admin'
import { formatDate, formatMnt } from '@/lib/format'
import type { EnrollmentStatus } from '@/lib/supabase/database.types'

export type EnrollmentRow = {
  id: string
  name: string
  phone: string
  status: EnrollmentStatus
  pricePaid: number
  createdAt: string
}

const label: Record<EnrollmentStatus, string> = {
  pending_payment: 'Төлбөр хүлээж байна',
  active: 'Идэвхтэй',
  completed: 'Дууссан',
  cancelled: 'Цуцлагдсан',
}

const tone = {
  pending_payment: 'warn',
  active: 'good',
  completed: 'neutral',
  cancelled: 'danger',
} as const

/**
 * Ангийн элсэгчид — цонхонд.
 *
 * Хуудсан дээр задлаад тавьвал арван ангитай студид зуу гаруй мөр болж,
 * ажилтны ХАРАХ гэж ирсэн зүйл болох ангиудын жагсаалт живнэ. Элсэгчийг
 * харах нь ангийн КОНТЕКСТ дотор хийгддэг ажил тул цонх нь зөв байр.
 *
 * ⚠️ Төлөв солих нь ихэвчлэн ХЭРЭГГҮЙ: захиалга «Төлбөр орсон» болмогц
 * элсэлт триггерээр өөрөө идэвхжинэ (§ migration `orders_sync_enrollment`).
 * Энэ жагсаалт нь гараар бэлнээр төлсөн, эсвэл алдаа засах тохиолдолд.
 */
export function EnrollmentDialog({
  course,
  mode,
  rows,
}: {
  course: string
  /** Төлөв солисны дараа ЯМАР жагсаалт руу буцахыг шийднэ. */
  mode: 'studio' | 'online'
  rows: EnrollmentRow[]
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const live = rows.filter((row) => row.status !== 'cancelled').length

  return (
    <>
      <Button type="button" size="sm" onClick={() => ref.current?.showModal()}>
        Элсэгч
        <span className="tnum opacity-60">{live}</span>
      </Button>

      <dialog
        ref={ref}
        className="admin-dialog"
        onClick={(event) => {
          if (event.target === ref.current) ref.current?.close()
        }}
      >
        <DialogFrame
          title={course}
          subtitle={`${rows.length} бичлэг · ${live} идэвхтэй`}
          onClose={() => ref.current?.close()}
        >
          {rows.length === 0 ? (
            <EmptyState
              icon="users"
              title="Элсэгч алга"
              hint="Хүн элсмэгц энд гарна. Захиалга нь төлөгдмөгц төлөв өөрөө идэвхжинэ."
            />
          ) : (
            <Table minWidth={620}>
              <thead>
                <tr>
                  <Th>Хүн</Th>
                  <Th>Элссэн</Th>
                  <Th align="right">Төлбөр</Th>
                  <Th>Төлөв</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className={row.status === 'cancelled' ? 'opacity-55' : undefined}>
                    <Td>
                      <span className="font-medium">{row.name}</span>
                      {/* Утас нь ажилтны ХАМГИЙН их хэрэглэдэг талбар —
                          баталгаажуулах, сануулах, асуух бүгд утсаар. */}
                      <Sub>{row.phone || '—'}</Sub>
                    </Td>
                    <Td className="whitespace-nowrap" label="Элссэн">
                      {formatDate(row.createdAt, 'mn')}
                    </Td>
                    <Td align="right" className="whitespace-nowrap" label="Төлбөр">
                      {row.pricePaid === 0 ? 'Үнэгүй' : formatMnt(row.pricePaid)}
                    </Td>
                    <Td label="Төлөв">
                      <div className="flex flex-col gap-2">
                        <Badge tone={tone[row.status]}>{label[row.status]}</Badge>

                        {/* Сонголт солиход ШУУД хадгална — «Хадгалах» товч
                            мөр бүрд давтагдвал хүснэгт товчны хана болно. */}
                        <form action={updateEnrollmentStatus} className="flex items-center gap-1.5">
                          <input type="hidden" name="enrollment_id" value={row.id} />
                          <input
                            type="hidden"
                            name="back"
                            value={`/admin/courses?mode=${mode}&ok=1`}
                          />
                          <Select
                            name="status"
                            defaultValue={row.status}
                            className="h-8 text-xs"
                            aria-label="Төлөв"
                          >
                            {(Object.keys(label) as EnrollmentStatus[]).map((key) => (
                              <option key={key} value={key}>
                                {label[key]}
                              </option>
                            ))}
                          </Select>
                          <Button type="submit" size="sm">
                            Солих
                          </Button>
                        </form>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </DialogFrame>
      </dialog>
    </>
  )
}
