'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getUser, requireAdmin, requireStaff } from '@/lib/auth/dal'
import type { OrderStatus } from '@/lib/supabase/database.types'

/**
 * Удирдлагын үйлдлүүд.
 *
 * Функц БҮР `requireStaff()` -ээр эхэлнэ. Server Action нь товч дарахгүйгээр
 * шууд POST хүсэлтээр дуудагдаж болдог тул UI дээр нуусан нь хамгаалалт биш.
 * Үүн дээр нэмээд RLS болон `security definer` функцууд давхар хамгаална.
 */

const uuid = z.string().uuid()

async function audit(action: string, entity: string, entityId: string | null, diff?: unknown) {
  const user = await getUser()
  const supabase = await createClient()
  await supabase.from('audit_log').insert({
    actor_id: user?.id ?? null,
    action,
    entity,
    entity_id: entityId,
    diff: diff ?? null,
  })
}

/* ── Хуваарь ───────────────────────────────────────────────────────────── */

const sessionSchema = z.object({
  // `new` = хуваариа үүсгэхийн зэрэгцээ шинэ хичээлийн төрөл бий болгоно
  class_type_id: uuid.or(z.literal('new')),
  new_name_mn: z.string().trim().max(120).optional().default(''),
  new_name_en: z.string().trim().max(120).optional().default(''),
  new_desc_mn: z.string().trim().max(2000).optional().default(''),
  new_desc_en: z.string().trim().max(2000).optional().default(''),
  new_level: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('beginner'),
  instructor_id: uuid.or(z.literal('')).transform((value) => value || null),
  location_id: uuid.or(z.literal('')).transform((value) => value || null),
  // datetime-local нь бүсийн мэдээлэлгүй ирдэг — УБ-ын цагаар гэж үзнэ.
  starts_at: z.string().min(10),
  duration_min: z.coerce.number().int().min(15).max(300),
  capacity: z.coerce.number().int().min(1).max(200),
  price: z.coerce.number().int().min(0),
  weeks: z.coerce.number().int().min(1).max(52).default(1),
  note: z.string().trim().max(500).optional().default(''),
})

/** `2026-08-29T19:00` (УБ) → ISO (UTC). */
function ulaanbaatarToIso(local: string): string {
  return new Date(`${local}:00+08:00`).toISOString()
}

/* ── Хаягийн мөр (slug) ────────────────────────────────────────────────────
   `slug` бол нийтийн хуудасны хаяг: `/mn/shop/crop-top`. Ажилтанд утгагүй
   техникийн талбар бөгөөд буруу бичвэл (кирилл, зай, том үсэг) хаяг эвдэрдэг
   тул ХЭЗЭЭ Ч гараар бөглүүлэхгүй — нэрнээс нь өөрөө үүснэ. */

const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'ye', ё: 'yo', ж: 'j', з: 'z', и: 'i',
  й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', ө: 'o', п: 'p', р: 'r', с: 's',
  т: 't', у: 'u', ү: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .split('')
      .map((char) => CYRILLIC[char] ?? char)
      .join('')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'zuil'
  )
}

/** Нэрнээс slug гаргаад, давхцвал ард нь дугаар залгана (`saraa`, `saraa-2`). */
async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: 'class_types' | 'products' | 'instructors',
  name: string,
): Promise<string> {
  const base = slugify(name)
  const { data } = await supabase.from(table).select('slug').like('slug', `${base}%`)
  const used = new Set((data ?? []).map((row) => row.slug))

  let slug = base
  for (let n = 2; used.has(slug); n += 1) slug = `${base}-${n}`
  return slug
}

/**
 * Барааны кодыг ӨӨРӨӨ зохионо.
 *
 * SKU нь өгөгдлийн санд давхардаж болохгүй ч ажилтанд утгагүй зүйл — түүнийг
 * гараар бодуулах нь «шинэ бараа нэмэх» ажлыг хоёр дахин удаан болгодог.
 * Тиймээс slug + хэмжээ/өнгөнөөс угсарна: `crop-top` + `M` → `CROP-TOP-M`.
 * Давхарцвал ард нь тоо залгана.
 */
