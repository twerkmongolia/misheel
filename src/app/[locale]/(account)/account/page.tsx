import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { CSSProperties, ReactNode } from 'react'
import { Alert, Arrow, Badge, ButtonLink } from '@/components/ui'
import { getDictionary, isLocale } from '@/lib/i18n'
import { formatDate } from '@/lib/format'
import { getProfile, requireUser } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { UserRole } from '@/lib/supabase/database.types'
import { Legend } from './Legend'
import { ProfileForm } from './ProfileForm'

/* ───────────────────────────────────────────────────────────────────────────
   ПРОФАЙЛ

   Өмнө нь энэ хуудас нь ХООСОН байв: асар том «PROFILE» гарчиг, хажууд нь
   ганц и-мэйл, доор нь хоёр талбар — дэлгэцийн 70% нь хоосон. Гарчиг нь
   табны нэрийг ҮГЧЛЭН давтаж байсан тул мэдээлэл огт нэмээгүй.

   Одоо гурван давхарга:
     1 · ХЭН БЭ    — монограм, нэр, гишүүнчлэл эхэлсэн огноо
     2 · ХААНА ЮУ  — гурван тоо (анги, хичээл, захиалга) бөгөөд тус бүр
                     өөрийн таб руу хөтөлнө. Хоосон хуудсыг ҮГЭЭР биш
                     ХЭРЭГТЭЙ агуулгаар дүүргэнэ.
     3 · ЮУ ЗАСАХ  — форм зүүн талд, нэвтрэлтийн мэдээлэл баруун талд.

   Хөдөлгөөн нь `data-rv` БИШ `.enter`: энэ хуудас нэвтрэнгүүт бүтнээрээ
   харагддаг тул гүйлтийн ажиглагчид уях нь утгагүй (§ globals.css § 6).
   ─────────────────────────────────────────────────────────────────────── */

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const user = await requireUser(locale, `/${locale}/account`)
  const [profile, counts] = await Promise.all([getProfile(), getCounts(user.id)])

  const name = profile?.full_name?.trim() || null
  const role = profile?.role ?? 'customer'

  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      {/* ── 1 · Хэн бэ ─────────────────────────────────────────────────── */}
      <header className="card enter flex flex-wrap items-center gap-x-7 gap-y-5 p-6 sm:p-9">
        {/* Монограм нь хуудасны ганц ЭРГҮҮЛСЭН гадарга — монохром системд
            анхаарлыг татах цорын ганц найдвартай арга нь дүүргэлт эргүүлэх
            (§ globals.css `.btn-solid`). Зураг оруулах шаардлагагүйгээр
            хуудас өөрийн гэсэн төвтэй болно. */}
        <span
          aria-hidden
          className="font-display grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-foreground text-[1.5rem] leading-none tracking-[0.04em] text-background sm:h-20 sm:w-20 sm:text-[1.75rem]"
        >
          {initials(name, user.email)}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h1 className="t-h2 min-w-0 break-words">{name ?? t.auth.noName}</h1>
          {profile && (
            <p className="t-meta text-muted">
              {t.auth.memberSince} · {formatDate(profile.created_at, locale)}
            </p>
          )}
        </div>

        {/* Эрхийн шошго нь ЗӨВХӨН энгийн хэрэглэгчээс өөр үед. «Хэрэглэгч»
            гэсэн шошго нь хэнд ч юу ч хэлэхгүй — зөвхөн чимээ нэмнэ. */}
        {roleLabel(t, role) && (
          <span className="shrink-0">
            <Badge tone="neutral">{roleLabel(t, role)}</Badge>
          </span>
        )}
      </header>

      {/* ── 2 · Хаана юу ───────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Tile
          href={`/${locale}/account/courses`}
          label={t.courses.mine}
          value={counts.courses}
          delay="60ms"
        />
        <Tile
          href={`/${locale}/account/bookings`}
          label={t.booking.myBookings}
          value={counts.bookings}
          delay="120ms"
        />
        <Tile
          href={`/${locale}/account/orders`}
          label={t.shop.myOrders}
          value={counts.orders}
          delay="180ms"
        />
      </div>

      {/* ── 3 · Юу засах ───────────────────────────────────────────────── */}
      <div className="g12 items-start gap-y-10">
        <section
          className="enter col-span-12 flex flex-col gap-6 lg:col-span-7"
          style={{ '--d': '240ms' } as CSSProperties}
        >
          <Legend title={t.auth.details} lead={t.auth.detailsLead} />
          {profile ? (
            <ProfileForm t={t} profile={profile} />
          ) : (
            <Alert tone="warn">{t.auth.profileMissing}</Alert>
          )}
        </section>

        <aside
          className="enter col-span-12 flex flex-col gap-6 lg:col-span-4 lg:col-start-9"
          style={{ '--d': '300ms' } as CSSProperties}
        >
          <Legend title={t.auth.signIn} />
          <div className="card flex flex-col gap-5 p-6">
            <div className="flex flex-col gap-1.5">
              <span className="t-label text-muted">{t.auth.email}</span>
              {/* Талбар БИШ. Засаж болохгүй утгыг хайрцагт хийвэл «яагаад
                  бичиж болохгүй байна вэ» гэсэн асуулт үүснэ — хэлбэр нь
                  амлалт өгдөг. Тиймээс энэ нь зүгээр л текст. */}
              <span className="t-small break-all text-foreground">{user.email ?? '—'}</span>
            </div>
            <p className="t-meta text-faint">{t.auth.emailLocked}</p>
            <ButtonLink
              href={`/${locale}/forgot-password`}
              variant="secondary"
              className="btn-sm w-fit"
            >
              {t.auth.changePassword}
            </ButtonLink>
          </div>
        </aside>
      </div>
    </div>
  )
}

