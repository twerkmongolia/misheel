import 'server-only'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type {
  ClassSession,
  ClassType,
  GalleryItem,
  FaqItem,
  Instructor,
  Location,
  Product,
  ProductImage,
  ProductVariant,
  SiteContent,
} from '@/lib/supabase/database.types'

/**
 * Уншилтын нэгдсэн цэг.
 *
 * Холбоосыг (join) SQL дээр бус JS дээр хийж байгаа шалтгаан: лавлах хүснэгтүүд
 * (хичээлийн төрөл, багш, байршил) маш жижиг тул бүтнээр нь татаж index хийхэд
 * хамаагүй хямд бөгөөд PostgREST-ийн үүрлэсэн select-ийн төрлийн нарийн
 * тохиргоог шаардахгүй.
 */

export function indexBy<T, K extends keyof T>(rows: T[], key: K): Map<T[K], T> {
  return new Map(rows.map((row) => [row[key], row]))
}

export type SessionView = ClassSession & {
  classType: ClassType | null
  instructor: Instructor | null
  location: Location | null
  seatsLeft: number
}

function attach(
  sessions: ClassSession[],
  classTypes: ClassType[],
  instructors: Instructor[],
  locations: Location[],
): SessionView[] {
  const byClass = indexBy(classTypes, 'id')
  const byInstructor = indexBy(instructors, 'id')
  const byLocation = indexBy(locations, 'id')

  return sessions.map((session) => ({
    ...session,
    classType: byClass.get(session.class_type_id) ?? null,
    instructor: session.instructor_id ? (byInstructor.get(session.instructor_id) ?? null) : null,
    location: session.location_id ? (byLocation.get(session.location_id) ?? null) : null,
    seatsLeft: Math.max(0, session.capacity - session.booked_count),
  }))
}

/**
 * Сайтын агуулга — БҮХНИЙГ нэг л удаа.
 *
 * `site_content` бол цөөн мөртэй түлхүүр/утгын хүснэгт (баатар, холбоо барих,
 * бичлэг гэх мэт). Урьд нь дуудагч бүр өөрийн хэрэгтэй түлхүүрүүдээр тусдаа
 * асуулга явуулдаг байв: нэг хуудас зурагдахад нүүр, хөл, холбоо барих цонх
 * гурвуулаа өөр өөр асуулга илгээж, гурван удаа сүлжээгээр очно.
 *
 * Хүснэгт нь бүтнээрээ ч хямд тул нэг л удаа татаад `cache()` -д хийнэ.
 * React-ийн `cache` нь ХҮСЭЛТИЙН хүрээнд ажилладаг: нэг хуудас зурагдах
 * туршид хэдэн ч дуудагч байсан нэг л асуулга явна.
 */
const allSiteContent = cache(async (): Promise<Map<string, SiteContent>> => {
  if (!isSupabaseConfigured()) return new Map()

  const supabase = await createClient()
  const { data } = await supabase.from('site_content').select('*')
  return indexBy(data ?? [], 'key')
})

export async function getSiteContent(keys: string[]): Promise<Map<string, SiteContent>> {
  const all = await allSiteContent()
  return new Map(
    keys.flatMap((key) => {
      const row = all.get(key)
      return row ? [[key, row] as const] : []
    }),
  )
}

export async function getClassTypes(includeInactive = false): Promise<ClassType[]> {
  if (!isSupabaseConfigured()) return []

  const supabase = await createClient()
  let query = supabase.from('class_types').select('*').order('sort_order')
  if (!includeInactive) query = query.eq('is_active', true)

  const { data } = await query
  return data ?? []
}

export async function getInstructors(includeInactive = false): Promise<Instructor[]> {
  if (!isSupabaseConfigured()) return []

  const supabase = await createClient()
  let query = supabase.from('instructors').select('*').order('sort_order')
  if (!includeInactive) query = query.eq('is_active', true)

  const { data } = await query
  return data ?? []
}

export async function getLocations(): Promise<Location[]> {
  if (!isSupabaseConfigured()) return []

  const supabase = await createClient()
  const { data } = await supabase.from('locations').select('*').order('name')
  return data ?? []
}

/** Хуваарийн хуудсанд: тухайн хугацаанд багтах бүх хичээл. */
export async function getSessionsBetween(from: Date, to: Date): Promise<SessionView[]> {
  if (!isSupabaseConfigured()) return []

  const supabase = await createClient()
  const [{ data: sessions }, classTypes, instructors, locations] = await Promise.all([
    supabase
      .from('class_sessions')
      .select('*')
      .gte('starts_at', from.toISOString())
      .lt('starts_at', to.toISOString())
      .order('starts_at'),
    getClassTypes(true),
    getInstructors(true),
    getLocations(),
  ])

  return attach(sessions ?? [], classTypes, instructors, locations)
}

/** Нүүр хуудсанд: ойрын хичээлүүд. */
export async function getUpcomingSessions(limit = 6): Promise<SessionView[]> {
  if (!isSupabaseConfigured()) return []

  const supabase = await createClient()
  const [{ data: sessions }, classTypes, instructors, locations] = await Promise.all([
    supabase
      .from('class_sessions')
      .select('*')
      .eq('status', 'scheduled')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at')
      .limit(limit),
    getClassTypes(true),
    getInstructors(true),
    getLocations(),
  ])

  return attach(sessions ?? [], classTypes, instructors, locations)
}

