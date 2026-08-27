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
  class_type_id: uuid,
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

export async function createSessions(formData: FormData): Promise<void> {
  await requireStaff()

  const parsed = sessionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    redirect(`/admin/schedule?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? 'invalid')}`)
  }

  const input = parsed.data
  const startsAt = ulaanbaatarToIso(input.starts_at)
  const supabase = await createClient()

  if (input.weeks > 1) {
    // Давтагдах цувралыг DB функц үүсгэнэ — цагийн тооцоо нэг газарт.
    const { error } = await supabase.rpc('create_session_series', {
      p_class_type_id: input.class_type_id,
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
      class_type_id: input.class_type_id,
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

/* ── Ирц ───────────────────────────────────────────────────────────────── */

export async function markAttendance(formData: FormData): Promise<void> {
  await requireStaff()

  const id = uuid.safeParse(formData.get('booking_id'))
  const status = z.enum(['attended', 'no_show', 'confirmed']).safeParse(formData.get('status'))
  const sessionId = String(formData.get('session_id') ?? '')

  if (id.success && status.success) {
    const supabase = await createClient()
    await supabase.from('bookings').update({ status: status.data }).eq('id', id.data)
    await audit('booking.attendance', 'bookings', id.data, { status: status.data })
  }

  revalidatePath('/admin/bookings')
  redirect(`/admin/bookings${sessionId ? `?session=${sessionId}` : ''}`)
}

/* ── Хичээлийн төрөл ───────────────────────────────────────────────────── */

const classTypeSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, 'slug нь зөвхөн a-z, 0-9, - байна'),
  name_mn: z.string().trim().min(2),
  name_en: z.string().trim().default(''),
  desc_mn: z.string().trim().default(''),
  desc_en: z.string().trim().default(''),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  duration_min: z.coerce.number().int().min(15).max(300),
  base_price: z.coerce.number().int().min(0),
})

export async function createClassType(formData: FormData): Promise<void> {
  await requireStaff()

  const parsed = classTypeSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    redirect(`/admin/classes?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? 'invalid')}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.from('class_types').insert(parsed.data)
  if (error) redirect(`/admin/classes?error=${encodeURIComponent(error.message)}`)

  await audit('class_type.create', 'class_types', null, { slug: parsed.data.slug })
  revalidatePath('/admin/classes')
  redirect('/admin/classes?ok=1')
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

  revalidatePath(back)
  redirect(back.startsWith('/admin') ? back : '/admin')
}

/* ── Багш ──────────────────────────────────────────────────────────────── */

const instructorSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/),
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
  const { error } = await supabase.from('instructors').insert({
    ...parsed.data,
    instagram: parsed.data.instagram || null,
    photo_url: parsed.data.photo_url || null,
  })

  if (error) redirect(`/admin/instructors?error=${encodeURIComponent(error.message)}`)

  await audit('instructor.create', 'instructors', null, { slug: parsed.data.slug })
  revalidatePath('/admin/instructors')
  redirect('/admin/instructors?ok=1')
}

/* ── Дэлгүүр ───────────────────────────────────────────────────────────── */

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
  redirect('/admin/products?ok=1')
}

const productSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/),
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
  const { error } = await supabase.from('products').insert(parsed.data)
  if (error) redirect(`/admin/products?error=${encodeURIComponent(error.message)}`)

  await audit('product.create', 'products', null, { slug: parsed.data.slug })
  revalidatePath('/admin/products')
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
  redirect('/admin/products?ok=1')
}

/* ── Барааны зураг ─────────────────────────────────────────────────────── */

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

/**
 * Барааны зургийг Supabase Storage-д байршуулна.
 *
 * Файлыг `media` bucket дотор `products/<барааны id>/` замд хадгална.
 * Bucket нийтэд уншигдах тул зураг шууд харагдана; бичих эрх нь
 * `media_staff_write` бодлогоор зөвхөн ажилтанд нээлттэй.
 */
export async function uploadProductImage(formData: FormData): Promise<void> {
  await requireStaff()

  const productId = uuid.safeParse(formData.get('product_id'))
  const file = formData.get('file')
  const alt = String(formData.get('alt') ?? '').trim()

  if (!productId.success || !(file instanceof File) || file.size === 0) {
    redirect('/admin/products?error=' + encodeURIComponent('Зураг сонгоно уу'))
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    redirect('/admin/products?error=' + encodeURIComponent('JPG, PNG, WEBP эсвэл AVIF байх ёстой'))
  }

  if (file.size > MAX_IMAGE_BYTES) {
    redirect('/admin/products?error=' + encodeURIComponent('Зураг 5MB-аас хэтэрсэн байна'))
  }

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `products/${productId.data}/${crypto.randomUUID()}.${extension}`

  const supabase = await createClient()
  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    redirect('/admin/products?error=' + encodeURIComponent(uploadError.message))
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('media').getPublicUrl(path)

  // Одоо байгаа зургуудын араас нэмнэ
  const { count } = await supabase
    .from('product_images')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId.data)

  const { error } = await supabase.from('product_images').insert({
    product_id: productId.data,
    url: publicUrl,
    alt,
    sort_order: (count ?? 0) + 1,
  })

  if (error) {
    redirect('/admin/products?error=' + encodeURIComponent(error.message))
  }

  await audit('product_image.upload', 'product_images', productId.data, { path })
  revalidatePath('/admin/products')
  revalidatePath('/', 'layout')
  redirect('/admin/products?ok=1')
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
  redirect('/admin/products?ok=1')
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
  redirect('/admin/customers?ok=1')
}

/* ── Контент ───────────────────────────────────────────────────────────── */

export async function updateSiteContent(formData: FormData): Promise<void> {
  await requireStaff()

  const key = z.string().trim().min(1).safeParse(formData.get('key'))
  if (!key.success) redirect('/admin/content?error=invalid')

  // Талбарууд `mn.title`, `en.title` хэлбэрээр ирнэ.
  const valueMn: Record<string, string> = {}
  const valueEn: Record<string, string> = {}

  for (const [name, value] of formData.entries()) {
    if (typeof value !== 'string') continue
    if (name.startsWith('mn.')) valueMn[name.slice(3)] = value
    if (name.startsWith('en.')) valueEn[name.slice(3)] = value
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('site_content')
    .update({ value_mn: valueMn, value_en: valueEn, updated_at: new Date().toISOString() })
    .eq('key', key.data)

  if (error) redirect(`/admin/content?error=${encodeURIComponent(error.message)}`)

  await audit('content.update', 'site_content', null, { key: key.data })
  revalidatePath('/', 'layout')
  redirect('/admin/content?ok=1')
}

export async function markMessageRead(formData: FormData): Promise<void> {
  await requireStaff()

  const id = uuid.safeParse(formData.get('message_id'))
  if (id.success) {
    const supabase = await createClient()
    await supabase.from('contact_messages').update({ is_read: true }).eq('id', id.data)
  }

  revalidatePath('/admin/messages')
  redirect('/admin/messages')
}
