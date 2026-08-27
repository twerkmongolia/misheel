import { notFound } from 'next/navigation'
import { Alert, Badge, Button, PageHeader } from '@/components/ui'
import { Media } from '@/components/site/media'
import { addToCart } from '@/actions/cart'
import { getDictionary, loc, isLocale } from '@/lib/i18n'
import { formatMnt } from '@/lib/format'
import { getProductBySlug } from '@/lib/data'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const product = await getProductBySlug(slug)
  if (!product || !product.is_active) notFound()

  const available = product.variants.filter((variant) => variant.is_active)
  const firstInStock = available.find((variant) => variant.stock_qty > 0)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={loc(product, 'name', locale)} />

      <div className="grid gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <Media
            src={product.images[0]?.url}
            alt={loc(product, 'name', locale)}
            ratio="aspect-square"
            priority
          />
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1).map((image) => (
                <Media key={image.id} src={image.url} alt={image.alt} ratio="aspect-square" />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <p className="font-display text-3xl font-bold tabular-nums">{formatMnt(product.minPrice)}</p>
          <p className="leading-relaxed text-foreground-soft">{loc(product, 'desc', locale)}</p>

          {!product.inStock ? (
            <Alert tone="danger">{t.shop.outOfStock}</Alert>
          ) : (
            /* Хувилбар сонголт нь radio — JavaScript-гүйгээр ажиллана. */
            <form action={addToCart} className="flex flex-col gap-4">
              <input type="hidden" name="locale" value={locale} />

              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-medium">{t.shop.selectVariant}</legend>
                <div className="flex flex-col gap-2">
                  {available.map((variant) => {
                    const soldOut = variant.stock_qty === 0
                    const label = [variant.size, variant.color].filter(Boolean).join(' · ')

                    return (
                      <label
                        key={variant.id}
                        className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
                          soldOut ? 'border-line opacity-50' : 'cursor-pointer border-line hover:border-foreground'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="variant_id"
                            value={variant.id}
                            required
                            disabled={soldOut}
                            defaultChecked={variant.id === firstInStock?.id}
                            className="accent-[var(--accent)]"
                          />
                          <span>{label || variant.sku}</span>
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="tabular-nums">{formatMnt(variant.price)}</span>
                          {soldOut ? (
                            <Badge tone="danger">{t.shop.outOfStock}</Badge>
                          ) : variant.stock_qty <= 3 ? (
                            <Badge tone="warn">
                              {variant.stock_qty} {t.shop.inStock}
                            </Badge>
                          ) : null}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              <label className="flex w-28 flex-col gap-1.5 text-sm">
                <span className="text-muted">{t.common.qty}</span>
                <input
                  type="number"
                  name="qty"
                  defaultValue={1}
                  min={1}
                  max={20}
                  className="rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm tabular-nums"
                />
              </label>

              <Button type="submit" className="self-start">
                {t.shop.addToCart}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
