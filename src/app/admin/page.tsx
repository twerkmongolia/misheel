import Link from 'next/link'
import { Alert, Badge, Empty, Section, TableWrap, Td, Th } from '@/components/ui'
import { AdminIcon, type NavIcon } from '@/components/admin/AdminIcon'
import { formatMnt, formatTime, weekStart, addDays } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/dal'
import { getClassTypes, indexBy } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/supabase/env'

/**
 * Үзүүлэлтийн карт — дүрс нь өнгөт хайрцагт, тоо нь хамгийн том.
 *
 * Дүрсийг өнгөт болгосон шалтгаан: дөрвөн карт зэрэгцэхэд гарчгийг уншилгүй
 * ялгах цорын ганц зам нь хэлбэр, өнгө хоёр.
 */
function Stat({
  icon,
  label,
  value,
  hint,
  href,
}: {
  icon: NavIcon
  label: string
  value: string | number
  hint?: string
  href?: string
}) {
  const body = (
    <>
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
        <AdminIcon name={icon} className="h-5 w-5" />
      </span>
      <span className="mt-4 block text-sm text-muted">{label}</span>
      <span className="mt-1 block font-display text-3xl font-bold tabular-nums">{value}</span>
      {hint && <span className="mt-1 block text-xs text-muted tabular-nums">{hint}</span>}
    </>
  )

  const shell =
    'rounded-2xl border border-line bg-surface p-5 transition-colors' +
    (href ? ' hover:border-line-strong' : '')

  return href ? (
    <Link href={href} className={`${shell} block`}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  )
}

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
    profile,
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
    getProfile(),
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

  // Анхаарал шаардсан зүйлс — мэндчилгээний доор нэг өгүүлбэрээр
  const waiting = (newOrders?.length ?? 0) + (lowStock?.length ?? 0)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-[-0.03em]">
            Сайн байна уу, <span className="text-brand">{profile?.full_name ?? 'Админ'}</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {waiting > 0
              ? `${waiting} зүйл таны шийдвэрийг хүлээж байна.`
              : 'Шийдвэр хүлээсэн зүйл алга.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/schedule"
            className="flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-medium transition-colors hover:border-foreground"
          >
            <AdminIcon name="calendar" className="h-4 w-4" />
            Хуваарь нэмэх
          </Link>
          <Link
            href="/admin/orders"
            className="flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90"
          >
            <AdminIcon name="receipt" className="h-4 w-4" />
            Захиалга шалгах
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon="calendar"
          label="Өнөөдрийн хичээл"
          value={todaySessions?.length ?? 0}
          href="/admin/schedule"
        />
        <Stat
          icon="percent"
          label="Өнөөдрийн дүүргэлт"
          value={`${occupancy}%`}
          hint={`${seats.taken}/${seats.capacity} суудал`}
        />
        <Stat icon="wallet" label="7 хоногийн орлого" value={formatMnt(revenue)} />
        <Stat
          icon="clock"
          label="Төлбөр хүлээж буй"
          value={newOrders?.length ?? 0}
          href="/admin/orders"
        />
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
