import Link from 'next/link'
import { Alert, Badge, Empty, Select, TableWrap, Td, Th } from '@/components/ui'
import { updateOrderStatus } from '@/actions/admin'
import { formatDate, formatMnt } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { OrderStatus } from '@/lib/supabase/database.types'

const labels: Record<OrderStatus, string> = {
  pending_payment: 'Төлбөр хүлээж байна',
  paid: 'Төлөгдсөн',
  preparing: 'Бэлтгэж байна',
  shipped: 'Илгээсэн',
  delivered: 'Хүргэгдсэн',
  cancelled: 'Цуцлагдсан',
  refunded: 'Буцаагдсан',
}

const tones: Record<OrderStatus, 'neutral' | 'good' | 'warn' | 'danger' | 'accent'> = {
  pending_payment: 'warn',
  paid: 'good',
  preparing: 'accent',
  shipped: 'accent',
  delivered: 'good',
  cancelled: 'danger',
  refunded: 'neutral',
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; ok?: string; error?: string }>
}) {
  const search = await searchParams
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  const supabase = await createClient()
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100)
  if (search.status && search.status in labels) {
    query = query.eq('status', search.status as OrderStatus)
  }

  const { data: orders } = await query

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Захиалга</h1>

      {search.ok && <Alert tone="good">Шинэчлэгдлээ.</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}

      <nav className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/orders"
          className={`rounded-lg border px-3 py-1.5 ${
            search.status ? 'border-line' : 'border-accent bg-accent-soft text-accent'
          }`}
        >
          Бүгд
        </Link>
        {(Object.keys(labels) as OrderStatus[]).map((status) => (
          <Link
            key={status}
            href={`/admin/orders?status=${status}`}
            className={`rounded-lg border px-3 py-1.5 ${
              search.status === status ? 'border-accent bg-accent-soft text-accent' : 'border-line'
            }`}
          >
            {labels[status]}
          </Link>
        ))}
      </nav>

      {!orders || orders.length === 0 ? (
        <Empty>Захиалга алга.</Empty>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Дугаар</Th>
              <Th>Огноо</Th>
              <Th>Хүлээн авагч</Th>
              <Th>Дүн</Th>
              <Th>Төлөв</Th>
              <Th>Солих</Th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <Td className="font-mono text-xs">{order.order_no}</Td>
                <Td className="tabular-nums">{formatDate(order.created_at, 'mn')}</Td>
                <Td>
                  {order.ship_name}
                  <span className="block text-xs text-muted tabular-nums">{order.ship_phone}</span>
                  <span className="block text-xs text-muted">
                    {[order.ship_district, order.ship_khoroo, order.ship_address]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </Td>
                <Td className="tabular-nums">{formatMnt(order.total)}</Td>
                <Td>
                  <Badge tone={tones[order.status]}>{labels[order.status]}</Badge>
                </Td>
                <Td>
                  <form action={updateOrderStatus} className="flex items-center gap-2">
                    <input type="hidden" name="order_id" value={order.id} />
                    <Select name="status" defaultValue={order.status} className="w-44 py-1.5 text-xs">
                      {(Object.keys(labels) as OrderStatus[]).map((status) => (
                        <option key={status} value={status}>
                          {labels[status]}
                        </option>
                      ))}
                    </Select>
                    <button type="submit" className="text-sm text-foreground underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-foreground">
                      Хадгалах
                    </button>
                  </form>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  )
}
