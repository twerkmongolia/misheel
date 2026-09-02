import { cookies } from 'next/headers'
import { requireStaff } from '@/lib/auth/dal'
import { AdminShell, type NavGroup } from '@/components/admin/AdminShell'

/**
 * Цэсийг бүлэглэв — холбоосууд нэг урт багана болвол нүд алдана.
 * Бүлэг бүр нэг ажлын төрлийг хариуцна: хичээл → худалдаа → тохиргоо.
 *
 * `tab: true` = утасны доод тааз дээр гарна. Дөрөв нь зориуд — таван зайны
 * тавь дахь нь «Цэс». Өдөр тутам хамгийн олон нээгддэг дөрвийг сонгов;
 * үлдсэн нь (багш, хэрэглэгч, админ) цэсний самбар дотор.
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

/* Сайтын агуулга нь АЖИЛТАНД нээлттэй — утас, хаяг солих нь эрхийн асуудал
   биш, өдөр тутмын ажил. */
const contentGroup: NavGroup = {
  label: 'Агуулга',
  items: [
    { href: '/admin/content', label: 'Сайтын агуулга', icon: 'file' },
    { href: '/admin/faq', label: 'Түгээмэл асуулт', icon: 'info' },
    { href: '/admin/gallery', label: 'Галерей', icon: 'image' },
  ],
}

/** Зөвхөн админд харагдах хэсэг — ажилтан эрх олгож чадахгүй. */
const adminGroup: NavGroup = {
  items: [{ href: '/admin/access', label: 'Админ', icon: 'shield' }],
}

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

  // Цэсийг эрхээр нь шүүнэ. Хуудас өөрөө ч `requireAdmin()` -тэй тул энэ нь
  // зөвхөн харагдац — хамгаалалт биш.
  const nav = profile.role === 'admin' ? [...groups, contentGroup, adminGroup] : [...groups, contentGroup]

  return (
    <AdminShell
      groups={nav}
      profile={{ name: profile.full_name ?? 'Админ', role: profile.role }}
      defaultCollapsed={collapsed}
      defaultScheme={scheme}
    >
      {children}
    </AdminShell>
  )
}
