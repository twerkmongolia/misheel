import type { Metadata } from 'next'
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
      /* «Хуваарь» энэ жагсаалтаас ХАСАГДСАН. Хуудас нь (`/admin/schedule`)
         устаагүй — нийтийн сайт хуваарь харуулж, хүмүүс нэг удаагийн
         хичээл захиалсаар байгаа тул код нь ажилласаар байх ёстой. Зөвхөн
         зурвасаас алга болсон: студи одоо КУРС дээр төвлөрч, хуваарь нь
         өдөр тутмын ажил байхаа больсон.

         Зам нь бүрэн таслагдаагүй: хяналтын самбарын «Өнөөдрийн хичээл»
         үзүүлэлт ба «Бүтэн хуваарь →» холбоос хоёул тийш хөтөлсөөр байна.
         Өөрөөр хэлбэл хуваарь нь ӨДӨР ТУТМЫН цэснээс гарч, хэрэгтэй үедээ
         олддог газраа үлдэв. Хичээлийн төрлүүд ч мөн тэнд, хумигдсан
         жагсаалтад байгааг санах хэрэгтэй. */
      // Хоёр цэг, нэг хуудас. Ажилтны хувьд танхимын элсэлт ба онлайн анги
      // хоёр нь ӨӨР ажил: нэг нь суудал, огноо тоолдог; нөгөө нь Telegram
      // бүлэг арчилдаг. Нэг цэг болговол дарж ороод шүүх ёстой болно.
      { href: '/admin/courses?mode=studio', label: 'Танхимын анги', icon: 'layers' },
      { href: '/admin/courses?mode=online', label: 'Онлайн анги', icon: 'globe' },
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

/* Удирдлага бүхэлдээ индексээс гадуур — proxy нь нэвтрээгүй хүнийг аль
   хэдийн буцаадаг ч робот `robots` тэмдэглэгээг л уншина. */
export const metadata: Metadata = {
  title: { default: 'Удирдлага', template: '%s · Удирдлага' },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Урьдчилсан шалгалт proxy дээр байгаа ч жинхэнэ шалгалт энд.
  const profile = await requireStaff()

  // Цэсийг эрхээр нь шүүнэ. Хуудас өөрөө ч `requireAdmin()` -тэй тул энэ нь
  // зөвхөн харагдац — хамгаалалт биш.
  const nav = profile.role === 'admin' ? [...groups, contentGroup, adminGroup] : [...groups, contentGroup]

  return (
    <AdminShell
      groups={nav}
      profile={{ name: profile.full_name ?? 'Админ', role: profile.role }}
    >
      {children}
    </AdminShell>
  )
}
