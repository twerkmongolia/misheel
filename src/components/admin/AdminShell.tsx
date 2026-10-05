'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { logout } from '@/actions/auth'
import { RAIL_COOKIE } from '@/lib/admin/rail'
import { AdminIcon, type NavIcon } from './AdminIcon'
import { AdminSearch } from './AdminSearch'

export type NavItem = {
  href: string
  label: string
  icon: NavIcon
  /** Утасны доод тааз дээр гарах эсэх. Бусад нь «Цэс» хуудаснаа орно. */
  tab?: boolean
  /** Доод таазны богино нэр — «Хяналтын самбар» тэнд багтахгүй. */
  short?: string
}
export type NavGroup = { label?: string; items: NavItem[] }

export type ShellProfile = { name: string; role: string }

/** Толгой мөрийн тоолуурууд — ажилтны шийдвэр хүлээж буй зүйлс. */
export type ShellAlerts = { toPrepare: number; lowStock: number }

/**
 * Удирдлагын бүрхүүл — зүүн талд бүтэн цэс, дээр толгой мөр, доор хөл.
 *
 * ── Зурвас нь анхдагчаар БҮТЭН ─────────────────────────────────────────
 * Өмнө нь 5rem-ийн дүрсний зурвас байсан бөгөөд зөвхөн хулгана хүрэхэд
 * нэрсээ дэлгэдэг байв. Долоон ижил хэмжээтэй дүрсийг нэргүй харах нь шинэ
 * ажилтанд таавар: «аль нь Сурагчид билээ». Одоо нэр ҮРГЭЛЖ харагдана.
 *
 * Ажлын талбай хэрэгтэй хүнд ← товч зурвасыг 4.5rem болгож хумина. Тэр
 * үед хуучин зан үйл буцаж ирнэ: хулгана хүрэхэд дэлгэгдэж, агуулгын
 * ДЭЭГҮҮР хөвнө (хуудсыг түлхвэл хүснэгт бүр хулгана зүүн ирмэг дайрах
 * болгонд дахин эвхэгдэнэ). Сонголт нь cookie-д хадгалагдах тул серверээс
 * зөв өргөнөөрөө ирж, ачаалах мөчид үсрэхгүй.
 *
 * ── Хэмжээс нь хоёр төлөвт ЯГ таарна ───────────────────────────────────
 * Хумигдсан зурвас 72px. Дүрс бүрийн төв нь 12 (nav зай) + 14 (мөрийн
 * зай) + 10 (дүрсний хагас) = 36px — яг голд. Лого ч мөн адил: 18 + 18.
 * Тиймээс зурвас нээгдэх, хаагдахад дүрсүүд НЭГ пикселээр ч хөдлөхгүй,
 * зөвхөн нэрс гарч ирнэ, алга болно.
 */
