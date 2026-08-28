import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { formatInTimeZone } from 'date-fns-tz'
import { TIMEZONE } from './format'
import type {
  ClassType,
  FaqItem,
  GalleryItem,
  Instructor,
  Location,
  Product,
  ProductImage,
  ProductVariant,
  SiteContent,
} from './supabase/database.types'

/**
 * Демо өгөгдөл — ЗӨВХӨН `DEMO_DATA=1` үед.
 *
 * Зорилго: Supabase-ийн migration ажиллуулахаас өмнө дизайныг дүүрэн
 * агуулгатай нь харах. Агуулга нь `supabase/seed.sql` -тай яг ижил тул
 * демог унтраахад хуудас өөрчлөгдөхгүй.
 *
 * Уншилт л демогоор солигдоно. Бүртгүүлэх, захиалах зэрэг бичилт нь
 * DB рүү очих тул демо горимд ажиллахгүй — энэ нь санаатай.
 */

export function demoEnabled(): boolean {
  return process.env.DEMO_DATA === '1'
}

/** Тогтмол текстээс тогтмол uuid — дахин ачаалах бүрд ижил id гарна. */
function stableUuid(seed: string): string {
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < seed.length; i++) {
    h1 = Math.imul(h1 ^ seed.charCodeAt(i), 0x01000193) >>> 0
    h2 = Math.imul(h2 + seed.charCodeAt(i) * (i + 7), 0x85ebca6b) >>> 0
  }
  const hex = (n: number) => n.toString(16).padStart(8, '0')
  const raw = hex(h1) + hex(h2) + hex(h1 ^ h2) + hex((h1 + h2) >>> 0)
  return [
    raw.slice(0, 8),
    raw.slice(8, 12),
    `4${raw.slice(13, 16)}`,
    `8${raw.slice(17, 20)}`,
    raw.slice(20, 32),
  ].join('-')
}

function pseudoRandom(seed: string, max: number): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 0x01000193) >>> 0
  }
  return h % (max + 1)
}

const now = '2020-01-01T00:00:00.000Z' // created_at — харагддаггүй тул тогтмол

/* ── Байршил ───────────────────────────────────────────────────────────── */

export const demoLocations: Location[] = [
  {
    id: stableUuid('loc-main'),
    name: 'Үндсэн заал',
    address_mn: 'СБД, 1-р хороо, Их сургуулийн гудамж 12, 3 давхар',
    address_en: 'Sukhbaatar district, Ikh Surguuliin gudamj 12, 3rd floor',
    map_url: null,
    default_capacity: 16,
    is_active: true,
  },
  {
    id: stableUuid('loc-small'),
    name: 'Жижиг заал',
    address_mn: 'СБД, 1-р хороо, Их сургуулийн гудамж 12, 2 давхар',
    address_en: 'Sukhbaatar district, Ikh Surguuliin gudamj 12, 2nd floor',
    map_url: null,
    default_capacity: 8,
    is_active: true,
  },
]

/* ── Багш ──────────────────────────────────────────────────────────────── */

export const demoInstructors: Instructor[] = [
  {
    id: stableUuid('ins-saraa'),
    profile_id: null,
    slug: 'saraa',
    name: 'Сараа',
    bio_mn:
      'Twerk Mongolia-гийн үүсгэн байгуулагч. 8 жилийн туршлагатай, анхан шатны хичээлүүдийг хөтөлдөг.',
    bio_en: 'Founder of Twerk Mongolia. Eight years of experience, leads the beginner classes.',
    photo_url: '/media/studio-1.svg',
    instagram: 'saraa.dance',
    sort_order: 1,
    is_active: true,
    created_at: now,
  },
  {
    id: stableUuid('ins-nomin'),
    profile_id: null,
    slug: 'nomin',
    name: 'Номин',
    bio_mn: 'Choreography болон ахисан түвшний хичээл заадаг. Олон улсын тэмцээний шагналт.',
    bio_en: 'Teaches choreography and advanced classes. International competition medalist.',
    photo_url: '/media/studio-2.svg',
    instagram: 'nomin.moves',
    sort_order: 2,
    is_active: true,
    created_at: now,
  },
  {
    id: stableUuid('ins-tsetseg'),
    profile_id: null,
    slug: 'tsetseg',
    name: 'Цэцэг',
    bio_mn: 'Stretching болон биеийн бэлтгэлийн хичээл. Дасгал зүтгэлтний мэргэжилтэн.',
    bio_en: 'Stretching and conditioning classes. Certified fitness trainer.',
    photo_url: '/media/studio-3.svg',
    instagram: 'tsetseg.flex',
    sort_order: 3,
    is_active: true,
    created_at: now,
  },
]

