import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge, Empty, PageHeader } from '@/components/ui'
import { Media } from '@/components/site/media'
import { getDictionary, loc, isLocale } from '@/lib/i18n'
import { formatMnt } from '@/lib/format'
import { getProducts } from '@/lib/data'

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ category?: string }>
}) {
  const [{ locale }, search] = await Promise.all([params, searchParams])
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const products = await getProducts()

  const categories = [...new Set(products.map((product) => product.category))]
  const shown = search.category
    ? products.filter((product) => product.category === search.category)
    : products

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t.shop.title} />

      {categories.length > 1 && (
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link
            href={`/${locale}/shop`}
            className={`rounded-lg border px-3 py-1.5 ${
              search.category ? 'border-line text-foreground-soft' : 'border-accent bg-accent-soft text-accent'
            }`}
          >
            {t.common.all}
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={`/${locale}/shop?category=${encodeURIComponent(category)}`}
              className={`rounded-lg border px-3 py-1.5 ${
                search.category === category
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line text-foreground-soft'
              }`}
            >
              {category}
            </Link>
          ))}
        </nav>
      )}

      {shown.length === 0 ? (
        <Empty>{t.common.empty}</Empty>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((product, index) => (
            <Link
              key={product.id}
              href={`/${locale}/shop/${product.slug}`}
              className="card card-link flex flex-col gap-4 p-4"
            >
              <div className="relative">
                <Media
                  src={product.images[0]?.url}
                  alt={loc(product, 'name', locale)}
                  seed={index}
                  ratio="aspect-square"
                />
                {!product.inStock && (
                  <span className="absolute top-3 left-3">
                    <Badge tone="danger">{t.shop.outOfStock}</Badge>
                  </span>
                )}
              </div>
              <div className="px-1 pb-1">
                <p className="font-semibold">{loc(product, 'name', locale)}</p>
                <p className="mt-1 text-sm text-muted tabular-nums">{formatMnt(product.minPrice)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
