import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Empty } from '@/components/ui'
import { Media } from '@/components/site/media'
import { getDictionary, loc, isLocale } from '@/lib/i18n'
import { formatMnt } from '@/lib/format'
import { getProducts, type ProductView } from '@/lib/data'
import { PageBanner } from '@/components/site/PageBanner'

/* ───────────────────────────────────────────────────────────────────────────
   ДЭЛГҮҮР

   Тор бол ЖАГСААЛТ биш ХАРЬЦУУЛАЛТ. Уншигч нэг бараа уншаад дараагийнх руу
   шилждэггүй — дөрвүүлээ зэрэг хараад аль нь өөрт нь тохирохыг ШИЙДДЭГ.
   Тиймээс хайрцаг бүр нэг ижил гурван мөрөөр төгсөнө: нэр → үнэ → төлөв.
   Мөрүүд торын хөндлөнгөөр эгнэдэг тул нүд хажуу тийш гүйж, зөвхөн ЯЛГААГ
   нь уншина.

   ── Хоёр дахь зураг ───────────────────────────────────────────────────
   Онлайн дэлгүүрт хамгийн их асуугддаг зүйл бол «нөгөө талаасаа ямар
   харагддаг вэ». Хайрцаг дээр хулгана очиход хоёр дахь зураг уусан гарч
   ирнэ — дарж ороод, буцаад гарах гурван алхмыг нэг хөдөлгөөн орлоно.
   Зөвхөн хоёр ба түүнээс дээш зурагтай бараанд ажиллана.
   ─────────────────────────────────────────────────────────────────────── */

/* Хэмжээ нь ЦАГААН ТОЛГОЙН биш БИЕИЙН дараалалтай. «M · S» гэсэн мөр нь
   өгөгдлийн сангаас шууд асгасан мэт харагдана; «S · M» бол хүн өрсөн мэт.
   Жагсаалтад байхгүй утга (нэг хэмжээт, тоон хэмжээ) эцэст нь цагаан
   толгойн дарааллаар очно. */
const SIZE_ORDER = ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl']

function sizeRank(value: string): number {
  const index = SIZE_ORDER.indexOf(value.trim().toLowerCase())
  return index === -1 ? SIZE_ORDER.length : index
}

/**
 * Тухайн бараанд ОДОО авч болох хувилбарууд.
 *
 * Нөөцгүй хэмжээг харуулах нь худал амлалт — дарж ороод л «дууссан» гэж
 * мэдэх нь дэлгүүрийн хамгийн эвгүй мөч. Хэмжээгүй бараанд (малгай, шил)
 * өнгө нь ижил үүрэг гүйцэтгэнэ.
 */
function options(product: ProductView): string[] {
  const live = product.variants.filter((variant) => variant.is_active && variant.stock_qty > 0)

  const sizes = [...new Set(live.map((variant) => variant.size).filter(Boolean))] as string[]
  if (sizes.length > 0) {
    return sizes.sort((a, b) => sizeRank(a) - sizeRank(b) || a.localeCompare(b))
  }

  const colors = [...new Set(live.map((variant) => variant.color).filter(Boolean))] as string[]
  return colors.sort((a, b) => a.localeCompare(b))
}

/** Идэвхтэй хувилбаруудын нийт үлдэгдэл. */
function stockLeft(product: ProductView): number {
  return product.variants
    .filter((variant) => variant.is_active)
    .reduce((total, variant) => total + Math.max(0, variant.stock_qty), 0)
}

