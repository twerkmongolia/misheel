'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TAB, TAB_ACTIVE, TAB_IDLE, TAB_LABEL } from './tab'

/* ───────────────────────────────────────────────────────────────────────────
   Сурагчийн навигаци — НЭГ жагсаалт, ХОЁР хэлбэр.

   ── Яагаад утсан дээр ДООР вэ ───────────────────────────────────────────
   Дээд мөр нь эрхий хуруунаас хамгийн хол цэг. Сурагч утсаа нэг гараар
   барьж, хичээл ба бүртгэлийнхээ хооронд байнга сэлгэнэ — тэр хоёр товчийг
   дэлгэцийн орой дээр тавих нь гар сунгах шаардлага үүсгэнэ.

   Өмнө нь дөрвөн таб дээд мөрөнд ХЭВТЭЭ ГҮЙДЭГ эгнээ байв: «Захиалга»,
   «Профайл» хоёр дэлгэцийн гадна үлдэж, хүн тэднийг байгаа ч гэдгийг
   мэдэхгүй байлаа. Гүйдэг навигаци нь нуугдсан навигаци.

   Ширээний компьютерт эсрэгээрээ: зай хангалттай, хулгана хаана ч хүрнэ.
   Тэнд доод тууз нь агуулгыг дарж, хулганыг доош аялуулна — тиймээс
   толгойн доор, хуудасныхаа дээр сууна.

   Нийтийн сайтын доод самбартай НЭГ хэв (§ site/tab.ts): сурагч хоёр
   ертөнцийн хооронд шилжихэд гар нь ижил зүйлийг ижил газраас олно.
   ─────────────────────────────────────────────────────────────────────── */

export type AccountIcon = 'courses' | 'calendar' | 'receipt' | 'bag' | 'person'

export type AccountTab = {
  href: string
  label: string
  icon: AccountIcon
  /** Утасны доод самбарын нэр. Урт нэр дөрвөн баганад тасарна. */
  short?: string
  /** Эцэг зам — дэд хуудсууд дээр идэвхтэй болохгүй. */
  exact?: boolean
}

export function AccountTabs({ tabs }: { tabs: AccountTab[] }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Миний булан"
      className="mx-auto hidden w-full max-w-[72rem] gap-7 px-4 sm:px-6 lg:flex"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={isActive(tab, pathname) ? 'page' : undefined}
          className="nav-item t-small whitespace-nowrap"
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}

/**
 * ⚠️ Энэ самбар нь толгойн ГАДНА зурагдах ЁСТОЙ.

 * Толгой мөр нь `backdrop-blur` -тай бөгөөд `backdrop-filter` нь дотроо
 * `position: fixed` элементэд ШИНЭ агуулагч блок үүсгэдэг: самбар дэлгэцийн
 * ёроолд биш ТОЛГОЙН ёроолд наалдаж, хуудсын дээд хэсэгт өлгөөтэй үлдэнэ.
 * Ижил урхи `transform`, `filter` дээр ч бий.
 */
export function AccountBottomNav({ tabs }: { tabs: AccountTab[] }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Миний булан"
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-line bg-background/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 lg:hidden"
    >
      {tabs.map((tab) => {
        const on = isActive(tab, pathname)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={on ? 'page' : undefined}
            className={`${TAB} ${on ? TAB_ACTIVE : TAB_IDLE}`}
          >
            <Icon name={tab.icon} filled={on} />
            <span className={TAB_LABEL}>{tab.short ?? tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function isActive(tab: AccountTab, pathname: string): boolean {
  return tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
}

/**
 * Идэвхтэй таб нь зурлагаа зузаалж, дээрээ шугамтай болно (§ tab.ts).
 * Дүүргэлт ашиглахгүй: эдгээр дүрсний дотор гарын үсэг (хуанлийн шугам,
 * хүний мөр) байгаа тул дүүргэвэл тэр нь алга болно.
 */
function Icon({ name, filled }: { name: AccountIcon; filled: boolean }) {
  const paths: Record<AccountIcon, React.ReactNode> = {
    courses: (
      <>
        <path d="M4.5 5.5A2 2 0 0 1 6.5 3.5H19v14H6.5a2 2 0 0 0-2 2V5.5Z" />
        <path d="M4.5 19.5a2 2 0 0 1 2-2H19v3H6.5a2 2 0 0 1-2-1Z" />
      </>
    ),
    calendar: (
      <>
        <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
        <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
      </>
    ),
    receipt: (
      <>
        <path d="M5.5 3.5h13v17l-2.2-1.6-2.2 1.6-2.1-1.6-2.2 1.6-2.1-1.6-2.2 1.6v-17Z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
    bag: (
      <>
        <path d="M5.5 7.5h13l-1 12h-11l-1-12Z" />
        <path d="M9 7.5V6a3 3 0 0 1 6 0v1.5" />
      </>
    ),
    person: (
      <>
        <circle cx="12" cy="8.25" r="3.75" />
        <path d="M4.75 20c0-3.6 3.25-6 7.25-6s7.25 2.4 7.25 6" />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
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
