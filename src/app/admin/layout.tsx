import { cookies } from 'next/headers'
import { Inter } from 'next/font/google'
import { requireStaff } from '@/lib/auth/dal'
import { AdminShell, type NavGroup } from '@/components/admin/AdminShell'

/**
 * Удирдлагын үсэг.
 *
 * Нийтийн сайт `Unbounded` + `Manrope` -оор явдаг. Тэр хослол шөнийн студийн
 * дүр төрхөд зөв ч, өдөржин хүснэгт уншдаг дэлгэцэд буруу: `Unbounded` бол
 * зурагт хуудасны үсэг — 13px дээр өргөн, уншихад залхаамжтай. Inter нь
 * интерфейсэд зориулж зурагдсан, кирилл бүрэн, тоонууд нь ижил өргөнтэй.
 *
 * `next/font` -ыг ЭНД дуудсан нь санаатай — үсгийн файл зөвхөн `/admin`
 * замуудад ачаалагдана, нийтийн зочин үүнийг татахгүй.
 */
const ui = Inter({
  variable: '--font-ui',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
})

/**
 * Цэсийг бүлэглэв — холбоосууд нэг урт багана болвол нүд алдана.
 * Бүлэг бүр нэг ажлын төрлийг хариуцна: хичээл → худалдаа.
 */
/**
 * `tab: true` = утасны доод тааз дээр гарна. Дөрөв нь зориуд — таван зайны
 * тавь дахь нь «Цэс». Өдөр тутам хамгийн олон нээгддэг дөрвийг сонгов;
 * үлдсэн нь (багш, хэрэглэгч) цэсний самбар дотор.
 */
const groups: NavGroup[] = [
  {
    items: [
      { href: '/admin', label: 'Хяналтын самбар', short: 'Самбар', icon: 'dashboard', tab: true },
    ],
  },
  {
    label: 'Хичээл',
    items: [
      // Хичээлийн төрлүүд ХУВААРИЙН дотор — тэдгээр нь тусдаа ажлын урсгал
      // биш, хуваарь үүсгэх хэрэгсэл (§ admin/schedule/page.tsx).
      { href: '/admin/schedule', label: 'Хуваарь', icon: 'calendar', tab: true },
      { href: '/admin/instructors', label: 'Багш нар', icon: 'users' },
    ],
  },
  {
    label: 'Худалдаа',
    items: [
      { href: '/admin/products', label: 'Бараа', icon: 'tag', tab: true },
      { href: '/admin/orders', label: 'Захиалга', icon: 'receipt', tab: true },
      { href: '/admin/customers', label: 'Хэрэглэгч', icon: 'person' },
    ],
  },
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
      fontClass={ui.variable}
    >
      {children}
    </AdminShell>
  )
}