const SORTS = ['featured', 'price-asc', 'price-desc'] as const
type Sort = (typeof SORTS)[number]

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ category?: string; sort?: string }>
}) {
  const [{ locale }, search] = await Promise.all([params, searchParams])
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const products = await getProducts()

  const sort: Sort = SORTS.includes(search.sort as Sort) ? (search.sort as Sort) : 'featured'

  /* Ангилал бүрийн тоог ЭНД тоолно — шүүлт дээр тоо байхгүй бол уншигч
     хоосон ангилал руу дарж мэдэх ёстой болдог. */
  const counts = new Map<string, number>()
  for (const product of products) {
    counts.set(product.category, (counts.get(product.category) ?? 0) + 1)
  }
  const categories = [...counts.keys()]

  const filtered = search.category
    ? products.filter((product) => product.category === search.category)
    : products

  /* Анхдагч эрэмбэ нь өгөгдлийн сангийн `sort_order` — дэлгүүр өөрөө юуг
     нь урд тавихаа шийддэг. Үнээр эрэмбэлэх нь тэр шийдвэрийг ТҮР дардаг. */
  const shown = [...filtered]
  if (sort === 'price-asc') shown.sort((a, b) => a.minPrice - b.minPrice)
  if (sort === 'price-desc') shown.sort((a, b) => b.minPrice - a.minPrice)

  /* Хуудасны бүх төлөв ХАЯГАНД амьдарна — ангилал, эрэмбэ. Ганц холбоос
     үүсгэгчээс бүх шилжилт гарах тул «ангиллаа хадгалаад үнээр эрэмбэл»
     гэх мэт хослол өөрөө ажиллана. */
  const href = (next: { category?: string; sort?: Sort }) => {
    const query = new URLSearchParams()
    if (next.category) query.set('category', next.category)
    if (next.sort && next.sort !== 'featured') query.set('sort', next.sort)
    const qs = query.toString()
    return `/${locale}/shop${qs ? `?${qs}` : ''}`
  }

  const sortLabels: Record<Sort, string> = {
    featured: t.shop.sortFeatured,
    'price-asc': t.shop.sortPriceUp,
    'price-desc': t.shop.sortPriceDown,
  }

  return (
    <>
      <PageBanner page="shop" title={t.shop.title} lead={t.home.shopNote} />

      <div className="shell flex flex-col gap-10 pt-10 sm:pt-12">
        {/* ── Шүүлт ба эрэмбэ — хуваарийн хуудастай НЭГ хэлээр ────────────
            Урьд нь доогуур зураастай текст байсан бөгөөд толгойн навигацитай
            яг ижил харагддаг тул «энэ хуудсыг сольдог уу, шүүдэг үү» гэдэг нь
            тодорхойгүй байв. Чип нь шүүлт гэдгээ хэлбэрээрээ хэлнэ. */}
        <section className="flex flex-col gap-4 border-y border-line py-5">
          <div className="flex items-center justify-between gap-4">
            <span className="t-label text-muted">{t.schedule.filterTitle}</span>
            <span className="t-meta text-faint tabular-nums">
              {shown.length} {t.shop.itemCount}
            </span>
          </div>

          {categories.length > 1 && (
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:items-center sm:gap-4">
              <span className="t-label text-faint">{t.shop.categoryTitle}</span>
              <div className="rail flex gap-2 overflow-x-auto">
                <Link
                  href={href({ sort })}
                  aria-current={search.category ? undefined : 'page'}
                  className={`chip ${search.category ? '' : 'chip-on'}`}
                >
                  {t.common.all}
                  <span className="ml-2 tabular-nums opacity-55">{products.length}</span>
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category}
                    href={href({ category, sort })}
                    aria-current={search.category === category ? 'page' : undefined}
                    className={`chip first-letter:uppercase ${
                      search.category === category ? 'chip-on' : ''
                    }`}
                  >
                    {category}
                    <span className="ml-2 tabular-nums opacity-55">{counts.get(category)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:items-center sm:gap-4">
            <span className="t-label text-faint">{t.shop.sortTitle}</span>
            <div className="rail flex gap-2 overflow-x-auto">
              {SORTS.map((option) => (
                <Link
                  key={option}
                  href={href({ category: search.category, sort: option })}
                  aria-current={sort === option ? 'page' : undefined}
                  className={`chip ${sort === option ? 'chip-on' : ''}`}
                >
                  {sortLabels[option]}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {shown.length === 0 ? (
          <Empty>{t.common.empty}</Empty>
        ) : (
          <div
            className="grid grid-cols-2 gap-x-4 gap-y-10 pb-[var(--bay-sm)] sm:grid-cols-3 sm:gap-x-6 sm:gap-y-14 lg:grid-cols-4"
            data-stagger
          >
            {shown.map((product, index) => {
              const name = loc(product, 'name', locale)
              const second = product.images[1]?.url
              const left = stockLeft(product)
              const scarce = product.inStock && left > 0 && left <= 5

              return (
                <Link
                  key={product.id}
                  href={`/${locale}/shop/${product.slug}`}
                  className="group flex flex-col"
                  data-rv
                >
                  {/* Дууссан бараа нь ШОШГООР биш ГЭРЭЛТҮҮЛЭЛТЭЭР ялгарна.
                      Зураг дээр хөвөх хүрээтэй жижиг хайрцаг нь товч мэт
                      харагддаг байсан; бүдгэрсэн зураг бол торын нөгөө
                      захаас ч уншигдана. */}
                  <div className={`relative ${product.inStock ? '' : 'opacity-40'}`}>
                    <Media
                      src={product.images[0]?.url}
                      alt={name}
                      seed={index}
                      ratio="aspect-[4/5]"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />

                    {second && (
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100"
                      >
                        <Media
                          src={second}
                          alt=""
                          ratio=""
                          className="h-full"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col gap-1.5 border-t border-line pt-3">
                    <p className="t-small font-medium transition-opacity duration-200 group-hover:opacity-60">
                      {name}
                    </p>

                    <p
                      className={`t-small tabular-nums ${
                        product.inStock ? 'font-semibold' : 'text-muted'
                      }`}
                    >
                      {formatMnt(product.minPrice)}
                    </p>

                    {/* Гурав дахь мөр нь ҮРГЭЛЖ байна — хайрцгууд өөр өөр
                        өндөртэй болбол тор эгнэхээ болино. Агуулга нь
                        яаралтай байдлаар эрэмбэлэгдэнэ: дууссан → цөөхөн
                        үлдсэн → авч болох хэмжээ. */}
                    {!product.inStock ? (
                      <p className="t-meta text-muted">{t.shop.outOfStock}</p>
                    ) : scarce ? (
                      <p className="t-meta font-semibold text-foreground tabular-nums">
                        {t.schedule.seatsLast} {left} {t.shop.unit}
                      </p>
                    ) : (
                      <p className="t-meta text-faint">
                        {options(product).join(' · ') || ' '}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
