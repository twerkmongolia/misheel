import Link from 'next/link'
import {
  Alert,
  Badge,
  ButtonLink,
  EmptyState,
  Panel,
  PageHeader,
  StatCard,
  StatRow,
  Table,
  Td,
  Th,
} from '@/components/admin/ui'
import { formatMnt, formatTime, weekStart, addDays } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/dal'
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

  /* Өмнөх долоо хоногийг ЧУ давхар татна — тоо ганцаараа мэдээлэл биш.
     «1.2 сая» гэдэг нь сайн уу, муу юу гэдгийг зөвхөн өмнөхтэй нь
     харьцуулж мэдэх боломжтой. */
  const prevWeek = weekStart(-1)

  const [
    { data: todaySessions },
    { data: paidOrders },
    { data: prevOrders },
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
      .select('total, status')
      .gte('created_at', prevWeek.toISOString())
      .lt('created_at', weekAgo.toISOString()),
    supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending_payment')
      .order('created_at', { ascending: true })
      .limit(5),
    supabase.from('product_variants').select('*').lte('stock_qty', 3).order('stock_qty').limit(8),
    getClassTypes(true),
    getProfile(),
  ])

  /* Нөөц дуусаж буй хувилбарын БАРААНЫ НЭРийг татна. Урьд нь зөвхөн SKU
     («MOCK-CROP-M-PNK») харагддаг байсан — ажилтан тэр код ямар бараа болохыг
     таамаглах, эсвэл Бараа хуудас руу очиж хайх ёстой болдог байв. */
  const productIds = [...new Set((lowStock ?? []).map((v) => v.product_id))]
  const { data: lowProducts } = productIds.length
    ? await supabase.from('products').select('id, name_mn').in('id', productIds)
    : { data: [] as { id: string; name_mn: string }[] }
  const productName = indexBy(lowProducts ?? [], 'id')

  const byClass = indexBy(classTypes, 'id')
  const earned = (rows: { total: number; status: string }[] | null) =>
    (rows ?? [])
      .filter((order) => ['paid', 'preparing', 'shipped', 'delivered'].includes(order.status))
      .reduce((sum, order) => sum + order.total, 0)

  const revenue = earned(paidOrders)
  const prevRevenue = earned(prevOrders)
  const delta = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null

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
    <>
      <PageHeader
        title={`Сайн байна уу, ${profile?.full_name ?? 'Админ'}`}
        description={
          waiting > 0
            ? `${waiting} зүйл таны шийдвэрийг хүлээж байна.`
            : 'Шийдвэр хүлээсэн зүйл алга. Өнөөдрийн байдал доор.'
        }
        actions={
          <>
            <ButtonLink href="/admin/schedule">Хуваарь нэмэх</ButtonLink>
            <ButtonLink href="/admin/orders" variant="primary">
              Захиалга шалгах
            </ButtonLink>
          </>
        }
      />

      <StatRow>
        <StatCard
          icon="calendar"
          label="Өнөөдрийн хичээл"
          value={todaySessions?.length ?? 0}
          hint={todaySessions?.length ? 'Хуваарь харах' : 'Хуваарь хоосон'}
          href="/admin/schedule"
        />
        <StatCard
          icon="percent"
          label="Өнөөдрийн дүүргэлт"
          value={`${occupancy}%`}
          hint={`${seats.taken}/${seats.capacity} суудал`}
        />
        <StatCard
          icon="wallet"
          label="7 хоногийн орлого"
          value={formatMnt(revenue)}
          hint={
            delta === null
              ? 'Өмнөх долоо хоног хоосон'
              : `Өмнөх 7 хоногоос ${delta >= 0 ? '+' : ''}${delta}%`
          }
        />
        <StatCard
          icon="clock"
          label="Төлбөр хүлээж буй"
          value={newOrders?.length ?? 0}
          hint={newOrders?.length ? 'Шалгах шаардлагатай' : 'Хүлээгдэж буй алга'}
          href="/admin/orders"
        />
      </StatRow>

      <Panel
        title="Өнөөдрийн хичээлүүд"
        actions={
          <Link
            href="/admin/schedule"
            className="lnk t-meta text-muted hover:text-foreground"
          >
            Бүтэн хуваарь →
          </Link>
        }
        flush
      >
        {!todaySessions || todaySessions.length === 0 ? (
          <EmptyState icon="calendar" title="Өнөөдөр хичээл алга" hint="Хуваарь хэсгээс шинээр нэмнэ." />
        ) : (
          <Table minWidth={520}>
            <thead>
              <tr>
                <Th>Цаг</Th>
                <Th>Хичээл</Th>
                <Th align="right">Суудал</Th>
                <Th>Төлөв</Th>
              </tr>
            </thead>
            <tbody>
              {todaySessions.map((session) => (
                <tr key={session.id}>
                  <Td className="font-medium">{formatTime(session.starts_at)}</Td>
                  <Td label="Хичээл">{byClass.get(session.class_type_id)?.name_mn ?? '—'}</Td>
                  <Td align="right" label="Суудал">
                    {session.booked_count}/{session.capacity}
                  </Td>
                  <Td label="Төлөв">
                    {session.status === 'cancelled' ? (
                      <Badge tone="danger">Цуцлагдсан</Badge>
                    ) : (
                      <Badge tone="good">Товлогдсон</Badge>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel
          title="Шинэ захиалга"
          description="Хамгийн удаан хүлээснээс эхэлж 5"
          actions={
            <Link
              href="/admin/orders"
              className="lnk t-meta text-muted hover:text-foreground"
            >
              Бүгд →
            </Link>
          }
          flush
        >
          {!newOrders || newOrders.length === 0 ? (
            <EmptyState icon="receipt" title="Хүлээгдэж буй захиалга алга" />
          ) : (
            <ul>
              {newOrders.map((order) => {
                const days = Math.max(
                  0,
                  Math.floor((now.getTime() - new Date(order.created_at).getTime()) / 86_400_000),
                )
                return (
                  <li
                    key={order.id}
                    className="flex items-center justify-between gap-3 border-b border-line px-5 py-3 text-sm last:border-b-0"
                  >
                    <Link
                      href="/admin/orders?status=pending_payment"
                      className="min-w-0 flex-1 truncate font-medium transition-colors hover:text-foreground"
                    >
                      {order.ship_name}
                      {/* Хэдэн хоног хүлээснийг ХЭЛНЭ. Хамгийн удаан хүлээснийг
                          нь эхэнд гаргадаг тул жагсаалт өөрөө дараалал болно. */}
                      <span
                        className={`ml-2 text-xs tnum ${days >= 2 ? 'font-medium text-warn' : 'text-muted'}`}
                      >
                        {days === 0 ? 'өнөөдөр' : `${days} хоног`}
                      </span>
                    </Link>
                    <span className="shrink-0 font-medium tnum">{formatMnt(order.total)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title="Дуусаж буй нөөц"
          description="3-аас цөөн ширхэгтэй хувилбарууд"
          actions={
            <Link
              href="/admin/products"
              className="lnk t-meta text-muted hover:text-foreground"
            >
              Бараа →
            </Link>
          }
          flush
        >
          {!lowStock || lowStock.length === 0 ? (
            <EmptyState icon="tag" title="Бүх бараа хангалттай" />
          ) : (
            <ul>
              {lowStock.map((variant) => (
                <li
                  key={variant.id}
                  className="flex items-center justify-between gap-3 border-b border-line px-5 py-3 text-sm last:border-b-0"
                >
                  <Link
                    href="/admin/products"
                    className="min-w-0 flex-1 truncate transition-colors hover:text-foreground"
                  >
                    <span className="font-medium">
                      {productName.get(variant.product_id)?.name_mn ?? 'Тодорхойгүй бараа'}
                    </span>
                    {/* Хэмжээ, өнгө нь ЯМАР хувилбар дууссаныг хэлнэ. SKU нь
                        ажилтанд утгагүй код — шаардвал Бараа хуудсанд бий. */}
                    {(variant.size || variant.color) && (
                      <span className="ml-2 text-xs text-muted">
                        {[variant.size, variant.color].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </Link>
                  <Badge tone={variant.stock_qty === 0 ? 'danger' : 'warn'}>
                    {variant.stock_qty === 0 ? 'Дууссан' : `${variant.stock_qty} ширхэг`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}
