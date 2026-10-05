'use client'

import { useRef, useState } from 'react'
import { Badge, Table, Td, Th } from './ui'
import { DialogFrame } from './Dialog'
import { formatDate, formatMnt } from '@/lib/format'
import { orderStatusLabels, orderStatusTones, PAID_ORDER_STATUSES } from '@/lib/admin/order-status'
import type { OrderStatus } from '@/lib/supabase/database.types'

export type BuyerOrder = {
  id: string
  order_no: string
  status: OrderStatus
  total: number
  created_at: string
  /** Зөвхөн БАРААНЫ мөрүүд — нэр, хувилбар нь захиалгын агшинд хадгалагдсан. */
  items: { id: string; name: string; variant: string | null; qty: number; unit_price: number }[]
}

export type BuyerRow = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  /** Хамгийн сүүлийн захиалгын хүргэлтийн хаяг. */
  address: string | null
  registered_at: string | null
  /** Шинэ нь эхэнд — хамгийн сүүлд юу авсныг эхлээд хардаг. */
  orders: BuyerOrder[]
}

/**
 * Худалдан авагчдын жагсаалт — бараа авсан хүн бүр НЭГ мөр.
 *
 * Мөр дээр: хэдэн удаа авч, нийт хэд төлсөн. Амжилтгүй төлбөрийг ИЛ нэрлэнэ —
 * яг тэр хүн рүү залгах шаардлагатай байдаг (§ StudentTable ижил шалтгаан).
 * Цуцлагдсан, буцаагдсан захиалга дүнд орохгүй, цонхонд л харагдана.
 */
export function BuyerTable({ buyers }: { buyers: BuyerRow[] }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [selected, setSelected] = useState<BuyerRow | null>(null)

  const open = (buyer: BuyerRow) => {
    setSelected(buyer)
    ref.current?.showModal()
  }

  return (
    <>
      <Table minWidth={760}>
        <thead>
          <tr>
            <Th>Нэр</Th>
            <Th>Утас</Th>
            <Th>Худалдан авалт</Th>
            <Th align="right">Сүүлд авсан</Th>
          </tr>
        </thead>
        <tbody>
          {buyers.map((buyer) => {
            const paid = buyer.orders.filter((order) => PAID_ORDER_STATUSES.includes(order.status))
            const spent = paid.reduce((sum, order) => sum + order.total, 0)
            const failed = buyer.orders.filter((order) => order.status === 'pending_payment').length

            return (
              <tr
                key={buyer.id}
                onClick={() => open(buyer)}
                className="cursor-pointer"
                // Хулганагүй хүн ч мөрийг нээж чадах ёстой
                tabIndex={0}
                role="button"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    open(buyer)
                  }
                }}
              >
                <Td className="font-medium">{buyer.name ?? '—'}</Td>
                <Td className="text-foreground-soft" label="Утас">
                  {buyer.phone ?? '—'}
                </Td>
                <Td label="Худалдан авалт">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tabular-nums">
                      {paid.length > 0 ? `${paid.length} удаа · ${formatMnt(spent)}` : '—'}
                    </span>
                    {failed > 0 && <Badge tone="danger">{failed} төлбөр амжилтгүй</Badge>}
                  </div>
                </Td>
                <Td align="right" className="whitespace-nowrap text-foreground-soft" label="Сүүлд авсан">
                  {buyer.orders[0] ? formatDate(buyer.orders[0].created_at, 'mn') : '—'}
                </Td>
              </tr>
            )
          })}
        </tbody>
      </Table>

      <dialog
        ref={ref}
        className="admin-dialog"
        onClick={(event) => {
          // Бүрхүүл дээр дарахад хаана — `<dialog>` дэвсгэрээ ч өөртөө тооцдог
          if (event.target === ref.current) ref.current?.close()
        }}
      >
        {selected && (
          <DialogFrame
            title={selected.name ?? 'Нэргүй худалдан авагч'}
            subtitle={`${selected.orders.length} захиалга`}
            onClose={() => ref.current?.close()}
          >
            <div className="flex flex-col gap-5">
              <dl className="flex flex-col">
                <Row label="Имэйл" value={selected.email} mono />
                <Row label="Утас" value={selected.phone} />
                <Row label="Хүргэлтийн хаяг" value={selected.address} />
                <Row
                  label="Бүртгүүлсэн"
                  value={selected.registered_at ? formatDate(selected.registered_at, 'mn') : null}
                />
              </dl>

              <div className="flex flex-col gap-2 border-t border-line pt-4">
                <h3 className="text-xs font-semibold tracking-[0.01em] text-muted">Авсан бараа</h3>

                <ul className="flex flex-col">
                  {selected.orders.map((order) => (
                    <li key={order.id} className="flex flex-col gap-2 border-b border-line py-3 last:border-b-0">
                      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                        <span className="text-xs text-muted">
                          <span className="font-mono">{order.order_no}</span> ·{' '}
                          {formatDate(order.created_at, 'mn')}
                        </span>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-xs font-medium tabular-nums">{formatMnt(order.total)}</span>
                          <Badge tone={orderStatusTones[order.status]}>
                            {orderStatusLabels[order.status]}
                          </Badge>
                        </div>
                      </div>
                      {/* Үнэ нь мөрөнд ХАДГАЛАГДСАН дүн — барааны одоогийн үнэ
                          биш: үнэ хожим өөрчлөгдсөн ч хүн юу төлснөө харна. */}
                      <ul className="flex flex-col gap-1">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex items-baseline justify-between gap-4 text-sm">
                            <span className="min-w-0">
                              <span className="font-medium">{item.name}</span>
                              {item.variant && <span className="text-muted"> · {item.variant}</span>}
                              {item.qty > 1 && <span className="text-muted"> × {item.qty}</span>}
                            </span>
                            <span className="shrink-0 text-xs tabular-nums text-foreground-soft">
                              {formatMnt(item.unit_price * item.qty)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </DialogFrame>
        )}
      </dialog>
    </>
  )
}

function Row({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
      <dt className="shrink-0 text-xs font-semibold tracking-[0.01em] text-muted">{label}</dt>
      <dd className={`min-w-0 text-right text-sm break-words ${mono ? 'font-mono text-xs break-all' : ''}`}>
        {value || '—'}
      </dd>
    </div>
  )
}