/**
 * Тоон хавтан.
 *
 * Тоо нь ГАРЧИГ, шошго нь тайлбар — эсрэгээр биш. «3» гэдэг нь «Миний
 * анги» гэсэн үгнээс хамаагүй хурдан уншигдана, тиймээс том нь тоо байх
 * ёстой. Бүхэл хавтан нь холбоос: тоо харсан хүний дараагийн бодол нь
 * «аль нь вэ» — тэр замыг нэг даралтаар нээнэ.
 */
function Tile({
  href,
  label,
  value,
  delay,
}: {
  href: string
  label: ReactNode
  value: number
  delay: string
}) {
  return (
    <Link
      href={href}
      className="card card-link enter group flex items-end justify-between gap-4 p-6"
      style={{ '--d': delay } as CSSProperties}
    >
      <span className="flex min-w-0 flex-col gap-2.5">
        <span className="t-label text-muted">{label}</span>
        <span className="t-num text-[2.25rem]">{value}</span>
      </span>
      <Arrow className="mb-1.5 text-muted transition-transform duration-300 ease-out-expo group-hover:translate-x-1" />
    </Link>
  )
}

/**
 * Гурван табын тоо.
 *
 * `head: true` — мөрүүдийг татахгүй, зөвхөн тоолно. Профайлын хуудсанд
 * бүртгэлийн бүх мөрийг татах шалтгаан алга.
 *
 * `bookings`, `orders` дээр `user_id` шүүлт БАЙХГҮЙ нь санаатай: тэдгээрийг
 * RLS өөрөө эзэмшигчээр нь хязгаарладаг (§ табуудын хуудсууд ч мөн адил).
 * `course_enrollments` нь `getMyEnrollments` -тэй ижил дүрмээр ил шүүгдэнэ.
 */
async function getCounts(userId: string) {
  if (!isSupabaseConfigured()) return { courses: 0, bookings: 0, orders: 0 }

  const supabase = await createClient()
  const head = { count: 'exact' as const, head: true }

  const [courses, bookings, orders] = await Promise.all([
    supabase.from('course_enrollments').select('id', head).eq('user_id', userId),
    supabase.from('bookings').select('id', head),
    supabase.from('orders').select('id', head),
  ])

  return {
    courses: courses.count ?? 0,
    bookings: bookings.count ?? 0,
    orders: orders.count ?? 0,
  }
}

/** Нэрний эхний хоёр үсэг, нэр байхгүй бол и-мэйлийн эхний үсэг. */
function initials(name: string | null, email: string | null): string {
  if (name) {
    const letters = name
      .split(/\s+/)
      .slice(0, 2)
      // Кирилл, латин, эможи — код нэгжээр биш ТЭМДЭГТЭЭР авна
      .map((word) => [...word][0] ?? '')
      .join('')
    if (letters) return letters.toUpperCase()
  }
  return ([...(email ?? '?')][0] ?? '?').toUpperCase()
}

function roleLabel(t: ReturnType<typeof getDictionary>, role: UserRole): string | null {
  if (role === 'customer') return null
  return t.auth.role[role]
}
