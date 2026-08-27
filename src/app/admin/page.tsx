import Link from 'next/link'
import { Alert, Badge, Card, Empty, Section, TableWrap, Td, Th } from '@/components/ui'
import { formatMnt, formatTime, weekStart, addDays } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { getClassTypes, indexBy } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export default async function AdminDashboard() {
  if (!isSupabaseConfigured()) {
    return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>
  }

  const supabase = await createClient()
  const now = new Date()
  const todayStart = new Date(`${now.toISOString().slice(0, 10)}T00:00:00+08:00`)
  const todayEnd = addDays(todayStart, 1)
  const weekAgo = weekStart(0)

  const [
    { data: todaySessions },
    { data: paidOrders },
    { data: newOrders },
    { data: lowStock },
    classTypes,
  ] = await Promise.all([
    supabase
      .from('class_sessions')
      .select('*')
      .gte('starts_at', todayStart.toISOString())
      .lt('starts_at', todayEnd.toISOString())
      .order('starts_at'),
    supabase.from('orders').select('total, created_at, status').gte('created_at', weekAgo.toISOString()),
    supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending_payment')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('product_variants').select('*').lte('stock_qty', 3).order('stock_qty').limit(8),
    getClassTypes(true),
  ])

  const byClass = indexBy(classTypes, 'id')
  const revenue = (paidOrders ?? [])
    .filter((order) => ['paid', 'preparing', 'shipped', 'delivered'].includes(order.status))
    .reduce((sum, order) => sum + order.total, 0)

  const seats = (todaySessions ?? []).reduce(
    (acc, session) => ({
      taken: acc.taken + session.booked_count,
      capacity: acc.capacity + session.capacity,
    }),
    { taken: 0, capacity: 0 },
  )
  const occupancy = seats.capacity > 0 ? Math.round((seats.taken / seats.capacity) * 100) : 0

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Хяналтын самбар</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col gap-1">
          <span className="text-sm text-muted">Өнөөдрийн хичээл</span>
          <span className="font-display text-3xl font-bold tabular-nums">
            {todaySessions?.length ?? 0}
          </span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-sm text-muted">Өнөөдрийн дүүргэлт</span>
          <span className="font-display text-3xl font-bold tabular-nums">{occupancy}%</span>
          <span className="text-xs text-muted tabular-nums">
            {seats.taken}/{seats.capacity} суудал
          </span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-sm text-muted">7 хоногийн орлого</span>
          <span className="font-display text-3xl font-bold tabular-nums">{formatMnt(revenue)}</span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-sm text-muted">Төлбөр хүлээж буй</span>
          <span className="font-display text-3xl font-bold tabular-nums">{newOrders?.length ?? 0}</span>
        </Card>
      </div>

      <Section title="Өнөөдрийн хичээлүүд">
        {!todaySessions || todaySessions.length === 0 ? (
          <Empty>Өнөөдөр хичээл алга.</Empty>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Цаг</Th>
                <Th>Хичээл</Th>
                <Th>Суудал</Th>
                <Th>Төлөв</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {todaySessions.map((session) => (
                <tr key={session.id}>
                  <Td className="tabular-nums">{formatTime(session.starts_at)}</Td>
                  <Td>{byClass.get(session.class_type_id)?.name_mn ?? '—'}</Td>
                  <Td className="tabular-nums">
                    {session.booked_count}/{session.capacity}
                  </Td>
                  <Td>
                    {session.status === 'cancelled' ? (
                      <Badge tone="danger">Цуцлагдсан</Badge>
                    ) : (
                      <Badge tone="good">Товлогдсон</Badge>
                    )}
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/bookings?session=${session.id}`}
                      className="text-foreground underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-foreground"
                    >
                      Ирц
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Section>

      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="Шинэ захиалга">
          {!newOrders || newOrders.length === 0 ? (
            <Empty>Хүлээгдэж буй захиалга алга.</Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {newOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-3 text-sm"
                >
                  <Link href="/admin/orders" className="font-mono text-foreground underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-foreground">
                    {order.order_no}
                  </Link>
                  <span>{order.ship_name}</span>
                  <span className="tabular-nums">{formatMnt(order.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Дуусаж буй нөөц">
          {!lowStock || lowStock.length === 0 ? (
            <Empty>Бүх бараа хангалттай.</Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {lowStock.map((variant) => (
                <li
                  key={variant.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-3 text-sm"
                >
                  <span className="font-mono">{variant.sku}</span>
                  <Badge tone={variant.stock_qty === 0 ? 'danger' : 'warn'}>
                    {variant.stock_qty} ш
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  )
}
