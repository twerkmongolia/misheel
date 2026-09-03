'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getUser, requireAdmin, requireStaff } from '@/lib/auth/dal'
import type { Instructor, OrderStatus } from '@/lib/supabase/database.types'

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
  table: 'class_types' | 'products' | 'instructors' | 'courses',
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

  const table = z
    .enum(['class_types', 'instructors', 'products', 'locations', 'faq_items'])
    .safeParse(formData.get('table'))
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

  const { data: instructor, error } = await supabase
    .from('instructors')
    .insert({
      ...parsed.data,
      slug,
      instagram: parsed.data.instagram || null,
      photo_url: parsed.data.photo_url || null,
    })
    .select('id')
    .single()

  if (error || !instructor) {
    redirect(`/admin/instructors?error=${encodeURIComponent(error?.message ?? 'Багш нэмэгдсэнгүй')}`)
  }

  await audit('instructor.create', 'instructors', instructor.id, { slug })

  /* Зураг нь заавал биш. Багш аль хэдийн үүссэн тул зураг дээр алдаа гарвал
     бүхэлд нь бүтэлгүйтсэн мэт мессеж өгвөл ажилтан төөрнө — юу болсныг
     ЯГ хэлээд, дахин оролдох боломжийг үлдээнэ.

     Байршуулах нь багшийн id мэдэгдсэний ДАРАА болно: файлын зам түүнээс
     угсрагддаг тул урьдчилж хийж болохгүй. */
  const [photo] = pickFiles(formData)
  if (photo) {
    const uploaded = await uploadImage(supabase, 'instructors', instructor.id, photo)
    if ('error' in uploaded) {
      redirect(
        `/admin/instructors?error=${encodeURIComponent(`Багш нэмэгдлээ, гэвч зураг ороогүй — ${uploaded.error}`)}`,
      )
    }
    await supabase.from('instructors').update({ photo_url: uploaded.url }).eq('id', instructor.id)
  }

  revalidatePath('/admin/instructors')
  // Нийтийн «Багш нар» хуудас ч шинэчлэгдэх ёстой
  revalidatePath('/', 'layout')
  redirect('/admin/instructors?ok=1')
}

/**
 * Багшийн мэдээллийг засна.
 *
 * `slug` -г ЗОРИУДААР хөндөхгүй: нийтийн сайтын хаяг (`/mn/instructors/saraa`)
 * түүн дээр тогтдог тул нэр засах бүрд хаяг өөрчлөгдвөл гадны холбоос,
 * хуваалцсан хуудас бүгд эвдэрнэ.
 *
 * Зураг нь заавал биш: шинэ файл ирвэл л солино, эс тэгвэл хуучин нь үлдэнэ.
 */
export async function updateInstructor(formData: FormData): Promise<void> {
  await requireStaff()

  const id = uuid.safeParse(formData.get('id'))
  const parsed = instructorSchema.safeParse(Object.fromEntries(formData))

  if (!id.success || !parsed.success) {
    redirect(
      `/admin/instructors?error=${encodeURIComponent(parsed.success ? 'Багш олдсонгүй' : (parsed.error.issues[0]?.message ?? 'invalid'))}`,
    )
  }

  const supabase = await createClient()
  const patch: Partial<Instructor> = {
    name: parsed.data.name,
    bio_mn: parsed.data.bio_mn,
    bio_en: parsed.data.bio_en,
    instagram: parsed.data.instagram || null,
  }

  const [photo] = pickFiles(formData)
  if (photo) {
    const uploaded = await uploadImage(supabase, 'instructors', id.data, photo)
    if ('error' in uploaded) {
      redirect(`/admin/instructors?error=${encodeURIComponent(uploaded.error)}&open=${id.data}`)
    }
    patch.photo_url = uploaded.url
  }

  const { error } = await supabase.from('instructors').update(patch).eq('id', id.data)
  if (error) redirect(`/admin/instructors?error=${encodeURIComponent(error.message)}`)

  await audit('instructor.update', 'instructors', id.data, {})
  revalidatePath('/admin/instructors')
  revalidatePath('/', 'layout')
  redirect('/admin/instructors?ok=1')
}