export function AdminShell({
  groups,
  profile,
  alerts,
  mini: initialMini,
  year,
  className = '',
  children,
}: {
  groups: NavGroup[]
  profile: ShellProfile
  alerts: ShellAlerts
  /** Cookie-оос уншсан анхны төлөв. */
  mini: boolean
  /** Хөлийн он — серверээс, рендерийн дотор цаг уншихгүйн тулд. */
  year: number
  /** Фонтын хувьсагчийн класс (§ admin/layout.tsx). */
  className?: string
  children: React.ReactNode
}) {
  const [mini, setMini] = useState(initialMini)
  const [hover, setHover] = useState(false)
  /* ← товч дарсны дараа хулгана зурвас дээрээ л байгаа. Түүнийг «хүрсэн»
     гэж тооцвол зурвас хумигдаад ТЭР ДОРОО буцаж дэлгэгдэнэ — товч юу ч
     хийгээгүй мэт. Хулгана гарч, эргэж орох хүртэл дэлгэхгүй. */
  const [armed, setArmed] = useState(true)
  const open = !mini || hover

  // «Цэс» самбарыг НЭЭСЭН үеийн зам. Хуудас солигдонгуут өөрөө хаагдана —
  // effect-гүйгээр, шинэ хуудасны дээр өлгөөтэй үлдэхгүй.
  const [sheetPath, setSheetPath] = useState<string | null>(null)
  const pathname = usePathname()
  const params = useSearchParams()
  const sheetOpen = sheetPath === pathname

  const items = groups.flatMap((group) => group.items)

  /**
   * Одоо аль хуудсан дээр байна вэ.
   *
   * Хаяг нь ШҮҮЛТҮҮР агуулж болно (`/admin/courses?mode=online`). Хоёр цэг
   * яг нэг замтай тул зөвхөн замаар нь тааруулбал хоёулаа зэрэг идэвхтэй
   * болж, зурвас «би хаана байна» гэдгийг хэлэхээ болино.
   *
   * Хоёр шат: эхлээд шүүлтүүртэй нь ЯГ таарахыг хайна, олдохгүй бол
   * зөвхөн замаар. Хоёр дахь шат нь `?ok=1`, `?error=…` гэх мэт үйлдлийн
   * дараах хаягуудад хэрэгтэй — тэнд шүүлтүүр байхгүй ч ажилтан курсын
   * хуудсан дээрээ л байгаа бөгөөд зурвас хоосон харагдах ёсгүй.
   */
  const matchPath = (href: string) => {
    const path = href.split('?')[0]
    return path === '/admin' ? pathname === '/admin' : pathname.startsWith(path)
  }

  const matchQuery = (href: string) =>
    [...new URLSearchParams(href.split('?')[1] ?? '')].every(
      ([key, value]) => params.get(key) === value,
    )

  const current =
    items.find((item) => matchPath(item.href) && matchQuery(item.href)) ??
    items.find((item) => matchPath(item.href))

  const tabs = items.filter((item) => item.tab)
  const rest = items.filter((item) => !item.tab)
  const restActive = current !== undefined && !current.tab

  const toggle = () => {
    const next = !mini
    setMini(next)
    setHover(false)
    setArmed(false)
    // Жилээр. Зам нь `/admin` — нийтийн сайтын хүсэлт бүрд дагаж явахгүй.
    document.cookie = `${RAIL_COOKIE}=${next ? 'mini' : 'full'}; path=/admin; max-age=31536000; samesite=lax`
  }

  return (
    <div className={`admin-shell flex min-h-screen flex-1 bg-background text-foreground ${className}`}>
      {/* ── Зүүн зурвас ────────────────────────────────────────────────── */}
      {/* Гадна бүрхүүл нь зохиомжид эзлэх ӨРГӨНИЙГ барина; дотоод самбар нь
          хумигдсан үед хулгана хүрэхэд түүнээс өргөсөж агуулгын дээгүүр
          гарна. `z-40` нь толгой мөрнөөс (z-30) дээгүүр: дэлгэгдсэн самбар
          түүний зүүн захыг халхална. */}
      <aside
        onMouseEnter={() => armed && setHover(true)}
        onMouseLeave={() => {
          setHover(false)
          setArmed(true)
        }}
        onFocus={() => armed && setHover(true)}
        /* `relatedTarget` нь фокус ОЧИЖ буй элемент. Зурвасын дотор үлдсэн
           бол хумихгүй — эс бөгөөс Tab дарах бүрд самбар анивчина. */
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setHover(false)
        }}
        className={`sticky top-0 z-40 hidden h-screen shrink-0 transition-[width] duration-200 ease-out lg:block ${
          mini ? 'w-[4.5rem]' : 'w-[16.25rem]'
        }`}
      >
        <div
          className={`flex h-full flex-col overflow-hidden border-r border-line bg-surface transition-[width,box-shadow] duration-200 ease-out ${
            open ? 'w-[16.25rem]' : 'w-[4.5rem]'
          } ${mini && hover ? 'shadow-[var(--shadow-pop)]' : ''}`}
        >
          {/* ── Лого ── Толгой мөртэй ИЖИЛ өндөр (64px): хоёулангийнх нь
              доод зураас нэг шугамд нийлж, дэлгэцийг хөндлөн огтолно. */}
          <div className="flex h-16 shrink-0 items-center gap-2 border-b border-line pr-3 pl-[1.125rem]">
            <Link
              href="/admin"
              className="flex min-w-0 items-center gap-3 rounded-md transition-opacity hover:opacity-80"
            >
              <Logo />
              <span
                className={`truncate text-[1.0625rem] font-medium tracking-[-0.01em] whitespace-nowrap transition-opacity duration-200 ${
                  open ? 'opacity-100' : 'opacity-0'
                }`}
              >
                Twerk Mongolia
              </span>
            </Link>
            <button
              type="button"
              onClick={toggle}
              aria-label={mini ? 'Цэсийг дэлгэх' : 'Цэсийг хумих'}
              aria-pressed={mini}
              className={`icon-btn ml-auto shrink-0 transition-opacity duration-200 ${
                open ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <AdminIcon
                name="collapse"
                className={`transition-transform duration-200 ${mini ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {/* Бүлгийн гарчиг нь хумигдсан үед ч ЗАЙГАА эзэлсээр байна —
              зөвхөн харагдахаа болино. Ингэснээр зурвас нээгдэхэд мөрүүд
              босоо тэнхлэгээрээ огт хөдлөхгүй. */}
          <nav
            aria-label="Удирдлагын цэс"
            className="admin-scroll flex flex-1 flex-col overflow-x-hidden overflow-y-auto px-3 pt-3 pb-6"
          >
            {groups.map((group, index) => (
              <div key={index} className="flex flex-col gap-0.5">
                {group.label && (
                  <p
                    className={`mt-5 mb-2 truncate px-[0.875rem] text-[0.75rem] font-medium tracking-[0.06em] whitespace-nowrap text-muted uppercase transition-opacity duration-200 ${
                      open ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {group.label}
                  </p>
                )}
                {group.items.map((item) => (
                  <RailLink key={item.href} item={item} open={open} active={item === current} />
                ))}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── Толгой мөр ──────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 border-b border-line bg-surface">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            {/* Утсан дээр зурвас байхгүй тул лого ба хуудасны нэр энд. */}
            <Link href="/admin" aria-label="Хяналтын самбар" className="shrink-0 lg:hidden">
              <Logo />
            </Link>
            <span className="truncate text-[1rem] font-medium md:hidden">
              {current?.label ?? 'Удирдлага'}
            </span>

            <AdminSearch
              pages={items.map(({ href, label, icon }) => ({ href, label, icon }))}
              className="hidden w-full max-w-[28rem] md:block"
            />

            <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
              {/* Утсан дээр нуугдана — хуудасны нэрэнд зай хэрэгтэй, «Сайт руу»
                  нь хэрэглэгчийн цэсэнд ч бий. Нуухыг ГАДНА савд хийнэ:
                  `.icon-btn` -ийн `display: grid` нь давхаргагүй тул
                  `hidden` утилитыг дарна. */}
              <span className="contents max-sm:hidden">
                <HeaderLink href="/mn" icon="external" label="Сайт руу" />
              </span>
              {/* Тоолуур нь ҮЙЛДЭЛ хүлээж буй зүйлийг л тоолно. «Шинэ
                  мэдэгдэл» гэх мэт уншаад өнгөрөх зүйл энд байхгүй — улаан
                  тоо бүр «чамайг хүлээж байна» гэсэн утгатай байх ёстой. */}
              <HeaderLink
                href="/admin/products"
                icon="box"
                label="Дуусаж буй нөөц"
                count={alerts.lowStock}
              />
              <HeaderLink
                href="/admin/orders?status=paid"
                icon="bell"
                label="Бэлтгэх захиалга"
                count={alerts.toPrepare}
              />

              <span aria-hidden="true" className="mx-2 hidden h-9 w-px bg-line sm:block" />

              <UserMenu profile={profile} />
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6">
          {/* Доод тааз агуулгыг дарахгүйн тулд зай үлдээнэ */}
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 pb-24 lg:pb-0">
            {children}
          </div>
        </main>

        <footer className="hidden border-t border-line bg-surface px-6 py-3.5 text-center text-[0.8125rem] text-muted lg:block">
          © {year} Twerk Mongolia. Бүх эрх хуулиар хамгаалагдсан.
        </footer>
      </div>

      {/* ── Утасны доод тааз ───────────────────────────────────────────── */}
      <nav
        aria-label="Үндсэн цэс"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <div className="flex items-stretch">
          {tabs.map((item) => (
            <TabLink key={item.href} item={item} active={item === current} />
          ))}
          <button
            type="button"
            onClick={() => setSheetPath(pathname)}
            aria-expanded={sheetOpen}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-2 transition-colors ${
              restActive || sheetOpen ? 'text-primary' : 'text-muted'
            }`}
          >
            <AdminIcon name="menu" className="h-[22px] w-[22px]" />
            <span className="text-[10px] leading-none font-medium">Цэс</span>
          </button>
        </div>
      </nav>

      {/* ── «Цэс» самбар ───────────────────────────────────────────────── */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Хаах"
            onClick={() => setSheetPath(null)}
            className="absolute inset-0 bg-scrim"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-line bg-surface pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[var(--shadow-pop)]">
            <div className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-line-strong" />

            <div className="flex items-center gap-3 px-4 py-4">
              <Avatar name={profile.name} size="lg" />
              <span className="min-w-0 leading-tight">
                <span className="block truncate font-medium">{profile.name}</span>
                <span className="block text-xs text-muted">{profile.role}</span>
              </span>
            </div>

            <div className="flex flex-col gap-0.5 border-t border-line px-2 py-2">
              {rest.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={item === current ? 'page' : undefined}
                  className={`flex h-12 items-center gap-3 rounded-md px-3 text-[15px] transition-colors ${
                    item === current
                      ? 'bg-surface-3 font-medium text-foreground'
                      : 'text-foreground-soft active:bg-surface-2'
                  }`}
                >
                  <AdminIcon name={item.icon} className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              ))}

              {/* Жагсаалтын сүүлчийн мөр, шугамаар тусгаарлагдсан: гарах нь
                  навигаци БИШ — хуудас солихгүй, session-ийг дуусгана. */}
              <form action={logout} className="mt-1 border-t border-line pt-1">
                <input type="hidden" name="locale" value="mn" />
                <button
                  type="submit"
                  className="flex h-12 w-full items-center gap-3 rounded-md px-3 text-[15px] text-foreground-soft transition-colors active:bg-surface-2"
                >
                  <AdminIcon name="logout" className="h-5 w-5 shrink-0" />
                  Гарах
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Тэмдэг — `app/icon.svg` -тэй ЯГ ижил зурлага (цагаан хавтан, хар «TM»).
 * Фонтоор биш замаар зурсан: хөтчийн таб, зурвас хоёр дээр нэг тэмдэг.
 */
function Logo() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="h-9 w-9 shrink-0">
      <rect width="32" height="32" rx="8" fill="#FFFFFF" />
      <g fill="none" stroke="#0F1114" strokeWidth="2.6" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M5.5 10.2h8M9.5 10.2V22" />
        <path d="M17.5 22V10.2L22 17l4.5-6.8V22" />
      </g>
    </svg>
  )
}

/**
 * Нэрийн эхний үсэг. Зураг (`avatar_url`) зориуд ашиглаагүй: Google-ийн
 * профайл зураг `lh3.googleusercontent.com` -оос ирдэг бөгөөд CSP-ийн
 * `img-src` түүнийг хаана (§ proxy.ts) — эвдэрсэн зургийн дүрс гарна.
 */
function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#008CFF,#8932EF)] font-medium text-white ${
        size === 'lg' ? 'h-10 w-10 text-sm' : 'h-9 w-9 text-[0.8125rem]'
      }`}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  )
}

/** Толгой мөрийн дүрст холбоос — тоолууртай бол улаан тэмдэг. */
function HeaderLink({
  href,
  icon,
  label,
  count = 0,
}: {
  href: string
  icon: NavIcon
  label: string
  count?: number
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={count > 0 ? `${label}: ${count}` : label}
      className="icon-btn relative"
    >
      <AdminIcon name={icon} />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-0.5 right-0.5 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-danger px-1 text-[0.6875rem] leading-none font-medium text-white tabular-nums ring-2 ring-surface"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

/**
 * Хэрэглэгчийн цэс — хэн нэвтэрсэн, тэгээд ГАРАХ.
 *
 * Гарах нь доош унждаг цэсэнд орсон: толгой мөрөнд одоо хайлт, гурван
 * тоолуур суудаг бөгөөд гарах товч тэдний дунд зогсвол хамгийн ховор
 * хийдэг үйлдэл хамгийн их байр эзэлнэ. Хүн «гарах» -ыг үргэлж өөрийн
 * НЭРЭН дээрээс хайдаг — тэр нь энд.
 */
function UserMenu({ profile }: { profile: ShellProfile }) {
  const pathname = usePathname()
  // Нээсэн үеийн зам — хуудас солигдоход өөрөө хаагдана (§ «Цэс» самбар).
  const [openAt, setOpenAt] = useState<string | null>(null)
  const open = openAt === pathname

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpenAt(null)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpenAt(null)
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpenAt(open ? null : pathname)}
        className="flex items-center gap-3 rounded-md py-1 pr-1.5 pl-1 text-left transition-colors hover:bg-surface-2 sm:pr-2"
      >
        <Avatar name={profile.name} />
        <span className="hidden min-w-0 leading-tight sm:block">
          <span className="block max-w-[10rem] truncate text-[0.9375rem] font-medium">{profile.name}</span>
          <span className="block text-[0.8125rem] text-muted">{profile.role}</span>
        </span>
        <AdminIcon
          name="chevronDown"
          className={`hidden h-4 w-4 shrink-0 text-muted transition-transform duration-200 sm:block ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 z-50 mt-2 w-60 overflow-hidden rounded-lg border border-line bg-surface py-1.5 shadow-[var(--shadow-pop)]"
        >
          <div className="border-b border-line px-4 pt-2 pb-3">
            <p className="truncate font-medium">{profile.name}</p>
            <p className="text-[0.8125rem] text-muted">{profile.role}</p>
          </div>
          <Link
            href="/mn"
            className="mt-1.5 flex items-center gap-3 px-4 py-2 text-foreground-soft transition-colors hover:bg-surface-3 hover:text-foreground"
          >
            <AdminIcon name="external" className="h-[1.125rem] w-[1.125rem] shrink-0" />
            Сайт руу
          </Link>
          {/* Удирдлага зөвхөн монголоор ажилладаг тул гарсны дараа `/mn`
              руу буцна (§ actions/auth.ts `localeFrom`). */}
          <form action={logout} className="mt-1.5 border-t border-line pt-1.5">
            <input type="hidden" name="locale" value="mn" />
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-foreground-soft transition-colors hover:bg-surface-3 hover:text-danger"
            >
              <AdminIcon name="logout" className="h-[1.125rem] w-[1.125rem] shrink-0" />
              Гарах
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

/** Доод таазны нэг таб — дүрс дээр, богино нэр доор. */
function TabLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 py-2 transition-colors ${
        active ? 'text-primary' : 'text-muted'
      }`}
    >
      {active && (
        <span aria-hidden="true" className="absolute top-0 h-[2px] w-8 rounded-b-full bg-primary" />
      )}
      <AdminIcon name={item.icon} className="h-[22px] w-[22px]" />
      <span className="max-w-full truncate text-[10px] leading-none font-medium">
        {item.short ?? item.label}
      </span>
    </Link>
  )
}

/**
 * Зурвасын нэг мөр.
 *
 * Идэвхтэй мөр нь бүтэн саарал ХАВТАН — хумигдсан үед ч (48×44 дөрвөлжин
 * дүрсийг тойрно) харагдана. Өмнөх нимгэн зүүн зураас нь хумигдсан
 * зурваст бараг үл үзэгдэх байсан: «би хаана байна» гэдэг тэмдэг хамгийн
 * хэрэгтэй үедээ байхгүй байлаа.
 */
function RailLink({ item, open, active }: { item: NavItem; open: boolean; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`flex h-11 w-full items-center gap-3.5 rounded-md px-[0.875rem] text-[0.9375rem] whitespace-nowrap transition-colors duration-150 ${
        active
          ? 'bg-surface-3 font-medium text-foreground'
          : 'text-foreground-soft hover:bg-surface-2 hover:text-foreground'
      }`}
    >
      <AdminIcon name={item.icon} className="h-5 w-5 shrink-0" />
      {/* Нэр нь ҮРГЭЛЖ зурагдана — зөвхөн харагдахаа болино. Нөхцөлт
          зурагдалт нь өргөн гүйж байхад текстийг НЭГ ХҮРЭЭНД үсрүүлдэг. */}
      <span
        className={`min-w-0 truncate transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      >
        {item.label}
      </span>
    </Link>
  )
}
