import { cookies } from 'next/headers'
import { requireStaff } from '@/lib/auth/dal'
import { AdminShell, type NavGroup } from '@/components/admin/AdminShell'

/**
 * Цэсийг бүлэглэв — 11 холбоос нэг урт багана болвол нүд алдана.
 * Бүлэг бүр нэг ажлын төрлийг хариуцна: өдөр тутам → хичээл → худалдаа → сайт.
 */
const groups: NavGroup[] = [
  [{ href: '/admin', label: 'Хяналтын самбар', icon: 'dashboard' }],
  [
    { href: '/admin/schedule', label: 'Хуваарь', icon: 'calendar' },
    { href: '/admin/bookings', label: 'Ирц', icon: 'check' },
    { href: '/admin/classes', label: 'Хичээлүүд', icon: 'layers' },
    { href: '/admin/instructors', label: 'Багш нар', icon: 'users' },
  ],
  [
    { href: '/admin/products', label: 'Бараа', icon: 'tag' },
    { href: '/admin/orders', label: 'Захиалга', icon: 'receipt' },
    { href: '/admin/customers', label: 'Хэрэглэгч', icon: 'person' },
  ],
  [
    { href: '/admin/content', label: 'Контент', icon: 'file' },
    { href: '/admin/messages', label: 'Мессеж', icon: 'mail' },
    { href: '/admin/audit', label: 'Түүх', icon: 'history' },
  ],
]

/**
 * Удирдлагын хэсэг хэзээ ч урьдчилан бүтээгдэхгүй — хэрэглэгч бүрд өөр.
 * (cacheComponents унтраалттай тул route segment config ажиллана.)
 */
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Урьдчилсан шалгалт proxy дээр байгаа ч жинхэнэ шалгалт энд.
  const [profile, store] = await Promise.all([requireStaff(), cookies()])

  // Хоёр тохиргоог серверээс уншина — эхний зурагтаа зөв өнгө, зөв өргөнтэй
  // гарна. Горимын анхдагч нь ГЭРЭЛТЭЙ (§ globals.css `.admin-shell`).
  const collapsed = store.get('tm_admin_nav')?.value === '1'
  const scheme = store.get('tm_admin_scheme')?.value === 'dark' ? 'dark' : 'light'

  return (
    <AdminShell
      groups={groups}
      profile={{ name: profile.full_name ?? 'Админ', role: profile.role }}
      defaultCollapsed={collapsed}
      defaultScheme={scheme}
    >
      {children}
    </AdminShell>
  )
}
