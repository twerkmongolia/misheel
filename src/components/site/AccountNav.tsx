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

export type AccountIcon = 'courses' | 'play' | 'bag' | 'person'

export type AccountTab = {
  href: string
  label: string
  icon: AccountIcon
  /** Утасны доод самбарын нэр. Урт нэр таван баганад тасарна. */
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

/**
 * Хувийн хуудсуудын дотоод цэс — анги, хичээл, захиалга, профайл.
 *
 * Дээд табаас ТУСДАА: тэдгээр нь нийтийн сайт руу ГАРГАДАГ бол эдгээр нь
 * самбарын дотор үлдээдэг. Нэг эгнээнд нийлүүлбэл хүн аль товч хаашаа
 * аваачихыг таамаглах ёстой болно.
 *
 * Тиймээс агуулгын ДЭЭД талд, бөмбөлөг хэлбэрээр: толгойн доогуур зурааст
 * табуудаас хэлбэрээрээ ялгарна.
 */
export function AccountSubNav({
  items,
}: {
  items: { href: string; label: string; exact?: boolean }[]
}) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Хувийн хуудсууд"
      className="-mx-4 mb-8 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mb-10 [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex min-w-max gap-2">
        {items.map((item) => {
          const on = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={on ? 'page' : undefined}
              className={`chip ${on ? 'chip-on' : ''}`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
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
    /* Онлайн — дэлгэц дээрх тоглуулагч. Хуанли (хуваарь) БИШ: онлайн анги
       нь тогтсон цаггүй, өөрийн хэмнэлээр үздэг. */
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