/* ── Хичээлийн төрөл ───────────────────────────────────────────────────── */

export const demoClassTypes: ClassType[] = [
  {
    id: stableUuid('ct-basics'),
    slug: 'twerk-basics',
    name_mn: 'Twerk үндэс',
    name_en: 'Twerk Basics',
    desc_mn:
      'Огт туршлагагүй хүнд зориулсан. Үндсэн хөдөлгөөн, хэмнэл, биеийн байрлалыг эхнээс нь заана.',
    desc_en: 'For complete beginners. Core movements, rhythm and body positioning from scratch.',
    level: 'beginner',
    duration_min: 60,
    cover_url: '/media/studio-4.svg',
    base_price: 35000,
    sort_order: 1,
    is_active: true,
    created_at: now,
  },
  {
    id: stableUuid('ct-choreo'),
    slug: 'choreography',
    name_mn: 'Choreography',
    name_en: 'Choreography',
    desc_mn: 'Дуу бүрд бүтэн бүжиг сурна. Үндсэн хөдөлгөөнүүдийг мэддэг хүнд тохиромжтой.',
    desc_en: 'Learn a full routine to a track. Suited to those who know the basics.',
    level: 'intermediate',
    duration_min: 75,
    cover_url: '/media/studio-5.svg',
    base_price: 40000,
    sort_order: 2,
    is_active: true,
    created_at: now,
  },
  {
    id: stableUuid('ct-advanced'),
    slug: 'advanced-flow',
    name_mn: 'Ахисан түвшин',
    name_en: 'Advanced Flow',
    desc_mn: 'Хурд, техник, тайз дээрх илэрхийлэл. Дор хаяж 6 сар бүжиглэсэн байх шаардлагатай.',
    desc_en: 'Speed, technique and stage presence. Requires at least six months of practice.',
    level: 'advanced',
    duration_min: 90,
    cover_url: '/media/studio-6.svg',
    base_price: 45000,
    sort_order: 3,
    is_active: true,
    created_at: now,
  },
  {
    id: stableUuid('ct-stretch'),
    slug: 'stretch',
    name_mn: 'Stretch & Conditioning',
    name_en: 'Stretch & Conditioning',
    desc_mn: 'Уян хатан байдал, тэсвэр. Бүжгийн хичээлийг нөхөх дасгалууд.',
    desc_en: 'Flexibility and stamina. A complement to the dance classes.',
    level: 'beginner',
    duration_min: 60,
    cover_url: '/media/studio-1.svg',
    base_price: 30000,
    sort_order: 4,
    is_active: true,
    created_at: now,
  },
]

/* ── Долоо хоногийн давтагдах хуваарь ──────────────────────────────────── */

type Slot = {
  dow: number // 1 = Даваа … 7 = Ням (УБ-ын цагаар)
  hour: number
  classSlug: string
  instructorSlug: string
  locationIndex: 0 | 1
  capacity: number
  price: number
}

const WEEKLY_SLOTS: Slot[] = [
  { dow: 2, hour: 19, classSlug: 'twerk-basics', instructorSlug: 'saraa', locationIndex: 0, capacity: 16, price: 35000 },
  { dow: 2, hour: 20, classSlug: 'choreography', instructorSlug: 'nomin', locationIndex: 0, capacity: 14, price: 40000 },
  { dow: 4, hour: 18, classSlug: 'stretch', instructorSlug: 'tsetseg', locationIndex: 1, capacity: 8, price: 30000 },
  { dow: 4, hour: 19, classSlug: 'twerk-basics', instructorSlug: 'saraa', locationIndex: 0, capacity: 16, price: 35000 },
  { dow: 4, hour: 20, classSlug: 'advanced-flow', instructorSlug: 'nomin', locationIndex: 0, capacity: 12, price: 45000 },
  { dow: 6, hour: 12, classSlug: 'choreography', instructorSlug: 'nomin', locationIndex: 0, capacity: 14, price: 40000 },
  { dow: 6, hour: 14, classSlug: 'twerk-basics', instructorSlug: 'saraa', locationIndex: 0, capacity: 16, price: 35000 },
]

