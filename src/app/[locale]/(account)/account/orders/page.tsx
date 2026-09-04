import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge, Empty, PageHeader, TableWrap, Td, Th } from '@/components/ui'
import { getDictionary, isLocale } from '@/lib/i18n'
import { formatDate, formatMnt } from '@/lib/format'
import { requireUser } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
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

export default async function MyOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  await requireUser(locale, `/${locale}/account/orders`)

  /* Хамгийн сүүлийн 100 захиалга. Хуудаслалт хийх хүртэл энэ нь хязгаар:
     хязгааргүй жагсаалт нь мөр олшрох тусам чимээгүй удаашрах бөгөөд
     эвдрэх мөч нь хамгийн идэвхтэй үйлчлүүлэгч дээр ирнэ. */
  const orders = isSupabaseConfigured()
    ? ((
        await (await createClient())
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
      ).data ?? [])
    : []

  return (
    <div className="flex flex-col gap-10">
      <PageHeader title={t.shop.myOrders} />

      {orders.length === 0 ? (
        <Empty>{t.shop.noOrders}</Empty>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>{t.shop.orderNo}</Th>
              <Th>{t.common.date}</Th>
              <Th>{t.common.status}</Th>
              <Th>{t.common.total}</Th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <Td>
                  <Link href={`/${locale}/order/${order.order_no}`} className="text-foreground underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-foreground">
                    {order.order_no}
                  </Link>
                </Td>
                <Td className="tabular-nums">{formatDate(order.created_at, locale)}</Td>
                <Td>
                  <Badge tone={tones[order.status]}>{t.orderStatus[order.status]}</Badge>
                </Td>
                <Td className="tabular-nums">{formatMnt(order.total)}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  )
}
