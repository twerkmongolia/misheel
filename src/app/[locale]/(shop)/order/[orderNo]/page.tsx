import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Alert, Badge, Button, ButtonLink, Card, PageHeader, TableWrap, Td, Th } from '@/components/ui'
import { cancelOrder, payOrder } from '@/actions/orders'
import { PaymentWatch } from '@/components/site/PaymentWatch'
import { content, getDictionary, isLocale } from '@/lib/i18n'
import { privateMetadata } from '@/lib/seo'
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; orderNo: string }>
}): Promise<Metadata> {
  const { locale, orderNo } = await params
  if (!isLocale(locale)) return {}

  const t = getDictionary(locale)
  return privateMetadata(`${t.shop.orderNo} ${orderNo}`)
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; orderNo: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const [{ locale, orderNo }, search] = await Promise.all([params, searchParams])
  if (!isLocale(locale) || !isSupabaseConfigured()) notFound()

  const t = getDictionary(locale)
  await getUser()

  const supabase = await createClient()
  // RLS: зөвхөн өөрийн захиалга (эсвэл ажилтан) харагдана.
  const { data: order } = await supabase.from('orders').select('*').eq('order_no', orderNo).maybeSingle()
  if (!order) notFound()

  const [{ data: items }, { data: payment }, site] = await Promise.all([
    supabase.from('order_items').select('*').eq('order_id', order.id),
    /* Нэхэмжлэл үүссэн эсэх — `provider_ref` байгаа нь «хүн gateway руу
       очсон» гэсэн үг. Тэр үед л хүлээх дэлгэц утгатай: нэхэмжлэлгүй
       захиалга дээр хүлээх зүйл байхгүй. */
    supabase
      .from('payments')
      .select('provider_ref')
      .eq('target_type', 'order')
      .eq('target_id', order.id)
      .eq('status', 'pending')
      .maybeSingle(),
    getSiteContent(['shop']),
  ])

  /* Курсын захиалгад хаяг байхгүй (§ enroll_course) — тэр баримт нь доорх
     хайрцгийн гарчиг, мөрийн аль алиныг нь шийднэ. */
  const address = [order.ship_district, order.ship_khoroo, order.ship_address]
    .filter(Boolean)
    .join(', ')

  const bank = content(site.get('shop'), locale).bank

  return (
    <div className="shell flex flex-col gap-14 pt-12 sm:pt-16">
      <PageHeader title={`${t.shop.orderNo} ${order.order_no}`} />

      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={tones[order.status]}>{t.orderStatus[order.status]}</Badge>
        <span className="t-small text-muted">{formatDateTime(order.created_at, locale)}</span>
      </div>

      {search.error === 'PAY_FAILED' && <Alert tone="danger">{t.shop.payFailed}</Alert>}

      {order.status === 'pending_payment' && (
        <Card className="flex flex-col gap-5">
          <div className="flex items-baseline gap-2">
            <span className="t-small text-muted">{t.common.total}</span>
            <span className="font-display t-h2 tabular-nums">{formatMnt(order.total)}</span>
          </div>

          {/* ── Онлайн төлбөр нь ҮНДСЭН зам ────────────────────────────
              Карт, банкны апп — хэдхэн товшилт. Товч нь ШИНЭ нэхэмжлэл
              үүсгэдэг тул хугацаа нь дууссан холбоос дээр гацахгүй
              (§ actions/orders.ts `payOrder`). */}
          <div className="flex flex-col gap-3">
            <form action={payOrder} className="self-start">
              <input type="hidden" name="order_no" value={order.order_no} />
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit">{t.shop.payNow}</Button>
            </form>

            {/* Нэхэмжлэл гарсан бол хүн төлбөрөө хийчихээд буцаж ирсэн
                байж болно — webhook хараахан ирээгүй байхад «хүлээгдэж
                буй» гэж харагдах нь айдас төрүүлнэ. */}
            {payment?.provider_ref && (
              <PaymentWatch label={t.shop.payWaiting} timeoutLabel={t.shop.payWaitingSlow} />
            )}
          </div>

          {/* ── Шилжүүлэг нь НӨӨЦ зам ──────────────────────────────────
              Онлайн төлбөр бүтэхгүй хүн (карт хаагдсан, апп байхгүй) энд
              унана. Данс нь доор, жижгээр: хоёр аргыг зэрэг тэнцүү
              харуулбал хүн аль нь «зөв» бол гэж эргэлзэнэ. */}
          {bank && (
            <div className="flex flex-col gap-1.5 border-t border-line pt-4">
              <p className="t-label text-muted">{t.shop.bankTransfer}</p>
              <p className="t-small text-foreground-soft">{t.shop.payInstructions}</p>
              <p className="font-mono text-sm">{bank}</p>
              <p className="t-small text-muted">
                Гүйлгээний утга: <span className="font-mono">{order.order_no}</span>
              </p>
            </div>
          )}
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
          {/* Хүргэлтийн мөр нь ХҮРГЭДЭГ захиалгад л утгатай. Курсын
              захиалгад «Хүргэлт 0₮» гэж бичих нь худал зөвлөгөө өгнө:
              хүн хүргэлт хүлээх юм болов уу гэж бодно. */}
          {order.shipping_fee > 0 && (
            <tr>
              <Td className="text-muted">{t.shop.shipping}</Td>
              <Td />
              <Td className="tabular-nums">{formatMnt(order.shipping_fee)}</Td>
            </tr>
          )}
          <tr>
            <Td className="font-semibold">{t.common.total}</Td>
            <Td />
            <Td className="font-semibold tabular-nums">{formatMnt(order.total)}</Td>
          </tr>
        </tbody>
      </TableWrap>

      <Card className="flex flex-col gap-1 text-sm">
        {/* Курсын захиалгад хаяг байхгүй — гарчиг нь тэр үнэнийг дагана.
            «Хүргэлтийн мэдээлэл» гэж бичээд доор нь зөвхөн нэр, утас
            харуулах нь дутуу бөглөсөн маягт мэт харагдана. */}
        <h2 className="mb-1 font-semibold">
          {address ? t.shop.shippingInfo : t.shop.contactInfo}
        </h2>
        <p>{order.ship_name}</p>
        <p className="text-muted">{order.ship_phone}</p>
        {address && <p className="text-muted">{address}</p>}
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