export type DemoSession = {
  id: string
  class_type_id: string
  instructor_id: string | null
  location_id: string | null
  starts_at: string
  ends_at: string
  capacity: number
  booked_count: number
  price: number
  status: 'scheduled' | 'cancelled' | 'completed'
  note: string | null
  series_id: string | null
  created_at: string
}

/** Заасан хугацаанд багтах бүх хичээлийг үүсгэнэ (УБ-ын цагаар). */
export function demoSessionsBetween(from: Date, to: Date): DemoSession[] {
  const sessions: DemoSession[] = []

  for (let cursor = new Date(from); cursor < to; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const day = formatInTimeZone(cursor, TIMEZONE, 'yyyy-MM-dd')
    const dow = Number(formatInTimeZone(cursor, TIMEZONE, 'i'))

    for (const slot of WEEKLY_SLOTS) {
      if (slot.dow !== dow) continue

      const startsAt = new Date(`${day}T${String(slot.hour).padStart(2, '0')}:00:00+08:00`)
      if (startsAt < from || startsAt >= to) continue

      const classType = demoClassTypes.find((item) => item.slug === slot.classSlug)!
      const instructor = demoInstructors.find((item) => item.slug === slot.instructorSlug)!
      const key = `${day}-${slot.hour}-${slot.classSlug}`

      sessions.push({
        id: stableUuid(key),
        class_type_id: classType.id,
        instructor_id: instructor.id,
        location_id: demoLocations[slot.locationIndex]!.id,
        starts_at: startsAt.toISOString(),
        ends_at: new Date(startsAt.getTime() + classType.duration_min * 60_000).toISOString(),
        capacity: slot.capacity,
        // Дүүргэлт янз бүр байхаар — «дүүрсэн», «3 суудал үлдсэн» төлвүүд харагдана
        booked_count: Math.min(slot.capacity, pseudoRandom(key, slot.capacity)),
        price: slot.price,
        status: 'scheduled',
        note: null,
        series_id: null,
        created_at: now,
      })
    }
  }

  return sessions.sort((a, b) => a.starts_at.localeCompare(b.starts_at))
}

/* ── Дэлгүүр ───────────────────────────────────────────────────────────── */

export const demoProducts: Product[] = [
  {
    id: stableUuid('pr-crop'),
    slug: 'crop-top',
    name_mn: 'Crop top',
    name_en: 'Crop top',
    desc_mn: 'Бүжгийн дасгалд зориулсан амьсгалдаг даавуутай crop top.',
    desc_en: 'Breathable crop top made for dance practice.',
    category: 'хувцас',
    base_price: 65000,
    sort_order: 1,
    is_active: true,
    created_at: now,
  },
  {
    id: stableUuid('pr-jog'),
    slug: 'joggers',
    name_mn: 'Joggers өмд',
    name_en: 'Joggers',
    desc_mn: 'Уян хатан, хөдөлгөөнд саад болохгүй сунадаг өмд.',
    desc_en: 'Stretchy joggers that never get in the way of a move.',
    category: 'хувцас',
    base_price: 89000,
    sort_order: 2,
    is_active: true,
    created_at: now,
  },
  {
    id: stableUuid('pr-knee'),
    slug: 'knee-pads',
    name_mn: 'Өвдөгний хамгаалалт',
    name_en: 'Knee pads',
    desc_mn: 'Шалан дээрх хөдөлгөөнд заавал хэрэгтэй зузаан дэвсгэртэй.',
    desc_en: 'Thick padding — essential for floor work.',
    category: 'хэрэгсэл',
    base_price: 45000,
    sort_order: 3,
    is_active: true,
    created_at: now,
  },
  {
    id: stableUuid('pr-tote'),
    slug: 'tote-bag',
    name_mn: 'Tote цүнх',
    name_en: 'Tote bag',
    desc_mn: 'Twerk Mongolia лого бүхий даавуун цүнх.',
    desc_en: 'Canvas tote with the Twerk Mongolia logo.',
    category: 'merch',
    base_price: 25000,
    sort_order: 4,
    is_active: true,
    created_at: now,
  },
]

/**
 * Бодит гэрэл зураг байвал түүнийг, үгүй бол абстракт орлуулагчийг ашиглана.
 *
 * `public/media/products/` дотор барааны slug-аар нэрлэсэн файл тавихад
 * (жишээ нь `crop-top.jpg`) шууд харагдана. Ингэснээр Supabase тохируулахаас
 * өмнө ч жинхэнэ зурагтай нь харж болно.
 *
 * Нэг бараанд олон зураг өгөх бол `crop-top-2.jpg`, `crop-top-3.jpg` гэх мэт.
 */
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif']
const PRODUCT_IMAGE_DIR = join(process.cwd(), 'public', 'media', 'products')

