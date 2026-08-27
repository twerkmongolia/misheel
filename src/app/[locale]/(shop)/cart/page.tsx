import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ButtonLink, Empty, PageHeader } from '@/components/ui'
import { Media } from '@/components/site/media'
import { removeFromCart, setCartQty } from '@/actions/cart'
import { content, getDictionary, loc, isLocale } from '@/lib/i18n'
import { formatMnt } from '@/lib/format'
import { readCart } from '@/lib/cart'
import { getSiteContent, getVariantsWithProduct } from '@/lib/data'

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const [cart, site] = await Promise.all([readCart(), getSiteContent(['shop'])])
  const rows = await getVariantsWithProduct(cart.map((item) => item.variantId))

  const lines = cart.flatMap((item) => {
    const row = rows.find((candidate) => candidate.variant.id === item.variantId)
    if (!row) return []
    // Нөөц хүрэлцэхгүй бол байгаа хэмжээгээр нь харуулна
    const qty = Math.min(item.qty, Math.max(row.variant.stock_qty, 0))
    return [{ ...row, qty, requested: item.qty, capped: item.qty > row.variant.stock_qty }]
  })

  const subtotal = lines.reduce((sum, line) => sum + line.variant.price * line.qty, 0)
  const itemCount = lines.reduce((sum, line) => sum + line.qty, 0)
  const shippingFee = Number(content(site.get('shop'), locale).shipping_fee ?? 5000)

  if (lines.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title={t.shop.cart} />
        <Empty>{t.shop.cartEmpty}</Empty>
        <ButtonLink href={`/${locale}/shop`} className="self-start">
          {t.shop.continueShopping}
        </ButtonLink>
      </div>
    )
  }

  /* Тоо ширхгийн товч — форм илгээдэг тул JavaScript-гүйгээр ажиллана */
  const stepper = (variantId: string, qty: number, max: number) => (
    <form action={setCartQty} className="flex items-center rounded-full border border-line">
      <input type="hidden" name="variant_id" value={variantId} />
      <input type="hidden" name="locale" value={locale} />

      <button
        type="submit"
        name="qty"
        value={qty - 1}
        disabled={qty <= 1}
        aria-label={t.shop.decrease}
        className="flex h-9 w-9 items-center justify-center rounded-l-full text-foreground-soft transition-colors hover:bg-surface-2 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
      >
        −
      </button>

      <span className="w-9 text-center text-sm font-semibold tabular-nums">{qty}</span>

      <button
        type="submit"
        name="qty"
        value={qty + 1}
        disabled={qty >= max}
        aria-label={t.shop.increase}
        className="flex h-9 w-9 items-center justify-center rounded-r-full text-foreground-soft transition-colors hover:bg-surface-2 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
      >
        +
      </button>
    </form>
  )

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t.shop.cart} />

      <div className="grid items-start gap-8 lg:grid-cols-[1.7fr_1fr]">
        <ul className="card divide-y divide-line">
          {lines.map((line) => (
            <li key={line.variant.id} className="flex flex-wrap gap-5 p-5 sm:flex-nowrap">
              <Link
                href={`/${locale}/shop/${line.product.slug}`}
                className="w-20 shrink-0 sm:w-24"
                tabIndex={-1}
                aria-hidden
              >
                <Media
                  src={line.image?.url}
                  alt={loc(line.product, 'name', locale)}
                  ratio="aspect-square"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/${locale}/shop/${line.product.slug}`}
                      className="font-semibold underline-offset-4 hover:underline"
                    >
                      {loc(line.product, 'name', locale)}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted">
                      {[line.variant.size, line.variant.color].filter(Boolean).join(' · ') ||
                        line.variant.sku}
                    </p>
                  </div>

                  <p className="font-display shrink-0 text-lg font-bold tabular-nums">
                    {formatMnt(line.variant.price * line.qty)}
                  </p>
                </div>

                {line.capped && (
                  <p className="text-xs text-foreground-soft">
                    {t.shop.maxStock}: {line.variant.stock_qty}
                  </p>
                )}

                <div className="mt-1 flex flex-wrap items-center gap-4">
                  {stepper(line.variant.id, line.qty, line.variant.stock_qty)}

                  <span className="text-xs text-muted tabular-nums">
                    {formatMnt(line.variant.price)} × {line.qty}
                  </span>

                  <form action={removeFromCart} className="ml-auto">
                    <input type="hidden" name="variant_id" value={line.variant.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <button
                      type="submit"
                      className="text-sm text-muted underline decoration-transparent underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
                    >
                      {t.shop.remove}
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Дүнгийн хэсэг — гүйлгэхэд дагаж наалдана */}
        <aside className="card flex flex-col gap-5 p-6 lg:sticky lg:top-24">
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">
                {t.shop.subtotal} · {itemCount} {t.shop.itemCount}
              </span>
              <span className="tabular-nums">{formatMnt(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t.shop.shipping}</span>
              <span className="tabular-nums">{formatMnt(shippingFee)}</span>
            </div>
          </div>

          <div className="flex items-baseline justify-between border-t border-line pt-4">
            <span className="font-semibold">{t.common.total}</span>
            <span className="font-display text-2xl font-bold tabular-nums">
              {formatMnt(subtotal + shippingFee)}
            </span>
          </div>

          <ButtonLink href={`/${locale}/checkout`} className="w-full">
            {t.shop.checkout}
          </ButtonLink>

          <Link
            href={`/${locale}/shop`}
            className="text-center text-sm text-muted underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            {t.shop.continueShopping}
          </Link>
        </aside>
      </div>
    </div>
  )
}