export async function getSession(id: string): Promise<SessionView | null> {
  if (!isSupabaseConfigured()) return null

  const supabase = await createClient()
  const { data } = await supabase.from('class_sessions').select('*').eq('id', id).maybeSingle()
  if (!data) return null

  const [classTypes, instructors, locations] = await Promise.all([
    getClassTypes(true),
    getInstructors(true),
    getLocations(),
  ])

  return attach([data], classTypes, instructors, locations)[0] ?? null
}

/** Тухайн хэрэглэгчийн идэвхтэй бүртгэлтэй хичээлүүдийн id. */
export async function getMyBookedSessionIds(userId: string | null): Promise<Set<string>> {
  if (!userId || !isSupabaseConfigured()) return new Set()

  const supabase = await createClient()
  const { data } = await supabase
    .from('bookings')
    .select('session_id')
    .eq('user_id', userId)
    .in('status', ['pending', 'confirmed', 'attended'])

  return new Set((data ?? []).map((row) => row.session_id))
}

/**
 * Тухайн хэрэглэгч ХҮЛЭЭЛГИЙН ЖАГСААЛТАД байгаа хичээлүүд.
 *
 * `getMyBookedSessionIds` -тэй ижил хэв: мөр бүрд асуулт явуулахын оронд
 * нэг удаа татаад Set болгоно.
 */
export async function getMyWaitlistSessionIds(userId: string | null): Promise<Set<string>> {
  if (!userId || !isSupabaseConfigured()) return new Set()

  const supabase = await createClient()
  const { data } = await supabase.from('waitlist').select('session_id').eq('user_id', userId)

  return new Set((data ?? []).map((row) => row.session_id))
}

export type ProductView = Product & {
  images: ProductImage[]
  variants: ProductVariant[]
  minPrice: number
  inStock: boolean
}

function buildProducts(
  products: Product[],
  images: ProductImage[],
  variants: ProductVariant[],
): ProductView[] {
  return products.map((product) => {
    const productVariants = variants
      .filter((variant) => variant.product_id === product.id)
      .sort((a, b) => a.sku.localeCompare(b.sku))

    const prices = productVariants.map((variant) => variant.price)

    return {
      ...product,
      images: images
        .filter((image) => image.product_id === product.id)
        .sort((a, b) => a.sort_order - b.sort_order),
      variants: productVariants,
      minPrice: prices.length > 0 ? Math.min(...prices) : product.base_price,
      inStock: productVariants.some((variant) => variant.stock_qty > 0),
    }
  })
}

export async function getProducts(includeInactive = false): Promise<ProductView[]> {
  if (!isSupabaseConfigured()) return []

  const supabase = await createClient()
  let query = supabase.from('products').select('*').order('sort_order')
  if (!includeInactive) query = query.eq('is_active', true)

  const { data: products } = await query
  if (!products || products.length === 0) return []

  const ids = products.map((product) => product.id)
  const [{ data: images }, { data: variants }] = await Promise.all([
    supabase.from('product_images').select('*').in('product_id', ids),
    supabase.from('product_variants').select('*').in('product_id', ids),
  ])

  return buildProducts(products, images ?? [], variants ?? [])
}

export async function getProductBySlug(slug: string): Promise<ProductView | null> {
  if (!isSupabaseConfigured()) return null

  const supabase = await createClient()
  const { data: product } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle()
  if (!product) return null

  const [{ data: images }, { data: variants }] = await Promise.all([
    supabase.from('product_images').select('*').eq('product_id', product.id),
    supabase.from('product_variants').select('*').eq('product_id', product.id),
  ])

  return buildProducts([product], images ?? [], variants ?? [])[0] ?? null
}

/** Сагсанд байгаа хувилбаруудын бүрэн мэдээлэл — үнийг ҮРГЭЛЖ эндээс авна. */
export async function getVariantsWithProduct(
  variantIds: string[],
): Promise<{ variant: ProductVariant; product: Product; image: ProductImage | null }[]> {
  if (variantIds.length === 0) return []

  if (!isSupabaseConfigured()) return []

  const supabase = await createClient()
  const { data: variants } = await supabase.from('product_variants').select('*').in('id', variantIds)
  if (!variants || variants.length === 0) return []

  const productIds = [...new Set(variants.map((variant) => variant.product_id))]
  const [{ data: products }, { data: images }] = await Promise.all([
    supabase.from('products').select('*').in('id', productIds),
    supabase.from('product_images').select('*').in('product_id', productIds),
  ])

  const byProduct = indexBy(products ?? [], 'id')

  return variants.flatMap((variant) => {
    const product = byProduct.get(variant.product_id)
    if (!product) return []
    const image = (images ?? []).find((item) => item.product_id === product.id) ?? null
    return [{ variant, product, image }]
  })
}

export async function getGallery(): Promise<GalleryItem[]> {
  if (!isSupabaseConfigured()) return []

  const supabase = await createClient()
  const { data } = await supabase.from('gallery_items').select('*').order('sort_order')
  return data ?? []
}

export async function getFaq(): Promise<FaqItem[]> {
  if (!isSupabaseConfigured()) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('faq_items')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  return data ?? []
}