function findProductPhotos(slug: string): string[] {
  const found: string[] = []

  for (const suffix of ['', '-2', '-3', '-4']) {
    for (const extension of IMAGE_EXTENSIONS) {
      const name = `${slug}${suffix}.${extension}`
      const path = join(PRODUCT_IMAGE_DIR, name)
      if (!existsSync(path)) continue

      /*
       * Файлын өөрчлөгдсөн хугацааг URL-д залгана.
       *
       * Next-ийн зургийн optimizer нь src-ээр кэшилдэг. Ижил нэртэй файлыг
       * шинээр солиход URL өөрчлөгдөхгүй тул хуучин зураг гацаж үлддэг.
       * mtime нэмснээр шинэ файл = шинэ URL болж, сервер дахин асаах ч,
       * кэш цэвэрлэх ч шаардлагагүй.
       */
      found.push(`/media/products/${name}?v=${Math.round(statSync(path).mtimeMs)}`)
      break
    }
  }

  return found
}

const productImageFallback: Record<string, string> = {
  'crop-top': '/media/studio-2.svg',
  joggers: '/media/studio-3.svg',
  'knee-pads': '/media/studio-4.svg',
  'tote-bag': '/media/studio-5.svg',
}

/**
 * Хүсэлт БҮРД дискийг шалгана — модуль ачаалахад нэг удаа биш.
 *
 * Ингэснээр хавтсанд шинэ зураг хийхэд сервер дахин асаахгүйгээр шууд
 * харагдана. Демо горимд л ажилладаг, хэдхэн `existsSync` тул хямд.
 */
export function getDemoProductImages(): ProductImage[] {
  return demoProducts.flatMap((product) => {
    const photos = findProductPhotos(product.slug)
    const urls =
      photos.length > 0 ? photos : [productImageFallback[product.slug] ?? '/media/studio-1.svg']

    return urls.map((url, index) => ({
      id: stableUuid(`img-${product.slug}-${index}`),
      product_id: product.id,
      url,
      alt: product.name_mn,
      sort_order: index + 1,
    }))
  })
}

const variantSpecs: [string, string, string | null, string | null, number, number][] = [
  ['pr-crop', 'CROP-S-BLK', 'S', 'Хар', 65000, 8],
  ['pr-crop', 'CROP-M-BLK', 'M', 'Хар', 65000, 12],
  ['pr-crop', 'CROP-L-BLK', 'L', 'Хар', 65000, 5],
  ['pr-crop', 'CROP-M-PNK', 'M', 'Ягаан', 68000, 3],
  ['pr-jog', 'JOG-S-BLK', 'S', 'Хар', 89000, 6],
  ['pr-jog', 'JOG-M-BLK', 'M', 'Хар', 89000, 9],
  ['pr-jog', 'JOG-L-BLK', 'L', 'Хар', 89000, 0],
  ['pr-knee', 'KNEE-ONE', 'Стандарт', 'Хар', 45000, 20],
  ['pr-tote', 'TOTE-ONE', 'Стандарт', 'Цагаан', 25000, 30],
]

export const demoVariants: ProductVariant[] = variantSpecs.map(
  ([productKey, sku, size, color, price, stock]) => ({
    id: stableUuid(`var-${sku}`),
    product_id: stableUuid(productKey),
    sku,
    size,
    color,
    price,
    stock_qty: stock,
    is_active: true,
  }),
)

/* ── Галерей, FAQ, контент ─────────────────────────────────────────────── */

export const demoGallery: GalleryItem[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: stableUuid(`gal-${n}`),
  url: `/media/studio-${n}.svg`,
  alt_mn: 'Заалан дээрх хичээл',
  alt_en: 'Class in the studio',
  sort_order: n,
  created_at: now,
}))

