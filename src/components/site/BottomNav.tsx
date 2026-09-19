'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useChromeScroll } from './useChromeScroll'
import { TAB, TAB_ACTIVE, TAB_IDLE, TAB_LABEL } from './tab'

export type TabIcon = 'home' | 'courses' | 'play' | 'bag'
export type TabItem = { href: string; label: string; icon: TabIcon }

/**
 * Гар утасны үндсэн навигаци — доор хөвдөг таб самбар.
 *
 * Дээд навбар нь эрхий хуруунаас хамгийн хол цэгт байдаг. Утсыг нэг гараар
 * барьж байхад хамгийн олон дардаг холбоосууд доор байх ёстой.
 *
 * Гүйлгэх зан төлөв нь дээд навбартай ЯГ ижил: `useChromeScroll` нэг л
 * төлвийг хоёуланд нь тараана. Доош гүйлгэхэд хоёулаа зэрэг зайлж, дээш
 * гүйлгэхэд зэрэг буцаж ирнэ.
 */
export function BottomNav({
  tabs,
  menu,
}: {
  tabs: TabItem[]
  /** Цэсний таб — серверээс ирнэ (`MobileMenu`, дотроо самбараа авч явна). */
  menu: React.ReactNode
}) {
  const pathname = usePathname()
  /* Хоёр таб НЭГ хуудас руу заана: `/courses?mode=studio` ба `?mode=online`.
     `pathname` дотор асуулгын мөр БАЙДАГГҮЙ тул зөвхөн замаар тулгавал
     хоёулаа зэрэг идэвхжинэ (эсвэл хоёулаа хэзээ ч идэвхжихгүй) — самбарын
     дээд зураас нь «би хаана байна» гэдгийг хэлэхээ болино. */
  const params = useSearchParams()
  const { hidden } = useChromeScroll()

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-500 ease-out lg:hidden ${
        hidden ? 'translate-y-full' : 'translate-y-0'
      }`}
    >
      {/* Хөвдөг бөмбөлөг биш ТУУЗ. Дэлгэцийн ирмэгт тулсан самбар нь агуулгын
          үргэлжлэл мэт уншигдана — хөвдөг хайрцаг нь дээр нь тавьсан өөр
          програм мэт харагддаг. */}
      <nav className="flex items-stretch border-t border-line bg-background/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150">
        {tabs.map((tab) => {
          const [path, query] = tab.href.split('?')
          const mode = query ? new URLSearchParams(query).get('mode') : null

          // `/mn` нь зөвхөн яг тэр хуудсанд, бусад нь дэд замуудад ч идэвхтэй
          const isHome = path.split('/').filter(Boolean).length === 1
          const onPath = isHome ? pathname === path : pathname.startsWith(path)
          const active = onPath && (!mode || params.get('mode') === mode)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`${TAB} ${active ? TAB_ACTIVE : TAB_IDLE}`}
            >
              <TabIcon name={tab.icon} filled={active} />
              <span className={TAB_LABEL}>{tab.label}</span>
            </Link>
          )
        })}

        {menu}
      </nav>
    </div>
  )
}

/**
 * Идэвхтэй таб дүүрсэн дүрстэй болно — өнгөгүй системд «энэ бол одоогийн
 * хуудас» гэдгийг зөвхөн дэвсгэрээр заавал сул. Хэлбэр нь давхар дохио.
 */
/** Хаалттай хэлбэртэй дүрснүүд — идэвхтэй үедээ дүүрч болно. */
const FILLABLE = new Set<TabIcon>(['home'])

function TabIcon({ name, filled }: { name: TabIcon; filled: boolean }) {
  const paths: Record<TabIcon, React.ReactNode> = {
    home: <path d="M4 11.2 12 4.5l8 6.7V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7.8Z" />,
    /* Танхим ба онлайны дүрс нь сурагчийн самбартай ЯГ ижил (§ AccountNav
       `Icon`): нэвтэрсэн, нэвтрээгүй хоёр төлөвт нэг зүйл нэг дүрстэй
       байхгүй бол хүн доод самбарыг өөр газар гэж уншина. */
    courses: (
      <>
        <path d="M4.5 5.5A2 2 0 0 1 6.5 3.5H19v14H6.5a2 2 0 0 0-2 2V5.5Z" />
        <path d="M4.5 19.5a2 2 0 0 1 2-2H19v3H6.5a2 2 0 0 1-2-1Z" />
      </>
    ),
    play: (
      <>
        <rect x="2.5" y="4.5" width="19" height="13" rx="2.5" />
        <path d="M8 20.5h8" />
        <path d="M10.5 8.5l4.5 2.5-4.5 2.5v-5Z" />
      </>
    ),
    bag: (
      <>
        <path d="M5.5 7.5h13l-1 12h-11l-1-12Z" />
        <path d="M9 7.5V6a3 3 0 0 1 6 0v1.5" />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled && FILLABLE.has(name) ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 1.6 : 1.3}
      strokeLinecap="square"
      strokeLinejoin="miter"
      className="h-5 w-5"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