async function uniqueSku(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
  size: string,
  color: string,
): Promise<string> {
  /* `slugify` нь хоосон мөрөнд `'zuil'` буцаадаг (нэргүй бараа үүсэхээс
     сэргийлсэн хамгаалалт). Тиймээс ХООСОН талбарыг түүн рүү огт оруулж
     болохгүй — эс тэгвэл `CROP-TOP-ZUIL-ZUIL` гэсэн код гарна. */
  const part = (value: string) =>
    value.trim() ? slugify(value).replace(/-/g, '').toUpperCase().slice(0, 8) : ''

  const base = [slug.toUpperCase(), part(size), part(color)].filter(Boolean).join('-').slice(0, 40)
  const { data } = await supabase.from('product_variants').select('sku').like('sku', `${base}%`)
  const used = new Set((data ?? []).map((row) => row.sku))

  let sku = base
  for (let n = 2; used.has(sku); n += 1) sku = `${base}-${n}`
  return sku
}

/** Шинэ хичээлийн төрлийг үүсгээд id-г нь буцаана. */
async function createClassTypeFrom(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    name_mn: string
    name_en: string
    desc_mn: string
    desc_en: string
    level: 'beginner' | 'intermediate' | 'advanced'
    duration_min: number
    base_price: number
  },
): Promise<string | null> {
  const slug = await uniqueSlug(supabase, 'class_types', input.name_mn)

  const { data, error } = await supabase
    .from('class_types')
    .insert({ ...input, slug })
    .select('id')
    .single()

  if (error || !data) {
    redirect(`/admin/schedule?error=${encodeURIComponent(error?.message ?? 'Хичээл үүсгэж чадсангүй')}`)
  }

  await audit('class_type.create', 'class_types', data.id, { slug })
  return data.id
}

export async function createSessions(formData: FormData): Promise<void> {
  await requireStaff()

  const parsed = sessionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    redirect(`/admin/schedule?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? 'invalid')}`)
  }

  const input = parsed.data
  const startsAt = ulaanbaatarToIso(input.starts_at)
  const supabase = await createClient()

  // Шинэ хичээл сонгосон бол ЭХЛЭЭД төрлийг үүсгэнэ — хуваарь түүнээс хамаарна.
  let classTypeId = input.class_type_id
  if (classTypeId === 'new') {
    if (!input.new_name_mn) {
      redirect(`/admin/schedule?error=${encodeURIComponent('Шинэ хичээлийн нэрийг бөглөнө үү')}`)
    }
    const created = await createClassTypeFrom(supabase, {
      name_mn: input.new_name_mn,
      name_en: input.new_name_en,
      desc_mn: input.new_desc_mn,
      desc_en: input.new_desc_en,
      level: input.new_level,
      duration_min: input.duration_min,
      base_price: input.price,
    })
    classTypeId = created as string
    revalidatePath('/', 'layout')
  }

  if (input.weeks > 1) {
    // Давтагдах цувралыг DB функц үүсгэнэ — цагийн тооцоо нэг газарт.
    const { error } = await supabase.rpc('create_session_series', {
      p_class_type_id: classTypeId,
      p_instructor_id: input.instructor_id,
      p_location_id: input.location_id,
      p_first_start: startsAt,
      p_duration_min: input.duration_min,
      p_capacity: input.capacity,
      p_price: input.price,
      p_weeks: input.weeks,
    })

    if (error) redirect(`/admin/schedule?error=${encodeURIComponent(error.message)}`)
    await audit('session.series.create', 'class_sessions', null, { weeks: input.weeks })
  } else {
    const endsAt = new Date(new Date(startsAt).getTime() + input.duration_min * 60_000).toISOString()
    const { error } = await supabase.from('class_sessions').insert({
      class_type_id: classTypeId,
      instructor_id: input.instructor_id,
      location_id: input.location_id,
      starts_at: startsAt,
      ends_at: endsAt,
      capacity: input.capacity,
      price: input.price,
      note: input.note || null,
    })

    if (error) redirect(`/admin/schedule?error=${encodeURIComponent(error.message)}`)
    await audit('session.create', 'class_sessions', null, { starts_at: startsAt })
  }

  revalidatePath('/admin/schedule')
  revalidatePath('/mn/schedule')
  revalidatePath('/en/schedule')
  redirect('/admin/schedule?ok=1')
}

export async function cancelSession(formData: FormData): Promise<void> {
  await requireStaff()

  const id = uuid.safeParse(formData.get('session_id'))
  if (!id.success) redirect('/admin/schedule?error=invalid')

  const supabase = await createClient()
  await supabase.from('class_sessions').update({ status: 'cancelled' }).eq('id', id.data)
  // Бүртгэлүүдийг ч цуцална — суудлын тоо trigger-ээр автоматаар шинэчлэгдэнэ.
  await supabase
    .from('bookings')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('session_id', id.data)
    .in('status', ['pending', 'confirmed'])

  await audit('session.cancel', 'class_sessions', id.data)

  revalidatePath('/admin/schedule')
  revalidatePath('/mn/schedule')
  revalidatePath('/en/schedule')
  redirect('/admin/schedule?ok=1')
}

