'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { AdminIcon, type NavIcon } from './AdminIcon'

export type NavItem = { href: string; label: string; icon: NavIcon }
export type NavGroup = NavItem[]

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
  const pathname = usePathname()

  const current = groups.flat().find((item) =>
    item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href),
  )

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
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200 ease-out lg:flex ${
          collapsed ? 'w-[4.5rem] items-center px-3' : 'w-60 px-4'
        } py-4`}
      >
        <Link
          href="/admin"
          className={`mb-5 flex h-10 items-center gap-2.5 rounded-xl transition-opacity hover:opacity-70 ${
            collapsed ? 'justify-center' : 'px-1'
          }`}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-brand-ink">
            <AdminIcon name="dashboard" className="h-[18px] w-[18px]" />
          </span>
          {!collapsed && (
            <span className="font-display text-sm font-bold tracking-[-0.03em] whitespace-nowrap">
              Twerk Mongolia
            </span>
          )}
        </Link>

        <nav aria-label="Удирдлагын цэс" className="flex w-full flex-1 flex-col gap-0.5">
          {groups.map((group, index) => (
            <div key={index} className="flex w-full flex-col gap-0.5">
              {index > 0 && <div className="my-2 h-px w-full bg-line" />}
              {group.map((item) => (
                <RailLink key={item.href} item={item} collapsed={collapsed} active={item === current} />
              ))}
            </div>
          ))}
        </nav>

        <button
          type="button"
          onClick={toggleNav}
          aria-expanded={!collapsed}
          className={`mt-3 flex h-10 w-full items-center gap-2.5 rounded-xl text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground ${
            collapsed ? 'justify-center' : 'px-3'
          }`}
        >
          <AdminIcon
            name="chevron"
            className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 ${
              collapsed ? 'rotate-180' : ''
            }`}
          />
          {!collapsed && <span>Хумих</span>}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── Толгой мөр ──────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <span className="font-display text-sm font-bold tracking-[-0.02em] whitespace-nowrap lg:hidden">
              Twerk&nbsp;Mongolia
            </span>
            <span className="hidden text-sm font-semibold lg:inline">{current?.label ?? 'Удирдлага'}</span>

            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleScheme}
                aria-label="Өнгөний горим"
                title="Өнгөний горим"
                className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <AdminIcon name={scheme === 'dark' ? 'sun' : 'moon'} className="h-[18px] w-[18px]" />
              </button>

              <Link
                href="/mn"
                className="hidden h-9 items-center gap-1.5 rounded-full border border-line-strong px-3.5 text-sm text-foreground-soft transition-colors hover:border-foreground hover:text-foreground sm:flex"
              >
                Сайт руу
                <span aria-hidden="true">↗</span>
              </Link>

              <div className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pr-1 pl-3">
                <span className="hidden text-sm sm:inline">{profile.name}</span>
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold tracking-wide text-brand uppercase">
                  {profile.role}
                </span>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-xs font-bold text-brand-ink">
                  {profile.name.slice(0, 1).toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Гар утсанд зурвасын оронд хэвтээ тууз */}
          <div className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
            {groups.flat().map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item === current ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
                  item === current
                    ? 'bg-brand text-brand-ink'
                    : 'text-muted hover:bg-surface-2 hover:text-foreground'
                }`}
              >
                <AdminIcon name={item.icon} className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
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
      className={`flex h-10 items-center gap-2.5 rounded-xl text-sm whitespace-nowrap transition-colors ${
        collapsed ? 'w-10 justify-center' : 'px-3'
      } ${
        active
          ? 'bg-brand font-semibold text-brand-ink'
          : 'text-muted hover:bg-surface-2 hover:text-foreground'
      }`}
    >
      <AdminIcon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && item.label}
    </Link>
  )
}
