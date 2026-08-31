import { notFound } from 'next/navigation'
import { Alert, Badge, Button, ButtonLink, Card, PageHeader, TableWrap, Td, Th } from '@/components/ui'
import { cancelOrder } from '@/actions/orders'
import { content, getDictionary, isLocale } from '@/lib/i18n'
import { formatDateTime, formatMnt } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { getSiteContent } from '@/lib/data'
import { getUser } from '@/lib/auth/dal'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { OrderStatus } from '@/lib/supabase/database.types'

const tones: Record<OrderStatus, 'neutral' | 'good' | 'warn' | 'danger' | 'accent'> = {
  pending_payment: 'warn',
  paid: 'good',
  preparing: 'accent',
  shipped: 'accent',
  delivered: 'good',
  cancelled: 'danger',
  refunded: 'neutral',
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ locale: string; orderNo: string }>
}) {
  const { locale, orderNo } = await params
  if (!isLocale(locale) || !isSupabaseConfigured()) notFound()

  const t = getDictionary(locale)
  await getUser()

  const supabase = await createClient()
  // RLS: зөвхөн өөрийн захиалга (эсвэл ажилтан) харагдана.
  const { data: order } = await supabase.from('orders').select('*').eq('order_no', orderNo).maybeSingle()
  if (!order) notFound()

  const [{ data: items }, site] = await Promise.all([
    supabase.from('order_items').select('*').eq('order_id', order.id),
    getSiteContent(['shop']),
  ])

  const bank = content(site.get('shop'), locale).bank

  return (
    <div className="shell flex flex-col gap-14 pt-12 sm:pt-16">
      <PageHeader title={`${t.shop.orderNo} ${order.order_no}`} />

      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={tones[order.status]}>{t.orderStatus[order.status]}</Badge>
        <span className="t-small text-muted">{formatDateTime(order.created_at, locale)}</span>
      </div>

      {order.status === 'pending_payment' && (
        <Card className="flex flex-col gap-3">
          <h2 className="font-semibold">{t.shop.bankTransfer}</h2>
          <p className="t-small text-foreground-soft">{t.shop.payInstructions}</p>
          {bank && <p className="font-mono text-sm">{bank}</p>}
          <div className="flex items-baseline gap-2">
            <span className="t-small text-muted">{t.common.total}</span>
            <span className="font-display t-h2 tabular-nums">{formatMnt(order.total)}</span>
          </div>
          <p className="t-small text-muted">
            Гүйлгээний утга: <span className="font-mono">{order.order_no}</span>
          </p>
        </Card>
      )}

      <TableWrap>
        <thead>
          <tr>
            <Th>{t.shop.title}</Th>
            <Th>{t.common.qty}</Th>
            <Th>{t.common.price}</Th>
          </tr>
        </thead>
        <tbody>
          {(items ?? []).map((item) => (
            <tr key={item.id}>
              <Td>
                {item.name_snapshot}
                {item.variant_snapshot && (
                  <span className="text-muted"> · {item.variant_snapshot}</span>
                )}
              </Td>
              <Td className="tabular-nums">{item.qty}</Td>
              <Td className="tabular-nums">{formatMnt(item.unit_price * item.qty)}</Td>
            </tr>
          ))}
          <tr>
            <Td className="text-muted">{t.shop.shipping}</Td>
            <Td />
            <Td className="tabular-nums">{formatMnt(order.shipping_fee)}</Td>
          </tr>
          <tr>
            <Td className="font-semibold">{t.common.total}</Td>
            <Td />
            <Td className="font-semibold tabular-nums">{formatMnt(order.total)}</Td>
          </tr>
        </tbody>
      </TableWrap>

      <Card className="flex flex-col gap-1 text-sm">
        <h2 className="mb-1 font-semibold">{t.shop.shippingInfo}</h2>
        <p>{order.ship_name}</p>
        <p className="text-muted">{order.ship_phone}</p>
        <p className="text-muted">
          {[order.ship_district, order.ship_khoroo, order.ship_address].filter(Boolean).join(', ')}
        </p>
        {order.note && <Alert tone="neutral">{order.note}</Alert>}
      </Card>

      <div className="flex flex-wrap gap-3">
        <ButtonLink href={`/${locale}/account/orders`} variant="secondary">
          {t.shop.myOrders}
        </ButtonLink>

        {order.status === 'pending_payment' && (
          <form action={cancelOrder}>
            <input type="hidden" name="order_id" value={order.id} />
            <input type="hidden" name="order_no" value={order.order_no} />
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="danger">
              {t.common.cancel}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
