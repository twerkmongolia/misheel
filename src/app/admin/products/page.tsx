import { Alert, Badge, Button, Card, Empty, Field, Input, Section, Td, Th, TableWrap, Textarea } from '@/components/ui'
import Image from 'next/image'
import {
  addVariant,
  createProduct,
  deleteProductImage,
  toggleActive,
  updateStock,
  uploadProductImage,
} from '@/actions/admin'
import { formatMnt } from '@/lib/format'
import { getProducts } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const search = await searchParams
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  const products = await getProducts(true)

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Бараа</h1>

      {search.ok && <Alert tone="good">Хадгалагдлаа.</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}

      <Card>
        <form action={createProduct} className="flex flex-col gap-4">
          <h2 className="font-semibold">Шинэ бараа</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Slug">
              <Input name="slug" required pattern="[a-z0-9\-]+" />
            </Field>
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
          </div>

          <Field label="Тайлбар (MN)">
            <Textarea name="desc_mn" rows={3} />
          </Field>

          <Button type="submit" className="self-start">
            Нэмэх
          </Button>
        </form>
      </Card>

      <Section title="Бараа ба нөөц">
        {products.length === 0 ? (
          <Empty>Одоогоор алга.</Empty>
        ) : (
          <div className="flex flex-col gap-6">
            {products.map((product) => (
              <Card key={product.id} className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{product.name_mn}</h3>
                    <p className="font-mono text-xs text-muted">
                      {product.slug} · {product.category}
                    </p>
                  </div>

                  <form action={toggleActive}>
                    <input type="hidden" name="table" value="products" />
                    <input type="hidden" name="id" value={product.id} />
                    <input type="hidden" name="is_active" value={String(!product.is_active)} />
                    <input type="hidden" name="back" value="/admin/products" />
                    <button type="submit">
                      <Badge tone={product.is_active ? 'good' : 'neutral'}>
                        {product.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                      </Badge>
                    </button>
                  </form>
                </div>

                {/* ── Зураг ────────────────────────────────────────────── */}
                <div className="flex flex-col gap-3 border-t border-line pt-4">
                  <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                    Зураг
                  </p>

                  {product.images.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {product.images.map((image) => (
                        <div key={image.id} className="relative">
                          <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-line">
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
                            <button
                              type="submit"
                              aria-label="Зураг устгах"
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface-2 text-xs text-danger hover:bg-danger-soft"
                            >
                              ×
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                  )}

                  <form action={uploadProductImage} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="product_id" value={product.id} />
                    <label className="flex flex-col gap-1 text-xs">
                      <span className="text-muted">Файл (JPG / PNG / WEBP, 5MB хүртэл)</span>
                      <input
                        type="file"
                        name="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        required
                        className="w-72 rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-button file:px-3 file:py-1 file:text-xs file:font-semibold file:text-button-ink"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs">
                      <span className="text-muted">Тайлбар</span>
                      <Input name="alt" className="w-48" />
                    </label>
                    <Button type="submit" variant="secondary" className="px-3 py-2 text-xs">
                      Байршуулах
                    </Button>
                  </form>
                </div>

                {product.variants.length > 0 && (
                  <TableWrap>
                    <thead>
                      <tr>
                        <Th>SKU</Th>
                        <Th>Хэмжээ / өнгө</Th>
                        <Th>Үнэ</Th>
                        <Th>Нөөц</Th>
                        <Th />
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((variant) => (
                        <tr key={variant.id}>
                          <Td className="font-mono text-xs">{variant.sku}</Td>
                          <Td>{[variant.size, variant.color].filter(Boolean).join(' · ') || '—'}</Td>
                          <Td colSpan={3}>
                            <form action={updateStock} className="flex flex-wrap items-center gap-2">
                              <input type="hidden" name="variant_id" value={variant.id} />
                              <input
                                type="number"
                                name="price"
                                defaultValue={variant.price}
                                min={0}
                                step={1000}
                                className="w-28 rounded-xl border border-line bg-surface-2 px-2 py-1.5 text-sm tabular-nums"
                              />
                              <input
                                type="number"
                                name="stock_qty"
                                defaultValue={variant.stock_qty}
                                min={0}
                                className="w-20 rounded-xl border border-line bg-surface-2 px-2 py-1.5 text-sm tabular-nums"
                              />
                              <button type="submit" className="text-sm text-foreground underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-foreground">
                                Хадгалах
                              </button>
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
                  </TableWrap>
                )}

                <form action={addVariant} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="product_id" value={product.id} />
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-muted">SKU</span>
                    <Input name="sku" required className="w-36" />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-muted">Хэмжээ</span>
                    <Input name="size" className="w-24" />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-muted">Өнгө</span>
                    <Input name="color" className="w-24" />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-muted">Үнэ</span>
                    <Input
                      type="number"
                      name="price"
                      defaultValue={product.base_price}
                      min={0}
                      step={1000}
                      className="w-28"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-muted">Нөөц</span>
                    <Input type="number" name="stock_qty" defaultValue={0} min={0} className="w-20" />
                  </label>
                  <Button type="submit" variant="secondary" className="px-3 py-2 text-xs">
                    Хувилбар нэмэх
                  </Button>
                </form>

                <p className="text-xs text-muted tabular-nums">
                  Хамгийн бага үнэ: {formatMnt(product.minPrice)}
                </p>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