export const demoFaq: FaqItem[] = [
  {
    id: stableUuid('faq-1'),
    question_mn: 'Огт бүжиглэж байгаагүй бол болох уу?',
    question_en: 'Can I come with no dance experience?',
    answer_mn: '«Twerk үндэс» хичээл яг танд зориулагдсан. Сурагчдын дийлэнх нь тэндээс эхэлдэг.',
    answer_en:
      'The "Twerk Basics" class is made for exactly that. Most of our students start there.',
    sort_order: 1,
    is_active: true,
  },
  {
    id: stableUuid('faq-2'),
    question_mn: 'Юу өмсөж очих вэ?',
    question_en: 'What should I wear?',
    answer_mn: 'Хөдөлгөөнд саад болохгүй сунадаг өмд, тав тухтай пүүз. Өвдөгний хамгаалалт байвал сайн.',
    answer_en: 'Stretchy trousers you can move in and comfortable trainers. Knee pads help.',
    sort_order: 2,
    is_active: true,
  },
  {
    id: stableUuid('faq-3'),
    question_mn: 'Хичээлээ цуцалж болох уу?',
    question_en: 'Can I cancel a booking?',
    answer_mn: 'Хичээл эхлэхээс 6 цагийн өмнө өөрөө цуцалж болно. Түүнээс хойш бол бидэн рүү залгана уу.',
    answer_en: 'You can cancel yourself up to 6 hours before the class. After that, please call us.',
    sort_order: 3,
    is_active: true,
  },
  {
    id: stableUuid('faq-4'),
    question_mn: 'Төлбөрөө яаж хийх вэ?',
    question_en: 'How do I pay?',
    answer_mn: 'Одоогоор банкны шилжүүлгээр. Захиалга үүсгэсний дараа дансны мэдээлэл харагдана.',
    answer_en: 'By bank transfer for now. Account details appear once you place an order.',
    sort_order: 4,
    is_active: true,
  },
]

const contentRows: Record<string, [Record<string, string | number>, Record<string, string | number>]> = {
  hero: [
    {
      title: 'Twerk Mongolia',
      subtitle: 'Бие сэтгэлээ чөлөөлөх бүжгийн студи',
      body: 'Анхан шатнаас ахисан түвшин хүртэл — долоо хоног бүр Улаанбаатарт.',
      cta: 'Хуваарь харах',
    },
    {
      title: 'Twerk Mongolia',
      subtitle: 'A dance studio for setting your body free',
      body: 'From absolute beginner to advanced — every week in Ulaanbaatar.',
      cta: 'See the schedule',
    },
  ],
  about: [
    {
      title: 'Бидний тухай',
      body: 'Twerk Mongolia нь 2019 онд Улаанбаатарт үүсгэн байгуулагдсан. Бид бүжгийг гоо сайхны шалгуур биш, өөрийгөө илэрхийлэх хэрэгсэл гэж үздэг. Манай заалан бол шүүмжлэлгүй, дэмжлэгтэй орон зай.',
      stat_students: '1200',
      stat_years: '7',
      stat_classes: '18',
    },
    {
      title: 'About us',
      body: 'Twerk Mongolia was founded in Ulaanbaatar in 2019. We treat dance as a tool for self-expression, not a beauty standard. Our studio is a judgement-free, supportive space.',
      stat_students: '1200',
      stat_years: '7',
      stat_classes: '18',
    },
  ],
  // Утас, сошиал нь БОДИТ. И-мэйл, хаяг нь хоосон — админ дээрээс бөглөнө.
  contact: [
    {
      phone: '+976 9919 0857',
      email: '',
      address: '',
      instagram: 'twerkmongolia',
      facebook: 'https://www.facebook.com/share/1EVmEQMU4S/',
    },
    {
      phone: '+976 9919 0857',
      email: '',
      address: '',
      instagram: 'twerkmongolia',
      facebook: 'https://www.facebook.com/share/1EVmEQMU4S/',
    },
  ],
  shop: [
    { shipping_fee: 5000, bank: 'Хаан банк · 5000 1234 5678 · Твөрк Монголиа ХХК' },
    { shipping_fee: 5000, bank: 'Khan Bank · 5000 1234 5678 · Twerk Mongolia LLC' },
  ],
  booking: [{ cancel_cutoff_hours: 6 }, { cancel_cutoff_hours: 6 }],
  videos: [
    { id_1: 'u261YyMWm0g', title_1: '', id_2: 'ju-HSfPFFxE', title_2: '', id_3: 'U7GUiQBVIs0', title_3: '' },
    { id_1: 'u261YyMWm0g', title_1: '', id_2: 'ju-HSfPFFxE', title_2: '', id_3: 'U7GUiQBVIs0', title_3: '' },
  ],
}

export function demoSiteContent(keys: string[]): Map<string, SiteContent> {
  const map = new Map<string, SiteContent>()
  for (const key of keys) {
    const row = contentRows[key]
    if (!row) continue
    map.set(key, { key, value_mn: row[0], value_en: row[1], updated_at: now })
  }
  return map
}
