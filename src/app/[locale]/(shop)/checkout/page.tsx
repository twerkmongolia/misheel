import { notFound, redirect } from 'next/navigation'
import { Alert, Button, Empty, Field, Input, PageHeader, Textarea } from '@/components/ui'
import { placeOrder } from '@/actions/orders'
import { orderErrorMessage } from '@/lib/errors'
import { getDictionary, isLocale, loc, content } from '@/lib/i18n'
import { formatMnt } from '@/lib/format'
import { readCart } from '@/lib/cart'
import { getSiteContent, getVariantsWithProduct } from '@/lib/data'
import { getProfile, getUser } from '@/lib/auth/dal'

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const [{ locale }, search] = await Promise.all([params, searchParams])
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)

  // Proxy аль хэдийн шүүсэн ч энд дахин шалгана — proxy бол урьдчилсан шүүлт.
  const user = await getUser()
  if (!user) redirect(`/${locale}/login?next=/${locale}/checkout`)

  const [profile, cart, site] = await Promise.all([
    getProfile(),
    readCart(),
    getSiteContent(['shop']),
  ])
  const rows = await getVariantsWithProduct(cart.map((item) => item.variantId))

  const lines = cart.flatMap((item) => {
    const row = rows.find((candidate) => candidate.variant.id === item.variantId)
    return row ? [{ ...row, qty: item.qty }] : []
  })

  const subtotal = lines.reduce((sum, line) => sum + line.variant.price * line.qty, 0)
  const shopInfo = content(site.get('shop'), locale)
  const shippingFee = Number(shopInfo.shipping_fee ?? 5000)

  if (lines.length === 0) {
    return (
      <div className="shell flex flex-col gap-14 pt-12 sm:pt-16">
        <PageHeader title={t.shop.checkout} />
        <Empty>{t.shop.cartEmpty}</Empty>
      </div>
    )
  }

  return (
    <div className="shell flex flex-col gap-14 pt-12 sm:pt-16">
      <PageHeader title={t.shop.checkout} />

      {search.error && <Alert tone="danger">{orderErrorMessage(t, search.error)}</Alert>}

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <form action={placeOrder} className="flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />
          <h2 className="t-h3">{t.shop.shippingInfo}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.shop.name}>
              <Input name="name" required defaultValue={profile?.full_name ?? ''} autoComplete="name" />
            </Field>
            <Field label={t.shop.phone}>
              <Input name="phone" required defaultValue={profile?.phone ?? ''} autoComplete="tel" />
            </Field>
            <Field label={t.shop.district}>
              <Input name="district" autoComplete="address-level2" />
            </Field>
            <Field label={t.shop.khoroo}>
              <Input name="khoroo" />
            </Field>
          </div>

          <Field label={t.shop.address}>
            <Input name="address" autoComplete="street-address" />
          </Field>
          <Field label={t.shop.orderNote}>
            <Textarea name="note" rows={3} />
          </Field>

          <Button type="submit" className="self-start">
            {t.shop.placeOrder}
          </Button>
        </form>

        <aside className="flex h-fit flex-col gap-4 card p-5">
          <ul className="flex flex-col gap-3 text-sm">
            {lines.map((line) => (
              <li key={line.variant.id} className="flex justify-between gap-3">
                <span className="min-w-0">
                  {loc(line.product, 'name', locale)}
                  <span className="text-muted">
                    {' '}
                    × {line.qty}
                    {[line.variant.size, line.variant.color].filter(Boolean).length > 0 &&
                      ` · ${[line.variant.size, line.variant.color].filter(Boolean).join(' ')}`}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">{formatMnt(line.variant.price * line.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">{t.shop.subtotal}</span>
              <span className="tabular-nums">{formatMnt(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t.shop.shipping}</span>
              <span className="tabular-nums">{formatMnt(shippingFee)}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-2 font-semibold">
              <span>{t.common.total}</span>
              <span className="tabular-nums">{formatMnt(subtotal + shippingFee)}</span>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted">{t.shop.payInstructions}</p>
        </aside>
      </div>
    </div>
  )
}
