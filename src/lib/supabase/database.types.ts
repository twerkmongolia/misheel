/**
 * Supabase-ийн схемийн TypeScript тодорхойлолт.
 *
 * ⚠️ Бүгд `type` (interface БИШ). Supabase-ийн `GenericTable` нь
 * `Record<string, unknown>` шаарддаг бөгөөд TypeScript зөвхөн type alias-д
 * далд индекс гарын үсэг өгдөг. `interface` болговол схем таарахгүй болж,
 * бүх query `never` төрөлтэй болно.
 *
 * `supabase gen types typescript` -ээр автоматаар үүсгэж болно. Одоогоор
 * гараар бичсэн — migration өөрчлөгдвөл энэ файлыг хамт шинэчилнэ.
 */

export type UserRole = 'customer' | 'instructor' | 'staff' | 'admin'
export type ClassLevel = 'beginner' | 'intermediate' | 'advanced'
export type SessionStatus = 'scheduled' | 'cancelled' | 'completed'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'attended' | 'no_show'
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type PaymentTarget = 'order' | 'booking'
export type CourseMode = 'studio' | 'online'
export type EnrollmentStatus = 'pending_payment' | 'active' | 'cancelled' | 'completed'

export type Profile = {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: UserRole
  locale: string
  created_at: string
}

export type SiteContent = {
  key: string
  value_mn: Record<string, string | number>
  value_en: Record<string, string | number>
  updated_at: string
}