export async function toggleActive(formData: FormData): Promise<void> {
  await requireStaff()

  const table = z.enum(['class_types', 'instructors', 'products', 'locations']).safeParse(formData.get('table'))
  const id = uuid.safeParse(formData.get('id'))
  const next = formData.get('is_active') === 'true'
  const back = String(formData.get('back') ?? '/admin')

  if (table.success && id.success) {
    const supabase = await createClient()
    await supabase.from(table.data).update({ is_active: next }).eq('id', id.data)
    await audit(`${table.data}.toggle`, table.data, id.data, { is_active: next })
  }

  // `back` нь `?open=…` агуулж болно — revalidate зөвхөн ЗАМ хүлээж авна
  revalidatePath(back.split('?')[0])
  redirect(back.startsWith('/admin') ? back : '/admin')
}

/* ── Багш ──────────────────────────────────────────────────────────────── */

const instructorSchema = z.object({
  name: z.string().trim().min(2),
  bio_mn: z.string().trim().default(''),
  bio_en: z.string().trim().default(''),
  instagram: z.string().trim().default(''),
  photo_url: z.string().trim().default(''),
})

export async function createInstructor(formData: FormData): Promise<void> {
  await requireStaff()

  const parsed = instructorSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    redirect(`/admin/instructors?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? 'invalid')}`)
  }

  const supabase = await createClient()
  const slug = await uniqueSlug(supabase, 'instructors', parsed.data.name)

  const { error } = await supabase.from('instructors').insert({
    ...parsed.data,
    slug,
    instagram: parsed.data.instagram || null,
    photo_url: parsed.data.photo_url || null,
  })

  if (error) redirect(`/admin/instructors?error=${encodeURIComponent(error.message)}`)

  await audit('instructor.create', 'instructors', null, { slug })
  revalidatePath('/admin/instructors')
  redirect('/admin/instructors?ok=1')
}

/* ── Дэлгүүр ───────────────────────────────────────────────────────────── */

/** Барааны цонх дахин нээгдэхийн тулд id-г хаяг руу залгана (§ CardDialog). */
function backToProduct(formData: FormData, extra = 'ok=1'): string {
  const productId = String(formData.get('product_id') ?? '')
  return `/admin/products?${extra}${productId ? `&open=${productId}` : ''}`
}

export async function updateStock(formData: FormData): Promise<void> {
  await requireStaff()

  const id = uuid.safeParse(formData.get('variant_id'))
  const stock = z.coerce.number().int().min(0).max(100000).safeParse(formData.get('stock_qty'))
  const price = z.coerce.number().int().min(0).safeParse(formData.get('price'))

  if (id.success && stock.success && price.success) {
    const supabase = await createClient()
    await supabase
      .from('product_variants')
      .update({ stock_qty: stock.data, price: price.data })
      .eq('id', id.data)
    await audit('variant.update', 'product_variants', id.data, {
      stock_qty: stock.data,
      price: price.data,
    })
  }

  revalidatePath('/admin/products')
  redirect(backToProduct(formData))
}

const productSchema = z.object({
  name_mn: z.string().trim().min(2),
  name_en: z.string().trim().default(''),
  desc_mn: z.string().trim().default(''),
  category: z.string().trim().default('merch'),
  base_price: z.coerce.number().int().min(0),
})

