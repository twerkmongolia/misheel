import Link from 'next/link'
import { getDictionary, type Locale } from '@/lib/i18n'
import { getProfile } from '@/lib/auth/dal'
import { cartCount } from '@/lib/cart'
import { logout } from '@/actions/auth'
import { LocaleSwitch } from './LocaleSwitch'
import { NavLink } from './NavLink'

export async function Header({ locale }: { locale: Locale }) {
  const t = getDictionary(locale)
  const [profile, count] = await Promise.all([getProfile(), cartCount()])
  const staff = profile?.role === 'staff' || profile?.role === 'admin'

  // Гол цэс — таван зүйл. Хичээлийн төрөл, багш нарын хуудсууд хэвээр
  // байгаа бөгөөд нүүр хуудас болон footer-оос хандана.
  const nav = [
    { href: `/${locale}`, label: t.nav.home },
    { href: `/${locale}/schedule`, label: t.nav.booking },
    { href: `/${locale}/shop`, label: t.nav.shop },
    { href: `/${locale}/about`, label: t.nav.about },
    { href: `/${locale}/contact`, label: t.nav.contact },
  ]

  const linkClass = 'rounded-full px-4 py-2 text-sm transition-colors'

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-5 py-4">
        <Link
          href={`/${locale}`}
          className="font-display text-base font-bold tracking-[-0.045em] whitespace-nowrap transition-opacity hover:opacity-70"
        >
          Twerk Mongolia
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-0.5 lg:flex">
          {nav.map((item) => (
            <NavLink key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
          <LocaleSwitch current={locale} />

          <NavLink href={`/${locale}/cart`} className={`${linkClass} flex items-center gap-1.5`}>
            {t.nav.cart}
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-bold text-background tabular-nums">
                {count}
              </span>
            )}
          </NavLink>

          {profile ? (
            <div className="hidden items-center gap-1.5 sm:flex">
              {staff && (
                <Link
                  href="/admin"
                  className="rounded-full border border-line-strong px-4 py-1.5 text-sm text-foreground-soft transition-colors hover:border-foreground hover:text-foreground"
                >
                  {t.nav.admin}
                </Link>
              )}
              <NavLink href={`/${locale}/account`} className={linkClass}>
                {t.nav.account}
              </NavLink>
              <form action={logout}>
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className={`${linkClass} text-muted hover:bg-surface-2 hover:text-foreground`}
                >
                  {t.nav.logout}
                </button>
              </form>
            </div>
          ) : (
            <Link
              href={`/${locale}/login`}
              className="rounded-full bg-button px-5 py-2 text-sm font-semibold text-button-ink transition-all hover:brightness-90"
            >
              {t.nav.login}
            </Link>
          )}
        </div>
      </div>

      {/* Гар утасны цэс — JavaScript шаардахгүй */}
      <details className="border-t border-line/70 lg:hidden">
        <summary className="cursor-pointer list-none px-5 py-3 text-sm text-muted marker:content-none">
          {t.nav.menu}
        </summary>
        <nav className="grid grid-cols-2 gap-1 px-3 pb-4">
          {nav.map((item) => (
            <NavLink key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
          {profile && (
            <>
              <NavLink href={`/${locale}/account`} className={linkClass}>
                {t.nav.account}
              </NavLink>
              {staff && (
                <Link href="/admin" className={`${linkClass} text-foreground-soft`}>
                  {t.nav.admin}
                </Link>
              )}
            </>
          )}
        </nav>
      </details>
    </header>
  )
}