export type Instructor = {
  id: string
  profile_id: string | null
  slug: string
  name: string
  bio_mn: string
  bio_en: string
  photo_url: string | null
  instagram: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export type Location = {
  id: string
  name: string
  address_mn: string
  address_en: string
  map_url: string | null
  default_capacity: number
  is_active: boolean
}

export type GalleryItem = {
  id: string
  url: string
  alt_mn: string
  alt_en: string
  sort_order: number
  created_at: string
}

export type FaqItem = {
  id: string
  question_mn: string
  question_en: string
  answer_mn: string
  answer_en: string
  sort_order: number
  is_active: boolean
}

export type ClassType = {
  id: string
  slug: string
  name_mn: string
  name_en: string
  desc_mn: string
  desc_en: string
  level: ClassLevel
  duration_min: number
  cover_url: string | null
  base_price: number
  sort_order: number
  is_active: boolean
  created_at: string
}

export type ClassSession = {
  id: string
  class_type_id: string
  instructor_id: string | null
  location_id: string | null
  starts_at: string
  ends_at: string
  capacity: number
  booked_count: number
  price: number
  status: SessionStatus
  note: string | null
  series_id: string | null
  created_at: string
}

export type Booking = {
  id: string
  session_id: string
  user_id: string
  status: BookingStatus
  price_paid: number
  note: string | null
  cancelled_at: string | null
  created_at: string
}

export type WaitlistEntry = {
  id: string
  session_id: string
  user_id: string
  notified_at: string | null
  created_at: string
}

export type Product = {
  id: string
  slug: string
  name_mn: string
  name_en: string
  desc_mn: string
  desc_en: string
  category: string
  base_price: number
  sort_order: number
  is_active: boolean
  created_at: string
}

export type ProductVariant = {
  id: string
  product_id: string
  sku: string
  size: string | null
  color: string | null
  price: number
  stock_qty: number
  is_active: boolean
}

export type ProductImage = {
  id: string
  product_id: string
  url: string
  alt: string
  sort_order: number
}

export type Order = {
  id: string
  order_no: string
  user_id: string
  status: OrderStatus
  subtotal: number
  shipping_fee: number
  total: number
  ship_name: string
  ship_phone: string
  ship_district: string
  ship_khoroo: string
  ship_address: string
  note: string | null
  created_at: string
  updated_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  variant_id: string | null
  /** Курсын мөр. `variant_id` -тэй хоёулаа дүүрэн байхгүй — аль нэг нь. */
  course_id: string | null
  name_snapshot: string
  variant_snapshot: string
  unit_price: number
  qty: number
}

export type Course = {
  id: string
  slug: string
  mode: CourseMode
  name_mn: string
  name_en: string
  summary_mn: string
  summary_en: string
  desc_mn: string
  desc_en: string
  level: ClassLevel
  instructor_id: string | null
  cover_url: string | null
  price: number
  lesson_count: number
  location_id: string | null
  starts_on: string | null
  ends_on: string | null
  schedule_mn: string
  schedule_en: string
  /** `null` = хязгааргүй. Онлайн анги суудал тоолохгүй. */
  capacity: number | null
  enrolled_count: number
  enroll_opens_at: string | null
  enroll_closes_at: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

/**
 * Онлайн ангийн НУУЦ хэсэг — тусдаа хүснэгт.
 *
 * RLS нь мөрийг хамгаалдаг, багана биш. Telegram холбоос `courses` дээр
 * байвал төлөөгүй хүн ч API-аар шууд уншина (§ migration).
 */
export type CourseAccess = {
  course_id: string
  telegram_url: string
  note_mn: string
  note_en: string
  updated_at: string
}

export type CourseEnrollment = {
  id: string
  course_id: string
  user_id: string
  order_id: string | null
  status: EnrollmentStatus
  price_paid: number
  note: string | null
  created_at: string
  activated_at: string | null
  cancelled_at: string | null
}

export type Payment = {
  id: string
  provider: string
  provider_ref: string | null
  amount: number
  currency: string
  status: PaymentStatus
  target_type: PaymentTarget
  target_id: string
  raw: unknown
  paid_at: string | null
  created_at: string
}

export type ContactMessage = {
  id: string
  name: string
  phone: string
  email: string
  message: string
  is_read: boolean
  created_at: string
}

export type AuditEntry = {
  id: string
  actor_id: string | null
  action: string
  entity: string
  entity_id: string | null
  diff: unknown
  created_at: string
}

type Table<Row> = {
  Row: Row
  Insert: Partial<Row>
  Update: Partial<Row>
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>
      site_content: Table<SiteContent>
      instructors: Table<Instructor>
      locations: Table<Location>
      gallery_items: Table<GalleryItem>
      faq_items: Table<FaqItem>
      class_types: Table<ClassType>
      class_sessions: Table<ClassSession>
      bookings: Table<Booking>
      waitlist: Table<WaitlistEntry>
      products: Table<Product>
      product_variants: Table<ProductVariant>
      product_images: Table<ProductImage>
      orders: Table<Order>
      order_items: Table<OrderItem>
      courses: Table<Course>
      course_access: Table<CourseAccess>
      course_enrollments: Table<CourseEnrollment>
      payments: Table<Payment>
      contact_messages: Table<ContactMessage>
      audit_log: Table<AuditEntry>
    }
    Views: Record<never, never>
    Functions: {
      is_staff: { Args: Record<never, never>; Returns: boolean }
      is_admin: { Args: Record<never, never>; Returns: boolean }
      book_session: { Args: { p_session_id: string }; Returns: string }
      cancel_booking: { Args: { p_booking_id: string }; Returns: void }
      place_order: {
        Args: {
          p_items: { variant_id: string; qty: number }[]
          p_name: string
          p_phone: string
          p_district: string
          p_khoroo: string
          p_address: string
          p_note?: string | null
        }
        Returns: string
      }
      cancel_order: { Args: { p_order_id: string }; Returns: void }
      enroll_course: {
        Args: { p_course_id: string; p_name: string; p_phone: string; p_note?: string | null }
        Returns: string
      }
      cancel_enrollment: { Args: { p_enrollment_id: string }; Returns: void }
      set_enrollment_status: {
        Args: { p_enrollment_id: string; p_status: EnrollmentStatus }
        Returns: void
      }
      set_order_status: { Args: { p_order_id: string; p_status: OrderStatus }; Returns: void }
      create_session_series: {
        Args: {
          p_class_type_id: string
          p_instructor_id: string | null
          p_location_id: string | null
          p_first_start: string
          p_duration_min: number
          p_capacity: number
          p_price: number
          p_weeks: number
        }
        Returns: string
      }
    }
    Enums: {
      user_role: UserRole
      class_level: ClassLevel
      session_status: SessionStatus
      booking_status: BookingStatus
      order_status: OrderStatus
      payment_status: PaymentStatus
      payment_target: PaymentTarget
      course_mode: CourseMode
      enrollment_status: EnrollmentStatus
    }
    CompositeTypes: Record<never, never>
  }
}