export async function createProduct(formData: FormData): Promise<void> {
  await requireStaff()

  const parsed = productSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    redirect(`/admin/products?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? 'invalid')}`)
  }

  const supabase = await createClient()
  const slug = await uniqueSlug(supabase, 'products', parsed.data.name_mn)

  const { data: product, error } = await supabase
    .from('products')
    .insert({ ...parsed.data, slug })
    .select('id')
    .single()

  if (error || !product) {
    redirect(`/admin/products?error=${encodeURIComponent(error?.message ?? 'Бараа үүсгэж чадсангүй')}`)
  }

  await audit('product.create', 'products', product.id, { slug })

  /* Эхний хувилбар. Үнэ нь барааны үндсэн үнэ — цонхонд хоёр дахь үнэ
     асуух нь эхний алхмыг зориудаар төвөгтэй болгоно; ялгаатай үнэтэй
     хувилбарыг дараа нь картаас нэмнэ. */
  const variant = firstVariantSchema.safeParse(Object.fromEntries(formData))
  if (variant.success) {
    const sku = await uniqueSku(supabase, slug, variant.data.size, variant.data.color)
    const { error: variantError } = await supabase.from('product_variants').insert({
      product_id: product.id,
      sku,
      size: variant.data.size || null,
      color: variant.data.color || null,
      price: parsed.data.base_price,
      stock_qty: variant.data.stock_qty,
    })
    if (variantError) {
      redirect(
        `/admin/products?error=${encodeURIComponent(`Бараа үүслээ, гэвч нөөц ороогүй — ${variantError.message}`)}&open=${product.id}`,
      )
    }
    await audit('variant.create', 'product_variants', null, { sku })
  }

  // Зураг нь заавал биш. Бараа аль хэдийн үүссэн тул зураг дээр алдаа
  // гарвал бүхэлд нь бүтэлгүйтсэн мэт мессеж өгвөл ажилтан төөрнө.
  const files = pickFiles(formData)
  if (files.length > 0) {
    const failure = await saveProductImages(supabase, product.id, files, parsed.data.name_mn)
    if (failure) {
      redirect(
        `/admin/products?error=${encodeURIComponent(`Бараа үүслээ, гэвч зураг ороогүй — ${failure}`)}`,
      )
    }
  }

  revalidatePath('/admin/products')
  revalidatePath('/', 'layout')
  // Шинэ барааны цонхыг шууд нээнэ — дараагийн алхам нь ямагт хувилбар нэмэх.
  redirect(`/admin/products?ok=1&open=${product.id}`)
}

export async function addVariant(formData: FormData): Promise<void> {
  await requireStaff()

  const parsed = z
    .object({
      product_id: uuid,
      sku: z.string().trim().min(2),
      size: z.string().trim().default(''),
      color: z.string().trim().default(''),
      price: z.coerce.number().int().min(0),
      stock_qty: z.coerce.number().int().min(0),
    })
    .safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    redirect(`/admin/products?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? 'invalid')}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.from('product_variants').insert({
    ...parsed.data,
    size: parsed.data.size || null,
    color: parsed.data.color || null,
  })

  if (error) redirect(`/admin/products?error=${encodeURIComponent(error.message)}`)

  await audit('variant.create', 'product_variants', null, { sku: parsed.data.sku })
  revalidatePath('/admin/products')
  redirect(backToProduct(formData))
}

/* ── Барааны зураг ─────────────────────────────────────────────────────── */

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

/**
 * НЭГ зургийг Supabase Storage-д байршуулаад нийтийн хаягийг нь буцаана.
 *
 * Бараа, багш хоёр ижил шалгалт (төрөл, хэмжээ), ижил bucket, ижил замын
 * хэвтэй тул логикийг нэг газар төвлөрүүлэв. Ялгаа нь зөвхөн `folder`:
 * `products/<id>/…` эсвэл `instructors/<id>/…`.
 *
 * Алдааг ШИДЭХГҮЙ, буцаана — дуудагч тал бүр өөр өөр мессеж угсрах
 * хэрэгтэй («бараа үүслээ, гэвч зураг ороогүй» гэх мэт).
 */
async function uploadImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  folder: 'products' | 'instructors' | 'gallery',
  ownerId: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { error: `${file.name}: JPG, PNG, WEBP эсвэл AVIF байх ёстой` }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: `${file.name}: 5MB-аас хэтэрсэн байна` }
  }

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${folder}/${ownerId}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage
    .from('media')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) return { error: error.message }

  const {
    data: { publicUrl },
  } = supabase.storage.from('media').getPublicUrl(path)

  await audit(`${folder}.image.upload`, folder, ownerId, { path })
  return { url: publicUrl }
}

/**
 * Барааны зургуудыг Supabase Storage-д байршуулна.
 *
 * Файлыг `media` bucket дотор `products/<барааны id>/` замд хадгална.
 * Bucket нийтэд уншигдах тул зураг шууд харагдана; бичих эрх нь
 * `media_staff_write` бодлогоор зөвхөн ажилтанд нээлттэй.
 *
 * Алдааны текстийг БУЦААНА (redirect хийхгүй) — дуудагч тал нь «бараа
 * үүссэн ч зураг ороогүй» гэх зэрэг өөр өөр мессеж угсрах хэрэгтэй.
 */
async function saveProductImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  files: File[],
  alt: string,
): Promise<string | null> {
  // Одоо байгаа зургуудын араас нэмнэ
  const { count } = await supabase
    .from('product_images')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)

  let order = count ?? 0

  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return `${file.name}: JPG, PNG, WEBP эсвэл AVIF байх ёстой`
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return `${file.name}: 5MB-аас хэтэрсэн байна`
    }

    const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const path = `products/${productId}/${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) return uploadError.message

    const {
      data: { publicUrl },
    } = supabase.storage.from('media').getPublicUrl(path)

    order += 1
    const { error } = await supabase.from('product_images').insert({
      product_id: productId,
      url: publicUrl,
      alt,
      sort_order: order,
    })

    if (error) return error.message

    await audit('product_image.upload', 'product_images', productId, { path })
  }

  return null
}

