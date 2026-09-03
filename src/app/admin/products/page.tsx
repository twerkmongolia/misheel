import Image from 'next/image'
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Field,
  FileInput,
  FormActions,
  Input,
  Panel,
  PageHeader,
  SearchBox,
  Table,
  Td,
  Textarea,
  Th,
} from '@/components/admin/ui'
import { FormDialog } from '@/components/admin/FormDialog'
import { AdminIcon } from '@/components/admin/AdminIcon'
import { CardDialog } from '@/components/admin/CardDialog'
import {
  addVariant,
  createProduct,
  deleteProductImage,
  toggleActive,
  updateStock,
  uploadProductImage,
} from '@/actions/admin'
import { formatMnt } from '@/lib/format'
import { getProducts, type ProductView } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/supabase/env'

/** Хэсгийн жижиг гарчиг — цонх доторх блокуудыг ялгана. */
function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-[0.06em] text-muted uppercase">{children}</p>
  )
}

/**
 * Хаалттай үеийн карт — зураг, нэр, үнэ, нөөц.
 *
 * Дотроо ТОВЧ агуулахгүй: карт өөрөө товч тул үүрлэвэл HTML эвдэрнэ.
 * Бүх үйлдэл цонх дотор.
 */
function ProductCard({ product }: { product: ProductView }) {
  const cover = product.images[0]
  const stock = product.variants.reduce((sum, variant) => sum + variant.stock_qty, 0)

  return (
    <>
      <div className="relative aspect-[4/3] bg-surface-2">
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.alt}
            fill
            sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="grid h-full place-items-center text-faint">
            <AdminIcon name="image" className="h-7 w-7" />
          </span>
        )}

        {!product.is_active && (
          /* Дэвсгэр нь `background` — картын `surface` БИШ. Энэ шошго нь
             ГЭРЭЛ ЗУРГИЙН дээр суудаг тул картын дэвсгэртэй ижил өнгө нь
             зурагтай нийлж уншигдахаа болино. */
          <span className="absolute top-2 left-2 rounded-md bg-background/90 px-2 py-1 text-[11px] font-medium text-muted backdrop-blur">
            Идэвхгүй
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 truncate text-sm font-semibold">{product.name_mn}</span>
          <span className="shrink-0 text-sm font-medium tnum">{formatMnt(product.minPrice)}</span>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-muted">
          <span>
            {product.variants.length > 0 ? `${product.variants.length} хувилбар` : 'Хувилбар алга'}
          </span>
          {product.variants.length > 0 && (
            <Badge tone={stock === 0 ? 'danger' : stock <= 3 ? 'warn' : 'neutral'}>
              {stock === 0 ? 'Дууссан' : `${stock} ширхэг`}
            </Badge>
          )}
        </div>
      </div>
    </>
  )
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string; error?: string; open?: string }>
}) {
  const search = await searchParams
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  const all = await getProducts(true)

  /* Бараа нь `getProducts` -оор бүхэлдээ ирдэг (хувилбар, зурагтайгаа) тул
     хайлтыг САНАХ ОЙД хийнэ — өгөгдлийн сан руу дахин очих шаардлагагүй.
     Барааны тоо зуугаар хэмжигдэх тул энэ нь хэмжээндээ зөв. */
  const term = (search.q ?? '').trim().toLowerCase()
  const products = term
    ? all.filter((product) =>
        [product.name_mn, product.name_en, product.category, product.slug]
          .join(' ')
          .toLowerCase()
          .includes(term),
      )
    : all

  return (
    <>
      <PageHeader
        title="Бараа"
        description={
          term
            ? `«${term}» хайлтад ${products.length} бараа таарлаа.`
            : 'Карт дээр дарж мэдээлэл, зураг, нөөцийг нь өөрчилнө.'
        }
        actions={
          <FormDialog
            trigger="Шинэ бараа"
            title="Шинэ бараа нэмэх"
            subtitle="Нэр, үнэ, нөөцийг нэг дор. Нэмэлт хэмжээ, зургийг дараа нь картаас."
            defaultOpen={Boolean(search.error)}
          >
            <form action={createProduct} className="flex flex-col gap-4">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Нэр (MN)">
                    <Input name="name_mn" required />
                  </Field>
                  <Field label="Нэр (EN)">
                    <Input name="name_en" />
                  </Field>
                  <Field label="Ангилал">
                    <Input name="category" defaultValue="merch" />
                  </Field>
                  <Field label="Үндсэн үнэ (₮)">
                    <Input type="number" name="base_price" defaultValue={50000} min={0} step={1000} required />
                  </Field>
                  <Field
                    label="Зураг"
                    hint="Заавал биш · олноор сонгож болно · JPG / PNG / WEBP, 5MB хүртэл"
                    className="sm:col-span-2"
                  >
                    <FileInput name="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" />
                  </Field>
                </div>

                <Field label="Тайлбар (MN)">
                  <Textarea name="desc_mn" rows={3} />
                </Field>

                {/* ── Эхний хувилбар ──────────────────────────────────────
                    Хувилбаргүй бараа нь дэлгүүрт үнэгүй, нөөцгүй тул
                    худалдаанд ГАРАХГҮЙ. Урьд нь бараа үүсгээд, дараа нь
                    картыг нээж хувилбар нэмэх хоёр алхам байсан — хоёр дахь
                    нь мартагдвал бараа чимээгүй үл үзэгдэх болдог.

                    Барааны кодыг (SKU) энд асуухгүй: нэр, хэмжээ, өнгөнөөс
                    сервер өөрөө угсарна (§ actions/admin.ts `uniqueSku`).
                    Ажилтанд утгагүй кодыг гараар бодуулах нь энэ ажлыг
                    хоёр дахин удаан болгодог. */}
                <fieldset className="flex flex-col gap-5 border-t border-line pt-5">
                  <legend className="sr-only">Эхний хувилбар</legend>
                  <p className="t-label text-muted">Эхний хувилбар</p>

                  <div className="grid gap-5 sm:grid-cols-3">
                    <Field label="Хэмжээ" hint="Заавал биш">
                      <Input name="size" placeholder="M" />
                    </Field>
                    <Field label="Өнгө" hint="Заавал биш">
                      <Input name="color" placeholder="Хар" />
                    </Field>
                    <Field label="Нөөц (ширхэг)">
                      <Input type="number" name="stock_qty" defaultValue={0} min={0} required />
                    </Field>
                  </div>
                </fieldset>

                <FormActions>
                  <Button type="submit" variant="primary">
                    Бараа нэмэх
                  </Button>
                </FormActions>
              </form>
          </FormDialog>
        }
      />

      {search.ok && <Alert tone="good">Хадгалагдлаа.</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}

      <SearchBox placeholder="Барааны нэр эсвэл ангилал" defaultValue={term} />


      {products.length === 0 ? (
        <Panel flush>
          <EmptyState icon="tag" title="Бараа бүртгэгдээгүй" hint="Эхний бараагаа дээрээс нэмнэ үү." />
        </Panel>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <CardDialog
              key={product.id}
              title={product.name_mn}
              subtitle={`${product.category} · доод үнэ ${formatMnt(product.minPrice)}`}
              defaultOpen={search.open === product.id}
              card={<ProductCard product={product} />}
            >
              <div className="flex flex-col gap-6">
                {/* ── Төлөв ──────────────────────────────────────────── */}
                <div className="flex items-center justify-between gap-3">
                  <SubHead>Төлөв</SubHead>
                  <div className="flex items-center gap-2.5">
                    <Badge tone={product.is_active ? 'good' : 'neutral'}>
                      {product.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                    </Badge>
                    <form action={toggleActive}>
                      <input type="hidden" name="table" value="products" />
                      <input type="hidden" name="id" value={product.id} />
                      <input type="hidden" name="is_active" value={String(!product.is_active)} />
                      <input type="hidden" name="back" value={`/admin/products?open=${product.id}`} />
                      <Button type="submit" size="sm">
                        {product.is_active ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}
                      </Button>
                    </form>
                  </div>
                </div>

                {/* ── Зураг ──────────────────────────────────────────── */}
                <div className="flex flex-col gap-3 border-t border-line pt-5">
                  <SubHead>Зураг</SubHead>

                  <div className="flex flex-wrap items-start gap-3">
                    {product.images.map((image) => (
                      <div key={image.id} className="relative">
                        <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-line bg-surface-2">
                          <Image
                            src={image.url}
                            alt={image.alt}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        </div>
                        <form action={deleteProductImage} className="absolute -top-2 -right-2">
                          <input type="hidden" name="image_id" value={image.id} />
                          <input type="hidden" name="product_id" value={product.id} />
                          <button
                            type="submit"
                            aria-label="Зураг устгах"
                            className="grid h-7 w-7 place-items-center rounded-[var(--r)] border border-line-strong bg-background text-muted transition-colors hover:border-foreground hover:text-foreground"
                          >
                            <AdminIcon name="trash" className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      </div>
                    ))}

                    {product.images.length === 0 && (
                      <div className="grid h-24 w-24 place-items-center rounded-lg border border-dashed border-line text-faint">
                        <AdminIcon name="image" className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <form
                    action={uploadProductImage}
                    className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
                  >
                    <input type="hidden" name="product_id" value={product.id} />
                    <Field label="Файл" hint="Олноор сонгож болно · 5MB хүртэл">
                      <FileInput
                        name="file"
                        multiple
                        required
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="sm:w-64"
                      />
                    </Field>
                    <Field label="Тайлбар">
                      <Input name="alt" className="sm:w-40" />
                    </Field>
                    <Button type="submit">Байршуулах</Button>
                  </form>
                </div>

                {/* ── Хувилбар ───────────────────────────────────────── */}
                <div className="flex flex-col gap-3 border-t border-line pt-5">
                  <SubHead>Хувилбар ба нөөц</SubHead>

                  {product.variants.length === 0 ? (
                    <p className="text-sm text-muted">Хувилбар алга — доороос нэмнэ үү.</p>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-line">
                      <Table minWidth={520}>
                        <thead>
                          <tr>
                            <Th>SKU</Th>
                            <Th>Хэмжээ / өнгө</Th>
                            <Th>Үнэ ба нөөц</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {product.variants.map((variant) => (
                            <tr key={variant.id}>
                              <Td className="font-mono text-xs whitespace-nowrap">{variant.sku}</Td>
                              <Td className="text-foreground-soft" label="Хэмжээ / өнгө">
                                {[variant.size, variant.color].filter(Boolean).join(' · ') || '—'}
                              </Td>
                              <Td>
                                <form
                                  action={updateStock}
                                  className="flex flex-wrap items-center justify-end gap-1.5"
                                >
                                  <input type="hidden" name="variant_id" value={variant.id} />
                                  <input type="hidden" name="product_id" value={product.id} />
                                  <Input
                                    type="number"
                                    name="price"
                                    aria-label="Үнэ"
                                    defaultValue={variant.price}
                                    min={0}
                                    step={1000}
                                    className="h-[30px] w-28 text-xs"
                                  />
                                  <Input
                                    type="number"
                                    name="stock_qty"
                                    aria-label="Нөөц"
                                    defaultValue={variant.stock_qty}
                                    min={0}
                                    className="h-[30px] w-20 text-xs"
                                  />
                                  <Button type="submit" size="sm">
                                    Хадгалах
                                  </Button>
                                  {variant.stock_qty <= 3 && (
                                    <Badge tone={variant.stock_qty === 0 ? 'danger' : 'warn'}>
                                      {variant.stock_qty === 0 ? 'Дууссан' : 'Дуусаж байна'}
                                    </Badge>
                                  )}
                                </form>
                              </Td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}

                  {/* Утсан дээр хоёр багана — тогтмол өргөнүүд 390px-д багтахгүй */}
                  <form
                    action={addVariant}
                    className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end"
                  >
                    <input type="hidden" name="product_id" value={product.id} />
                    <Field label="SKU" className="col-span-2">
                      <Input name="sku" required className="sm:w-32" />
                    </Field>
                    <Field label="Хэмжээ">
                      <Input name="size" className="sm:w-20" />
                    </Field>
                    <Field label="Өнгө">
                      <Input name="color" className="sm:w-20" />
                    </Field>
                    <Field label="Үнэ">
                      <Input
                        type="number"
                        name="price"
                        defaultValue={product.base_price}
                        min={0}
                        step={1000}
                        className="sm:w-28"
                      />
                    </Field>
                    <Field label="Нөөц">
                      <Input type="number" name="stock_qty" defaultValue={0} min={0} className="sm:w-20" />
                    </Field>
                    <Button type="submit" className="col-span-2 sm:col-auto">
                      Хувилбар нэмэх
                    </Button>
                  </form>
                </div>
              </div>
            </CardDialog>
          ))}
        </div>
      )}
    </>
  )
}
