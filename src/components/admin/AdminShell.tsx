'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { AdminIcon, type NavIcon } from './AdminIcon'

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

const NAV_COOKIE = 'tm_admin_nav'
const SCHEME_COOKIE = 'tm_admin_scheme'

function remember(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
}

/**
 * Удирдлагын бүрхүүл — зүүн тал дүрсний зурвас, дээр толгой мөр.
 *
 * Хоёр төлвийг эзэмшинэ: өнгөний горим ба зурвас хумигдсан эсэх. Хоёулаа
 * cookie-д хадгалагдана — сервер уншиж чаддаг тул эхний зурагтаа ЗӨВ гарна.
 * localStorage бол зөвхөн effect дотор уншигдах тул хуудас бүрд буруу
 * өнгө/өргөнтэй нэг хүрээ анивчина.
 *
 * Горим нь сайтынхаас ТУСДАА: `<html data-theme>` -д хүрэхгүй, зөвхөн энэ
 * wrapper -ийн `color-scheme` -ийг сольдог (§ globals.css `.admin-shell`).
 */
export function AdminShell({
  groups,
  profile,
  defaultCollapsed,
  defaultScheme,
  children,
}: {
  groups: NavGroup[]
  profile: { name: string; role: string }
  defaultCollapsed: boolean
  defaultScheme: 'light' | 'dark'
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [scheme, setScheme] = useState(defaultScheme)
  // Самбарыг НЭЭСЭН үеийн зам. Хуудас солигдонгуут өөрөө хаагдана —
  // effect-гүйгээр, шинэ хуудасны дээр өлгөөтэй үлдэхгүй.
  const [sheetPath, setSheetPath] = useState<string | null>(null)
  const pathname = usePathname()
  const sheetOpen = sheetPath === pathname

  const items = groups.flatMap((group) => group.items)
  const current = items.find((item) =>
    item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href),
  )

  const tabs = items.filter((item) => item.tab)
  const rest = items.filter((item) => !item.tab)
  const restActive = current !== undefined && !current.tab

  const toggleNav = () => {
    const next = !collapsed
    setCollapsed(next)
    remember(NAV_COOKIE, next ? '1' : '0')
  }

  const toggleScheme = () => {
    const next = scheme === 'dark' ? 'light' : 'dark'
    setScheme(next)
    remember(SCHEME_COOKIE, next)
  }

  return (
    <div
      className="admin-shell flex min-h-screen flex-1 bg-background text-foreground"
      data-scheme={scheme}
    >
      {/* ── Зүүн зурвас ────────────────────────────────────────────────── */}
      <aside
        /* Дэвсгэргүй — зурвасыг зөвхөн ШУГАМ тусгаарлана. Өөр өнгийн
           зурвас нь удирдлагыг «хоёр хэсэгтэй програм» мэт харагдуулдаг. */
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line transition-[width] duration-200 ease-out lg:flex ${
          collapsed ? 'w-[5rem] px-4' : 'w-[15.5rem] px-5'
        } py-5`}
      >
        {/* Лого нь нийтийн сайтынхтай ижил масthead — өнгөт дүрсэн товч биш.
            Хумигдсан үед зөвхөн эхний үсэг үлдэнэ. */}
        <Link
          href="/admin"
          className={`mb-6 flex h-10 items-center border-b border-line pb-6 transition-opacity duration-300 hover:opacity-60 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          {collapsed ? (
            <span className="wordmark text-foreground">TM</span>
          ) : (
            <span className="min-w-0 truncate">
              <span className="wordmark block">Twerk Mongolia</span>
              <span className="t-meta mt-1.5 block text-faint">Удирдлага</span>
            </span>
          )}
        </Link>

        <nav aria-label="Удирдлагын цэс" className="flex w-full flex-1 flex-col gap-4 overflow-y-auto">
          {groups.map((group, index) => (
            <div key={index} className="flex w-full flex-col gap-0.5">
              {/* Хумигдсан үед гарчиг багтахгүй тул зураасаар л бүлэглэнэ */}
              {group.label &&
                (collapsed ? (
                  index > 0 && <div className="mx-auto mb-2 h-px w-8 bg-line" />
                ) : (
                  <p className="t-label mb-2 px-2 text-faint">{group.label}</p>
                ))}
              {group.items.map((item) => (
                <RailLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  active={item === current}
                />
              ))}
            </div>
          ))}
        </nav>

        <button
          type="button"
          onClick={toggleNav}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Цэсийг дэлгэх' : 'Цэсийг хумих'}
          className={`t-meta mt-4 flex h-9 w-full items-center gap-2.5 border-t border-line pt-4 text-muted transition-colors hover:text-foreground ${
            collapsed ? 'justify-center' : 'px-2'
          }`}
        >
          <AdminIcon
            name="chevron"
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
              collapsed ? 'rotate-180' : ''
            }`}
          />
          {!collapsed && <span>Хумих</span>}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── Толгой мөр ──────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 border-b border-line bg-background/80 backdrop-blur-xl">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            {/* Утсан дээр толгой мөр = хуудасны нэр (апп шиг).
                Дэлгэцэн дээр хаана байгааг сануулах зам. */}
            <span className="t-h3 truncate lg:hidden">{current?.label ?? 'Удирдлага'}</span>
            <span className="t-label hidden items-center gap-2.5 text-faint lg:flex">
              Удирдлага
              <span aria-hidden="true">/</span>
              <span className="text-foreground">{current?.label ?? '—'}</span>
            </span>

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={toggleScheme}
                aria-label={scheme === 'dark' ? 'Гэрэлтэй горим' : 'Харанхуй горим'}
                title={scheme === 'dark' ? 'Гэрэлтэй горим' : 'Харанхуй горим'}
                className="icon-btn"
              >
                <AdminIcon name={scheme === 'dark' ? 'sun' : 'moon'} className="h-[18px] w-[18px]" />
              </button>

              <Link
                href="/mn"
                className="hidden h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] text-muted transition-colors hover:bg-surface-2 hover:text-foreground sm:flex"
              >
                Сайт руу
                <span aria-hidden="true" className="text-faint">
                  ↗
                </span>
              </Link>

              <div className="ml-1 flex items-center gap-2.5 border-l border-line pl-3">
                <span className="hidden text-right text-[13px] leading-tight sm:block">
                  <span className="block font-medium">{profile.name}</span>
                  <span className="block text-[11px] text-muted">{profile.role}</span>
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line-strong text-xs font-semibold">
                  {profile.name.slice(0, 1).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-8">
          {/* Доод тааз агуулгыг дарахгүйн тулд зай үлдээнэ */}
          <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-5 pb-24 sm:gap-6 lg:pb-0">
            {children}
          </div>
        </main>
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
              restActive || sheetOpen ? 'text-foreground' : 'text-muted'
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
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line-strong text-sm font-semibold">
                {profile.name.slice(0, 1).toUpperCase()}
              </span>
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
                  className={`flex h-12 items-center gap-3 rounded-lg px-3 text-[15px] transition-colors ${
                    item === current
                      ? 'font-medium text-foreground'
                      : 'text-foreground active:bg-surface-2'
                  }`}
                >
                  <AdminIcon name={item.icon} className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              ))}

              <button
                type="button"
                onClick={toggleScheme}
                className="flex h-12 items-center gap-3 rounded-lg px-3 text-[15px] text-foreground transition-colors active:bg-surface-2"
              >
                <AdminIcon name={scheme === 'dark' ? 'sun' : 'moon'} className="h-5 w-5 shrink-0" />
                {scheme === 'dark' ? 'Гэрэлтэй горим' : 'Харанхуй горим'}
              </button>

              <Link
                href="/mn"
                className="flex h-12 items-center gap-3 rounded-lg px-3 text-[15px] text-foreground transition-colors active:bg-surface-2"
              >
                <AdminIcon name="globe" className="h-5 w-5 shrink-0" />
                Сайт руу
                <span aria-hidden="true" className="ml-auto text-faint">
                  ↗
                </span>
              </Link>
            </div>
          </div>
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
        active ? 'text-foreground' : 'text-muted'
      }`}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute top-0 h-[2px] w-8 bg-foreground"
        />
      )}
      <AdminIcon name={item.icon} className="h-[22px] w-[22px]" />
      <span className="max-w-full truncate text-[10px] leading-none font-medium">
        {item.short ?? item.label}
      </span>
    </Link>
  )
}

function RailLink({
  item,
  collapsed,
  active,
}: {
  item: NavItem
  collapsed: boolean
  active: boolean
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      className={`relative flex h-9 items-center gap-2.5 rounded-lg text-[13px] whitespace-nowrap transition-colors ${
        collapsed ? 'w-10 justify-center self-center' : 'px-2.5'
      } ${
        // Дүүрэн ногоон товч цэс бүрд давтагдвал нүд ядрана — идэвхтэйг
        // бүдэг дэвсгэр + брэндийн өнгөт бичиг + зүүн зураасаар заана.
        active
          ? 'font-medium text-foreground'
          : 'text-foreground-soft hover:bg-surface-2 hover:text-foreground'
      }`}
    >
      {active && !collapsed && (
        <span
          aria-hidden="true"
          className="absolute top-1.5 bottom-1.5 -left-5 w-[2px] bg-foreground"
        />
      )}
      <AdminIcon name={item.icon} className="h-[17px] w-[17px] shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )
}
