import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Alert, Button, ButtonLink, Empty, Field, Input, PageHeader, Textarea } from '@/components/ui'
import { Media } from '@/components/site/media'
import { placeOrder } from '@/actions/orders'
import { readBuyIntent } from '@/lib/buy'
import { orderErrorMessage } from '@/lib/errors'
import { getDictionary, isLocale, loc, content } from '@/lib/i18n'
import { privateMetadata } from '@/lib/seo'
import { formatMnt } from '@/lib/format'
import { getSiteContent, getVariantsWithProduct } from '@/lib/data'
import { getProfile, getUser } from '@/lib/auth/dal'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const t = getDictionary(locale)
  return privateMetadata(t.shop.checkout)
}

/**
 * Худалдан авалт баталгаажуулах — НЭГ бараа.
 *
 * Сонголт нь хаягийн мөрөөр ирнэ (`?variant=…&qty=…`): сагс байхгүй тул
 * хадгалах газар ч хэрэггүй. Энэ нь зориуд — хүн хаягаа хуулж илгээж,
 * дараа нь буцаж орж болно, харин cookie дотор хуучирсан бараа үлдэхгүй.
 */
export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ variant?: string; qty?: string; error?: string }>
}) {
  const [{ locale }, search] = await Promise.all([params, searchParams])
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const intent = readBuyIntent(search)

  // Proxy аль хэдийн шүүсэн ч энд дахин шалгана — proxy бол урьдчилсан шүүлт.
  const user = await getUser()
  if (!user) {
    const next = intent
      ? `/${locale}/checkout?variant=${intent.variantId}&qty=${intent.qty}`
      : `/${locale}/shop`
    redirect(`/${locale}/login?next=${encodeURIComponent(next)}`)
  }

  const [profile, site, rows] = await Promise.all([
    getProfile(),
    getSiteContent(['shop']),
    intent ? getVariantsWithProduct([intent.variantId]) : Promise.resolve([]),
  ])

  const row = rows[0]
  const shippingFee = Number(content(site.get('shop'), locale).shipping_fee ?? 5000)

  /* Хаягийн мөр эвдэрсэн, бараа устсан, эсвэл идэвхгүй болсон — гурвуулаа
     нэг л зүйл: сонгосон зүйл алга. Хоосон хуудас үлдээхгүй, дэлгүүр рүү
     буцах замыг ХАРУУЛНА. */
  if (!intent || !row || !row.variant.is_active || !row.product.is_active) {
    return (
      <div className="shell flex flex-col gap-8 pt-12 sm:pt-16">
        <PageHeader title={t.shop.checkout} />
        <Empty>{t.shop.errors.VARIANT_UNAVAILABLE}</Empty>
        <ButtonLink href={`/${locale}/shop`} className="self-start">
          {t.shop.backToShop}
        </ButtonLink>
      </div>
    )
  }

  /* Нөөц хүрэхгүй бол хүссэн тоог нь ЧИМЭЭГҮЙ багасгахгүй — хэдийг нь авч
     болохыг хэлээд, тэр тоогоор үргэлжлүүлнэ. Төлсний дараа «нэг нь дутлаа»
     гэж мэдэх нь хамгийн муу хувилбар. */
  const stock = row.variant.stock_qty
  const qty = Math.min(intent.qty, Math.max(stock, 0))
  const capped = qty < intent.qty
  const subtotal = row.variant.price * qty
  const variantLabel = [row.variant.size, row.variant.color].filter(Boolean).join(' · ')

  if (stock <= 0) {
    return (
      <div className="shell flex flex-col gap-8 pt-12 sm:pt-16">
        <PageHeader title={t.shop.checkout} />
        <Empty>{t.shop.outOfStock}</Empty>
        <ButtonLink href={`/${locale}/shop`} className="self-start">
          {t.shop.backToShop}
        </ButtonLink>
      </div>
    )
  }

  return (
    <div className="shell flex flex-col gap-14 pt-12 sm:pt-16">
      <PageHeader title={t.shop.checkout} />

      {search.error && <Alert tone="danger">{orderErrorMessage(t, search.error)}</Alert>}
      {capped && (
        <Alert tone="warn">
          {t.shop.maxStock}: {stock}
        </Alert>
      )}

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <form action={placeOrder} className="flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="variant" value={row.variant.id} />
          <input type="hidden" name="qty" value={qty} />

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
            {t.shop.payNow}
          </Button>
        </form>

        <aside className="card flex h-fit flex-col gap-5 p-5 lg:sticky lg:top-24">
          <div className="flex gap-4">
            <Link
              href={`/${locale}/shop/${row.product.slug}`}
              className="w-20 shrink-0"
              tabIndex={-1}
              aria-hidden
            >
              <Media
                src={row.image?.url}
                alt={loc(row.product, 'name', locale)}
                ratio="aspect-square"
              />
            </Link>

            <div className="flex min-w-0 flex-col gap-1">
              <Link
                href={`/${locale}/shop/${row.product.slug}`}
                className="font-semibold underline-offset-4 hover:underline"
              >
                {loc(row.product, 'name', locale)}
              </Link>
              <p className="t-small text-muted">{variantLabel || row.variant.sku}</p>
              <p className="t-meta text-muted tabular-nums">
                {formatMnt(row.variant.price)} × {qty}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">{t.shop.subtotal}</span>
              <span className="tabular-nums">{formatMnt(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t.shop.shipping}</span>
              <span className="tabular-nums">{formatMnt(shippingFee)}</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <span className="font-semibold">{t.common.total}</span>
              <span className="font-display t-h3 tabular-nums">
                {formatMnt(subtotal + shippingFee)}
              </span>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted">{t.shop.payRedirect}</p>
        </aside>
      </div>
    </div>
  )
}
