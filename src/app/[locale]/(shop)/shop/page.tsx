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
    <div className="shell flex flex-col gap-14 pt-12 sm:pt-16">
      <PageHeader title={t.shop.title} />

      {categories.length > 1 && (
        /* Ангилал бол ШҮҮЛТҮҮР, товч биш. Доогуур зураастай текст нь дээд
           навигацитай нэг дүрэм — сайт даяар «идэвхтэй = зураас». */
        <nav className="flex flex-wrap items-center gap-x-7 gap-y-3 border-b border-line">
          <Link
            href={`/${locale}/shop`}
            aria-current={search.category ? undefined : 'page'}
            className="nav-item t-small"
          >
            {t.common.all}
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={`/${locale}/shop?category=${encodeURIComponent(category)}`}
              aria-current={search.category === category ? 'page' : undefined}
              className="nav-item t-small"
            >
              {category}
            </Link>
          ))}
        </nav>
      )}

      {shown.length === 0 ? (
        <Empty>{t.common.empty}</Empty>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4" data-stagger>
          {shown.map((product, index) => (
            <Link
              key={product.id}
              href={`/${locale}/shop/${product.slug}`}
              className="group flex flex-col gap-4"
              data-rv
            >
              <div className="relative">
                <Media
                  src={product.images[0]?.url}
                  alt={loc(product, 'name', locale)}
                  seed={index}
                  ratio="aspect-[4/5]"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                {!product.inStock && (
                  <span className="absolute top-3 left-3">
                    <Badge tone="danger">{t.shop.outOfStock}</Badge>
                  </span>
                )}
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
                <p className="t-small font-medium transition-opacity duration-200 group-hover:opacity-60">
                  {loc(product, 'name', locale)}
                </p>
                <p className="t-meta shrink-0 text-muted">{formatMnt(product.minPrice)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