/** `<input type="file" multiple>` -ээс бодит файлуудыг л шүүнэ. */
function pickFiles(formData: FormData): File[] {
  return formData
    .getAll('file')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
}

export async function uploadProductImage(formData: FormData): Promise<void> {
  await requireStaff()

  const productId = uuid.safeParse(formData.get('product_id'))
  const files = pickFiles(formData)
  const alt = String(formData.get('alt') ?? '').trim()

  if (!productId.success || files.length === 0) {
    redirect('/admin/products?error=' + encodeURIComponent('Зураг сонгоно уу'))
  }

  const supabase = await createClient()
  const failure = await saveProductImages(supabase, productId.data, files, alt)
  if (failure) {
    redirect(backToProduct(formData, `error=${encodeURIComponent(failure)}`))
  }

  revalidatePath('/admin/products')
  revalidatePath('/', 'layout')
  redirect(backToProduct(formData))
}

export async function deleteProductImage(formData: FormData): Promise<void> {
  await requireStaff()

  const imageId = uuid.safeParse(formData.get('image_id'))
  if (!imageId.success) redirect('/admin/products?error=invalid')

  const supabase = await createClient()
  const { data: image } = await supabase
    .from('product_images')
    .select('*')
    .eq('id', imageId.data)
    .maybeSingle()

  if (image) {
    // Storage дотроос ч устгана — эс бөгөөс ашиглагдахгүй файл хуримтлагдана
    const marker = '/storage/v1/object/public/media/'
    const index = image.url.indexOf(marker)
    if (index !== -1) {
      await supabase.storage.from('media').remove([image.url.slice(index + marker.length)])
    }

    await supabase.from('product_images').delete().eq('id', imageId.data)
    await audit('product_image.delete', 'product_images', imageId.data)
  }

  revalidatePath('/admin/products')
  revalidatePath('/', 'layout')
  redirect(backToProduct(formData))
}

/* ── Захиалга ──────────────────────────────────────────────────────────── */

export async function updateOrderStatus(formData: FormData): Promise<void> {
  await requireStaff()

  const id = uuid.safeParse(formData.get('order_id'))
  const status = z
    .enum(['pending_payment', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .safeParse(formData.get('status'))

  if (id.success && status.success) {
    const supabase = await createClient()
    // Цуцлах тохиолдолд нөөцийг буцаах логик функц дотор байгаа.
    const { error } = await supabase.rpc('set_order_status', {
      p_order_id: id.data,
      p_status: status.data as OrderStatus,
    })
    if (error) redirect(`/admin/orders?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/admin/orders')
  redirect('/admin/orders?ok=1')
}

/* ── Хэрэглэгчийн эрх ──────────────────────────────────────────────────── */

export async function setUserRole(formData: FormData): Promise<void> {
  // Эрх олгох нь зөвхөн admin-д. DB дээр `guard_profile_role` trigger давхар шалгана.
  await requireAdmin()

  const id = uuid.safeParse(formData.get('user_id'))
  const role = z.enum(['customer', 'instructor', 'staff', 'admin']).safeParse(formData.get('role'))

  if (id.success && role.success) {
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').update({ role: role.data }).eq('id', id.data)
    if (error) redirect(`/admin/customers?error=${encodeURIComponent(error.message)}`)
    await audit('profile.role', 'profiles', id.data, { role: role.data })
  }

  revalidatePath('/admin/customers')
  // Цонх байсан газраа эргэж нээгдэнэ (§ components/admin/CustomerTable.tsx)
  redirect(`/admin/customers?ok=1${id.success ? `&open=${id.data}` : ''}`)
}