/**
 * Хичээлийн төрлийг засна.
 *
 * Үнэ, хугацаа өөрчлөгдөхөд АЛЬ ХЭДИЙН товлогдсон хичээлүүд хөндөгдөхгүй:
 * `class_sessions` нь өөрийн `price` -тэй бөгөөд түүнийг үүсэх мөчид хуулж
 * авдаг. Өнөөдөр үнээ өсгөхөд өчигдөр бүртгүүлсэн хүнээс нэмж авах нь
 * буруу тул энэ нь ЗӨВ зан — гэхдээ ажилтанд мэдэгдэх ёстой.
 */
export async function updateClassType(formData: FormData): Promise<void> {
  await requireStaff()

  const id = uuid.safeParse(formData.get('id'))
  const parsed = z
    .object({
      name_mn: z.string().trim().min(2),
      name_en: z.string().trim().default(''),
      desc_mn: z.string().trim().default(''),
      desc_en: z.string().trim().default(''),
      level: z.enum(['beginner', 'intermediate', 'advanced']),
      duration_min: z.coerce.number().int().min(15).max(240),
      base_price: z.coerce.number().int().min(0),
    })
    .safeParse(Object.fromEntries(formData))

  if (!id.success || !parsed.success) {
    redirect(
      `/admin/schedule?error=${encodeURIComponent(parsed.success ? 'Хичээл олдсонгүй' : (parsed.error.issues[0]?.message ?? 'invalid'))}`,
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.from('class_types').update(parsed.data).eq('id', id.data)
  if (error) redirect(`/admin/schedule?error=${encodeURIComponent(error.message)}`)

  await audit('class_type.update', 'class_types', id.data, {})
  revalidatePath('/admin/schedule')
  revalidatePath('/', 'layout')
  redirect('/admin/schedule?ok=1')
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

/**
 * Барааны ЭХНИЙ хувилбар — «нэмэх» цонхонд хамт бөглөгдөнө.
 *
 * Хувилбаргүй бараа нь дэлгүүрт үнэгүй, нөөцгүй тул худалдаанд гарахгүй.
 * Урьд нь бараа үүсгээд, дараа нь картыг нээж хувилбар нэмэх хоёр алхам
 * байсан — хоёр дахь нь мартагдвал бараа чимээгүй үл үзэгдэх болдог.
 * Одоо эхний хувилбар нь барааны хамт үүснэ.
 */
const firstVariantSchema = z.object({
  size: z.string().trim().default(''),
  color: z.string().trim().default(''),
  stock_qty: z.coerce.number().int().min(0).default(0),
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
  /* Бараа нөөцтэйгээ үүссэн тул картыг заавал нээх шаардлагагүй болов.
     Зураг эсвэл нэмэлт хэмжээ хэрэгтэй бол ажилтан өөрөө дарж орно. */
  redirect('/admin/products?ok=1')
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
  folder: 'products' | 'instructors' | 'courses' | 'gallery',
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
    const uploaded = await uploadImage(supabase, 'products', productId, file)
    if ('error' in uploaded) return uploaded.error

    order += 1
    const { error } = await supabase.from('product_images').insert({
      product_id: productId,
      url: uploaded.url,
      alt,
      sort_order: order,
    })

    if (error) return error.message
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

  /* Шүүлтээ хадгална. Урьд нь ямар ч тохиолдолд шүүлтгүй жагсаалт руу
     буцдаг байсан тул «төлбөр хүлээж буй» гэж шүүгээд нэгийг шийдэх бүрд
     шүүлт нь алдагдаж, дахин сонгох ёстой болдог байв. */
  const back = String(formData.get('back') ?? '')
  const safe = back.startsWith('/admin/orders') ? back : '/admin/orders'
  redirect(`${safe}${safe.includes('?') ? '&' : '?'}ok=1`)
}

/* ── Түгээмэл асуулт ───────────────────────────────────────────────────── */

const faqSchema = z.object({
  question_mn: z.string().trim().min(3),
  question_en: z.string().trim().default(''),
  answer_mn: z.string().trim().min(3),
  answer_en: z.string().trim().default(''),
  sort_order: z.coerce.number().int().min(0).default(0),
})

export async function createFaq(formData: FormData): Promise<void> {
  await requireStaff()

  const parsed = faqSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    redirect(`/admin/faq?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? 'invalid')}`)
  }

  const supabase = await createClient()

  /* Дараалал заагаагүй бол ЭЦЭСТ нь тавина. Шинэ асуулт бүр 0 дугаартай
     гарч ирвэл жагсаалтын толгойд овоорч, гараар эрэмбэлэх ажил үүснэ. */
  let order = parsed.data.sort_order
  if (order === 0) {
    const { data: last } = await supabase
      .from('faq_items')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    order = (last?.sort_order ?? 0) + 1
  }

  const { error } = await supabase.from('faq_items').insert({ ...parsed.data, sort_order: order })
  if (error) redirect(`/admin/faq?error=${encodeURIComponent(error.message)}`)

  await audit('faq.create', 'faq_items', null, { question: parsed.data.question_mn })
  revalidatePath('/admin/faq')
  revalidatePath('/', 'layout')
  redirect('/admin/faq?ok=1')
}

export async function updateFaq(formData: FormData): Promise<void> {
  await requireStaff()

  const id = uuid.safeParse(formData.get('id'))
  const parsed = faqSchema.safeParse(Object.fromEntries(formData))

  if (!id.success || !parsed.success) {
    redirect(
      `/admin/faq?error=${encodeURIComponent(parsed.success ? 'Асуулт олдсонгүй' : (parsed.error.issues[0]?.message ?? 'invalid'))}`,
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.from('faq_items').update(parsed.data).eq('id', id.data)
  if (error) redirect(`/admin/faq?error=${encodeURIComponent(error.message)}`)

  await audit('faq.update', 'faq_items', id.data, {})
  revalidatePath('/admin/faq')
  revalidatePath('/', 'layout')
  redirect('/admin/faq?ok=1')
}

/**
 * Асуултыг УСТГАНА.
 *
 * Идэвхгүй болгох нь ихэнх тохиолдолд зөв ч (§ `toggleActive`), алдаатай
 * бичсэн, давхардсан асуултыг үүрд нуугдмал байлгах нь жагсаалтыг хогийн
 * сав болгоно. Устгал нь эргэхгүй тул зөвхөн энд — нийтийн сайтад
 * харагддаггүй бичлэгт.
 */
export async function deleteFaq(formData: FormData): Promise<void> {
  await requireStaff()

  const id = uuid.safeParse(formData.get('id'))
  if (id.success) {
    const supabase = await createClient()
    const { error } = await supabase.from('faq_items').delete().eq('id', id.data)
    if (error) redirect(`/admin/faq?error=${encodeURIComponent(error.message)}`)
    await audit('faq.delete', 'faq_items', id.data, {})
  }

  revalidatePath('/admin/faq')
  revalidatePath('/', 'layout')
  redirect('/admin/faq?ok=1')
}

/* ── Сайтын агуулга ────────────────────────────────────────────────────── */

/**
 * `site_content` мөрийг шинэчилнэ.
 *
 * Хүснэгт бүхэлдээ ХОЁР jsonb баганатай: `value_mn`, `value_en`. Талбарууд
 * нь түлхүүр бүрд өөр (§ admin/content/page.tsx `GROUPS`) тул энэ үйлдэл
 * тэдгээрийг нэрлэхгүй — формын талбарын нэрнээс нь уншина:
 *
 *   `mn__title`   → зөвхөн монгол хувилбарт
 *   `en__title`   → зөвхөн англи хувилбарт
 *   `both__phone` → хоёуланд нь (утас, Instagram зэрэг хэлнээс хамаарахгүй)
 *
 * Хуучин утгын ДЭЭР бичнэ, орлуулахгүй: формд ороогүй талбар (жишээ нь
 * гараар нэмсэн түлхүүр) алдагдахгүй.
 */
export async function updateSiteContent(formData: FormData): Promise<void> {
  await requireStaff()

  const key = String(formData.get('key') ?? '').trim()
  if (!key) redirect('/admin/content?error=Түлхүүр алга')

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('site_content')
    .select('value_mn, value_en')
    .eq('key', key)
    .maybeSingle()

  type Value = Record<string, string | number>
  const mn: Value = { ...((existing?.value_mn as Value) ?? {}) }
  const en: Value = { ...((existing?.value_en as Value) ?? {}) }

  /* Тоон талбарыг ТООГООР хадгална. jsonb дотор `"6"` ба `6` хоёр өөр зүйл —
     сайт нь `cancel_cutoff_hours` -ийг тоо гэж уншдаг тул мөр болгож
     хадгалбал цуцлах хугацаа чимээгүй ажиллахаа болино. */
  const numeric = new Set(
    String(formData.get('numeric') ?? '')
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean),
  )

  const cast = (name: string, raw: string) => {
    if (!numeric.has(name)) return raw
    const value = Number(raw)
    return Number.isFinite(value) ? value : 0
  }

  for (const [field, raw] of formData.entries()) {
    if (typeof raw !== 'string') continue
    const value = raw.trim()

    if (field.startsWith('mn__')) {
      const name = field.slice(4)
      mn[name] = cast(name, value)
    } else if (field.startsWith('en__')) {
      const name = field.slice(4)
      en[name] = cast(name, value)
    } else if (field.startsWith('both__')) {
      const name = field.slice(6)
      mn[name] = cast(name, value)
      en[name] = cast(name, value)
    }
  }

  const { error } = await supabase
    .from('site_content')
    .upsert({ key, value_mn: mn, value_en: en, updated_at: new Date().toISOString() })

  if (error) redirect(`/admin/content?error=${encodeURIComponent(error.message)}`)

  await audit('site_content.update', 'site_content', null, { key })
  revalidatePath('/admin/content')
  // Агуулга нь бүх нийтийн хуудсанд тархсан — бүхэлд нь шинэчилнэ
  revalidatePath('/', 'layout')
  redirect(`/admin/content?ok=1#${key}`)
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


/* ── Анги, курс ─────────────────────────────────────────────────────────
   Нэг форм ХОЁР хүснэгт рүү бичнэ: `courses` ба (онлайн үед) `course_access`.
   Ажилтны хувьд энэ нь нэг зүйл — «онлайн анги ба түүний Telegram бүлэг».
   Хоёр тусдаа форм болговол хагас тохируулсан анги үүсэх боломж нээгдэнэ:
   зарагдаж байгаа атлаа хаана үзэхийг нь хэлэхгүй анги. */

/* `slug` энд БАЙХГҮЙ. Ажилтанд утгагүй техникийн талбар бөгөөд буруу
   бичвэл хаяг эвдэрдэг тул нэрнээс нь өөрөө үүснэ (§ `uniqueSlug`) —
   бараа, багш хоёртой яг ижил дүрэм. Засварлахад ч хөндөгдөхгүй: нийтийн
   хаяг (`/mn/courses/twerk-4-week`) түүн дээр тогтдог. */
const courseSchema = z.object({
  mode: z.enum(['studio', 'online']),
  name_mn: z.string().trim().min(2),
  name_en: z.string().trim().default(''),
  summary_mn: z.string().trim().default(''),
  summary_en: z.string().trim().default(''),
  desc_mn: z.string().trim().default(''),
  desc_en: z.string().trim().default(''),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.coerce.number().int().min(0).default(0),
  lesson_count: z.coerce.number().int().min(0).default(0),
  schedule_mn: z.string().trim().default(''),
  schedule_en: z.string().trim().default(''),
  sort_order: z.coerce.number().int().min(0).default(0),
})

/** Хоосон мөрийг `null` болгоно — `''` нь огноо, uuid баганад хүчингүй. */
function orNull(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? '').trim()
  return raw === '' ? null : raw
}

/**
 * `datetime-local` → ISO.
 *
 * ⚠️ `datetime-local` нь ЦАГИЙН БҮСГҮЙ утга илгээдэг («2026-10-01T09:00»).
 * Түүнийг шууд хадгалбал Postgres нь серверийн бүсээр (UTC) уншиж, элсэлт
 * УБ-ын цагаар 8 цагаар эрт нээгдэнэ. Ажилтан УБ-д сууж бөглөж байгаа тул
 * +08 гэж ТОДОРХОЙ хэлж өгнө (§ `ulaanbaatarToIso`).
 */
function localDateTimeOrNull(value: FormDataEntryValue | null): string | null {
  const raw = orNull(value)
  return raw ? ulaanbaatarToIso(raw) : null
}

/**
 * Формоос курсын мөр угсарна.
 *
 * Горимоос хамааруулж талбар ЦЭВЭРЛЭНЭ: онлайн ангид байршил, суудал,
 * эхлэх огноо утгагүй. Формд нуусан талбар нь хоосон утга илгээх боломжтой
 * (хэрэглэгч горимоо солиод хадгалбал) тул цэвэрлэлт нь сервер дээр байх
 * ёстой — эс бөгөөс «онлайн атлаа 12 суудалтай» гэсэн мөр үүснэ.
 */
function courseRow(data: z.infer<typeof courseSchema>, formData: FormData) {
  const online = data.mode === 'online'

  return {
    ...data,
    instructor_id: orNull(formData.get('instructor_id')),
    location_id: online ? null : orNull(formData.get('location_id')),
    starts_on: online ? null : orNull(formData.get('starts_on')),
    ends_on: online ? null : orNull(formData.get('ends_on')),
    capacity: online ? null : (Number(formData.get('capacity')) || null),
    enroll_opens_at: localDateTimeOrNull(formData.get('enroll_opens_at')),
    enroll_closes_at: localDateTimeOrNull(formData.get('enroll_closes_at')),
    is_active: formData.get('is_active') === 'on',
  }
}

/**
 * Нүүр зураг — ФАЙЛААР, хаягаар биш.
 *
 * Урьд нь энд «Нүүр зургийн хаяг» гэсэн текст талбар байсан: ажилтан
 * эхлээд Supabase Storage руу орж файлаа байршуулж, хаягийг нь хуулж
 * авчирч буулгах ёстой байв — гурван программ, дөрвөн алхам. Багш, барааны
 * формууд аль хэдийн файл сонгуулдаг (§ `createInstructor`); курс тэр
 * дүрмээс хазайх шалтгаангүй.
 *
 * Алдааны мессежийг БУЦААНА, шидэхгүй: курс аль хэдийн үүссэн байдаг тул
 * дуудагч тал «үүслээ, гэвч зураг ороогүй» гэж ЯГ хэлэх ёстой.
 */
async function saveCover(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseId: string,
  formData: FormData,
): Promise<string | null> {
  const [file] = pickFiles(formData)
  if (!file) return null

  const uploaded = await uploadImage(supabase, 'courses', courseId, file)
  if ('error' in uploaded) return `Анги хадгалагдлаа, гэвч зураг ороогүй — ${uploaded.error}`

  await supabase.from('courses').update({ cover_url: uploaded.url }).eq('id', courseId)
  return null
}

/** Telegram блокийг тусдаа хүснэгтэд бичнэ (§ migration `course_access`). */
async function saveAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseId: string,
  mode: 'studio' | 'online',
  formData: FormData,
) {
  if (mode !== 'online') return

  await supabase.from('course_access').upsert(
    {
      course_id: courseId,
      telegram_url: String(formData.get('telegram_url') ?? '').trim(),
      note_mn: String(formData.get('access_note_mn') ?? '').trim(),
      note_en: String(formData.get('access_note_en') ?? '').trim(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'course_id' },
  )
}

/**
 * Хадгалсны дараа буцах хаяг.
 *
 * Зурвас нь «Танхимын анги», «Онлайн анги» гэсэн ХОЁР цэгтэй, ялгаа нь
 * `?mode=` (§ admin/layout.tsx). Шүүлтүүргүй буцаавал ажилтан хадгалаад
 * бүх ангийн жагсаалтад унаж, дөнгөж засварласан ангиа дахин хайна.
 *
 * Горимыг ХАДГАЛСАН утгаас авна, өмнөх шүүлтүүрээс биш: танхимын ангийг
 * онлайн болгосон бол хүн түүнийгээ дагаж очих ёстой.
 */
function coursesBack(mode: 'studio' | 'online', extra = ''): string {
  return `/admin/courses?mode=${mode}${extra}`
}

export async function createCourse(formData: FormData): Promise<void> {
  await requireStaff()

  /* Алдааны хаягт ч горим үлдэнэ — цонх дахин нээгдэхэд сонголт нь
     ажилтны сонгосон хэвээр байна (§ `CourseForm` `defaultMode`). */
  const mode = formData.get('mode') === 'online' ? 'online' : 'studio'

  const parsed = courseSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    redirect(
      coursesBack(mode, `&error=${encodeURIComponent(parsed.error.issues[0]?.message ?? 'invalid')}`),
    )
  }

  const supabase = await createClient()
  const slug = await uniqueSlug(supabase, 'courses', parsed.data.name_mn)

  const { data: course, error } = await supabase
    .from('courses')
    .insert({ ...courseRow(parsed.data, formData), slug })
    .select('id')
    .single()

  if (error || !course) {
    redirect(coursesBack(mode, `&error=${encodeURIComponent(error?.message ?? 'Үүсгэж чадсангүй')}`))
  }

  await saveAccess(supabase, course.id, parsed.data.mode, formData)
  await audit('course.create', 'courses', course.id, { slug })

  /* Зураг нь курс үүссэний ДАРАА: файлын зам түүний id-аас угсрагддаг.
     Алдаа гарвал бүхэлд нь бүтэлгүйтсэн мэт хэлэхгүй — курс аль хэдийн
     үүссэн бөгөөд ажилтан зургаа дараа нь ч оруулж чадна. */
  const cover = await saveCover(supabase, course.id, formData)
  if (cover) redirect(coursesBack(parsed.data.mode, `&error=${encodeURIComponent(cover)}`))

  revalidatePath('/admin/courses')
  revalidatePath('/', 'layout')
  redirect(coursesBack(parsed.data.mode, '&ok=1'))
}

export async function updateCourse(formData: FormData): Promise<void> {
  await requireStaff()

  const mode = formData.get('mode') === 'online' ? 'online' : 'studio'
  const id = uuid.safeParse(formData.get('id'))
  const parsed = courseSchema.safeParse(Object.fromEntries(formData))

  if (!id.success || !parsed.success) {
    redirect(
      coursesBack(
        mode,
        `&error=${encodeURIComponent(
          parsed.success ? 'Анги олдсонгүй' : (parsed.error.issues[0]?.message ?? 'invalid'),
        )}`,
      ),
    )
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('courses')
    .update(courseRow(parsed.data, formData))
    .eq('id', id.data)

  if (error) redirect(coursesBack(mode, `&error=${encodeURIComponent(error.message)}`))

  await saveAccess(supabase, id.data, parsed.data.mode, formData)
  await audit('course.update', 'courses', id.data, {})

  // Шинэ файл ирвэл л солино — эс тэгвэл хуучин зураг үлдэнэ.
  const cover = await saveCover(supabase, id.data, formData)
  if (cover) redirect(coursesBack(parsed.data.mode, `&error=${encodeURIComponent(cover)}`))

  revalidatePath('/admin/courses')
  revalidatePath('/', 'layout')
  redirect(coursesBack(parsed.data.mode, `&ok=1&open=${id.data}`))
}

/**
 * Ангийг УСТГАНА.
 *
 * Элсэгчтэй анги устахгүй — `course_enrollments.course_id` нь
 * `on delete restrict` (§ migration). Энэ бол зориудын хамгаалалт:
 * элсэгчийн түүх алга болвол «би юунд төлсөн юм бэ» гэсэн асуултад хариулах
 * зүйл үлдэхгүй. Тэр тохиолдолд ажилтан ангиа ИДЭВХГҮЙ болгоно.
 */
export async function deleteCourse(formData: FormData): Promise<void> {
  await requireStaff()

  const mode = formData.get('mode') === 'online' ? 'online' : 'studio'
  const id = uuid.safeParse(formData.get('id'))
  if (!id.success) redirect(coursesBack(mode, '&error=Анги олдсонгүй'))

  const supabase = await createClient()
  const { error } = await supabase.from('courses').delete().eq('id', id.data)

  if (error) {
    redirect(
      coursesBack(
        mode,
        '&error=' +
          encodeURIComponent(
            'Элсэгчтэй ангийг устгах боломжгүй. Оронд нь «Идэвхтэй» тэмдэглэгээг авна уу.',
          ),
      ),
    )
  }

  await audit('course.delete', 'courses', id.data, {})
  revalidatePath('/admin/courses')
  revalidatePath('/', 'layout')
  redirect(coursesBack(mode, '&ok=1'))
}

/** Элсэлтийн төлөв — багтаамжийн тоолуур триггерээр өөрөө шинэчлэгдэнэ. */
export async function updateEnrollmentStatus(formData: FormData): Promise<void> {
  await requireStaff()

  const id = uuid.safeParse(formData.get('enrollment_id'))
  const status = z
    .enum(['pending_payment', 'active', 'cancelled', 'completed'])
    .safeParse(formData.get('status'))

  if (!id.success || !status.success) redirect('/admin/courses?error=Элсэлт олдсонгүй')

  const supabase = await createClient()
  const { error } = await supabase.rpc('set_enrollment_status', {
    p_enrollment_id: id.data,
    p_status: status.data,
  })

  if (error) redirect(`/admin/courses?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/admin/courses')
  revalidatePath('/', 'layout')

  const back = String(formData.get('back') ?? '')
  redirect(back.startsWith('/admin/courses') ? `${back}` : '/admin/courses?ok=1')
}
