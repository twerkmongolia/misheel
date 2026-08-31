import {
  Alert,
  Badge,
  Button,
  EmptyState,
  FilterChip,
  Panel,
  PageHeader,
  Select,
  Sub,
  Table,
  Td,
  Th,
  type Tone,
} from '@/components/admin/ui'
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

/** Төлөв бүр өөрийн өнгөтэй — хүснэгтийг гүйлгэж хараад л ялгагдана. */
const tones: Record<OrderStatus, Tone> = {
  pending_payment: 'warn',
  paid: 'good',
  preparing: 'info',
  shipped: 'info',
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
  const active = search.status && search.status in labels ? search.status : null

  return (
    <>
      <PageHeader
        title="Захиалга"
        description="Сүүлийн 100 захиалга. Төлөв солиход нөөц автоматаар тохируулагдана."
      />

      {search.ok && <Alert tone="good">Шинэчлэгдлээ.</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}

      {/* Утсан дээр нэг мөрөнд хэвтээ гүйнэ — 8 шүүлтүүр гурван мөр болж
          хуудсыг эзлэхгүй. Дэлгэцэн дээр урьдын адил бүгд харагдана. */}
      <nav
        aria-label="Төлвөөр шүүх"
        className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
      >
        <FilterChip href="/admin/orders" active={!active}>
          Бүгд
        </FilterChip>
        {(Object.keys(labels) as OrderStatus[]).map((status) => (
          <FilterChip
            key={status}
            href={`/admin/orders?status=${status}`}
            active={active === status}
          >
            {labels[status]}
          </FilterChip>
        ))}
      </nav>

      <Panel
        title={active ? labels[active as OrderStatus] : 'Бүх захиалга'}
        description={`${orders?.length ?? 0} бичлэг`}
        flush
      >
        {!orders || orders.length === 0 ? (
          <EmptyState
            icon="receipt"
            title="Захиалга алга"
            hint={active ? 'Энэ төлөвт захиалга байхгүй байна.' : undefined}
          />
        ) : (
          <Table minWidth={880}>
            <thead>
              <tr>
                <Th>Дугаар</Th>
                <Th>Огноо</Th>
                <Th>Хүлээн авагч</Th>
                <Th align="right">Дүн</Th>
                <Th>Төлөв</Th>
                <Th>Төлөв солих</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <Td className="font-mono text-xs whitespace-nowrap">{order.order_no}</Td>
                  <Td className="whitespace-nowrap text-foreground-soft" label="Огноо">
                    {formatDate(order.created_at, 'mn')}
                  </Td>
                  <Td>
                    <span className="font-medium">{order.ship_name}</span>
                    <Sub>{order.ship_phone}</Sub>
                    <Sub>
                      {[order.ship_district, order.ship_khoroo, order.ship_address]
                        .filter(Boolean)
                        .join(', ')}
                    </Sub>
                  </Td>
                  <Td align="right" className="font-medium whitespace-nowrap" label="Дүн">
                    {formatMnt(order.total)}
                  </Td>
                  <Td label="Төлөв">
                    <Badge tone={tones[order.status]}>{labels[order.status]}</Badge>
                  </Td>
                  <Td>
                    <form action={updateOrderStatus} className="flex items-center gap-1.5">
                      <input type="hidden" name="order_id" value={order.id} />
                      <Select name="status" defaultValue={order.status} className="h-[30px] w-44 text-xs">
                        {(Object.keys(labels) as OrderStatus[]).map((status) => (
                          <option key={status} value={status}>
                            {labels[status]}
                          </option>
                        ))}
                      </Select>
                      <Button type="submit" size="sm">
                        Хадгалах
                      </Button>
                    </form>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  )
}
