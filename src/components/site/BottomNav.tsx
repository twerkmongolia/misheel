'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useChromeScroll } from './useChromeScroll'
import { TAB, TAB_ACTIVE, TAB_IDLE } from './tab'

export type TabIcon = 'home' | 'calendar' | 'bag' | 'star'
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
  const { hidden } = useChromeScroll()

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.7rem,env(safe-area-inset-bottom))] transition-transform duration-300 ease-out lg:hidden ${
        hidden ? 'translate-y-[calc(100%+1.5rem)]' : 'translate-y-0'
      }`}
    >
      <nav className="mx-auto flex max-w-md items-stretch gap-0.5 rounded-[1.6rem] border border-line bg-surface/85 p-1.5 shadow-[0_10px_40px_-12px_rgb(0_0_0_/_0.45)] backdrop-blur-xl">
        {tabs.map((tab) => {
          // `/mn` нь зөвхөн яг тэр хуудсанд, бусад нь дэд замуудад ч идэвхтэй
          const isHome = tab.href.split('/').filter(Boolean).length === 1
          const active = isHome ? pathname === tab.href : pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`${TAB} ${active ? TAB_ACTIVE : TAB_IDLE}`}
            >
              <TabIcon name={tab.icon} filled={active} />
              {tab.label}
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
const FILLABLE = new Set<TabIcon>(['home', 'star'])

function TabIcon({ name, filled }: { name: TabIcon; filled: boolean }) {
  const paths: Record<TabIcon, React.ReactNode> = {
    home: <path d="M4 11.2 12 4.5l8 6.7V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7.8Z" />,
    calendar: (
      <>
        <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
        <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
      </>
    ),
    bag: (
      <>
        <path d="M5.5 7.5h13l-1 12h-11l-1-12Z" />
        <path d="M9 7.5V6a3 3 0 0 1 6 0v1.5" />
      </>
    ),
    star: (
      <path d="M12 3.2 14.29 8.85 20.37 9.28 15.71 13.21 17.17 19.12 12 15.9 6.83 19.12 8.29 13.21 3.63 9.28 9.71 8.85Z" />
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled && FILLABLE.has(name) ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 1.9 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[22px] w-[22px]"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
