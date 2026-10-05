import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import { cookies } from 'next/headers'
import { requireStaff } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { RAIL_COOKIE } from '@/lib/admin/rail'
import { AdminShell, type NavGroup } from '@/components/admin/AdminShell'

/**
 * Удирдлагын үсэг — Roboto.
 *
 * Нийтийн сайтын хос (Manrope + Inter) нь брэндийн дуу хоолой: гарчиг нь
 * мэдэгдэл хийж, их бие нь уншуулна. Удирдлагад гарчиг гэж бараг байхгүй —
 * хүснэгт, тоо, товч, шошго. Roboto нь яг тэр ажилд зориулагдсан нягт,
 * төвийг сахисан grotesque бөгөөд 14px дээр ч кирилл үсэг бүр салангид.
 *
 * Энд, layout-д ачаалагдана: `next/font` нь фонтыг ЗӨВХӨН ашигласан
 * маршрутад урьдчилан татдаг тул нийтийн сайтын зочин Roboto-г огт
 * татахгүй.
 *
 * ⚠️ `cyrillic-ext` ЗААВАЛ. Google-ийн `cyrillic` олонлог нь U+0400–045F
 * хүрээг л хамардаг — монгол «Ө ө Ү ү» (U+04E8, U+04AE …) тэнд БАЙХГҮЙ.
 * Тэдгээр нь `cyrillic-ext` -д байдаг; урьдчилан татахгүй бол хуудас
 * эхлээд өөр фонтоор «ө» -г зурж, дараа нь солигдон анивчина.
 */
const roboto = Roboto({
  variable: '--font-admin',
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
})

const ROLE_LABEL: Record<string, string> = { admin: 'Админ', staff: 'Ажилтан' }

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
      /* Сурагчид нь «Хэрэглэгч» -ээс ТУСДАА: тэр нь бүртгүүлсэн бүх хүн,
         энэ нь хичээл АВСАН хүмүүс. Хоёр өөр асуулт, хоёр өөр жагсаалт. */
      { href: '/admin/students', label: 'Сурагчид', icon: 'check' },
    ],
  },
  {
    label: 'Худалдаа',
    items: [
      { href: '/admin/products', label: 'Бараа', icon: 'tag', tab: true },
      { href: '/admin/orders', label: 'Захиалга', icon: 'receipt', tab: true },
      /* Худалдан авагч нь «Хэрэглэгч» -ээс ТУСДАА (§ «Сурагчид» ижил):
         тэр нь бүртгүүлсэн бүх хүн, энэ нь БАРАА авсан хүмүүс. */
      { href: '/admin/buyers', label: 'Худалдан авагч', icon: 'cart' },
      { href: '/admin/customers', label: 'Хэрэглэгч', icon: 'person' },
    ],
  },
]

/* Агуулга нь АЖИЛТАНД нээлттэй — асуулт хариулт засах нь эрхийн асуудал
   биш, өдөр тутмын ажил. */
const contentGroup: NavGroup = {
  label: 'Агуулга',
  items: [{ href: '/admin/faq', label: 'Түгээмэл асуулт', icon: 'info' }],
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

  /* ── Толгой мөрийн тоолуурууд ───────────────────────────────────────
     Зөвхөн ТОО (`head: true`) — мөр татахгүй. Layout нь хуудас хооронд
     client шилжилт хийхэд дахин ажилладаггүй ч Server Action бүрийн дараа
     (`revalidatePath` / `redirect`) мод бүхэлдээ шинэчлэгддэг: ажилтан
     захиалгыг «Бэлтгэж эхлэх» болгомогц хонхны тоо буурна. */
  const supabase = await createClient()
  const [{ count: toPrepare }, { count: lowStock }, jar] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
    supabase
      .from('product_variants')
      .select('id', { count: 'exact', head: true })
      .lte('stock_qty', 3),
    cookies(),
  ])

  return (
    <AdminShell
      className={roboto.variable}
      groups={nav}
      profile={{
        name: profile.full_name ?? 'Админ',
        role: ROLE_LABEL[profile.role] ?? profile.role,
      }}
      alerts={{ toPrepare: toPrepare ?? 0, lowStock: lowStock ?? 0 }}
      mini={jar.get(RAIL_COOKIE)?.value === 'mini'}
      year={new Date().getFullYear()}
    >
      {children}
    </AdminShell>
  )
}
