import Link from 'next/link'
import { requireStaff } from '@/lib/auth/dal'

const nav = [
  { href: '/admin', label: 'Хяналтын самбар' },
  { href: '/admin/schedule', label: 'Хуваарь' },
  { href: '/admin/bookings', label: 'Ирц' },
  { href: '/admin/classes', label: 'Хичээлүүд' },
  { href: '/admin/instructors', label: 'Багш нар' },
  { href: '/admin/products', label: 'Бараа' },
  { href: '/admin/orders', label: 'Захиалга' },
  { href: '/admin/customers', label: 'Хэрэглэгч' },
  { href: '/admin/content', label: 'Контент' },
  { href: '/admin/messages', label: 'Мессеж' },
  { href: '/admin/audit', label: 'Түүх' },
]

/**
 * Удирдлагын хэсэг хэзээ ч урьдчилан бүтээгдэхгүй — хэрэглэгч бүрд өөр.
 * (cacheComponents унтраалттай тул route segment config ажиллана.)
 */
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Урьдчилсан шалгалт proxy дээр байгаа ч жинхэнэ шалгалт энд.
  const profile = await requireStaff()

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/admin" className="font-display text-sm font-bold">
            Twerk Mongolia · удирдлага
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted">
              {profile.full_name ?? '—'} · {profile.role}
            </span>
            <Link href="/mn" className="text-foreground underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-foreground">
              Сайт руу
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 lg:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto text-sm lg:w-52 lg:flex-col lg:overflow-visible">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 whitespace-nowrap text-foreground-soft hover:bg-surface-2 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
