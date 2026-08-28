import Link from 'next/link'
import { getDictionary, type Locale } from '@/lib/i18n'
import { getProfile } from '@/lib/auth/dal'
import { cartCount } from '@/lib/cart'
import { logout } from '@/actions/auth'
import { LocaleSwitch } from './LocaleSwitch'
import { NavLink } from './NavLink'
import { HeaderShell } from './HeaderShell'
import { MobileMenu } from './MobileMenu'
import { BottomNav } from './BottomNav'
import { ThemeToggle } from './ThemeToggle'

export async function Header({ locale }: { locale: Locale }) {
  const t = getDictionary(locale)
  const [profile, count] = await Promise.all([getProfile(), cartCount()])
  const staff = profile?.role === 'staff' || profile?.role === 'admin'

  // Ширээний компьютерын гол цэс — таван зүйл.
  const primary = [
    { href: `/${locale}`, label: t.nav.home },
    { href: `/${locale}/schedule`, label: t.nav.booking },
    { href: `/${locale}/shop`, label: t.nav.shop },
    { href: `/${locale}/about`, label: t.nav.about },
    { href: `/${locale}/contact`, label: t.nav.contact },
  ]

  // Гар утасны доод самбар — хамгийн олон дардаг дөрөв + цэс.
  // Сагс энд БИШ дээд мөрөнд: тоолуур нь шинэчлэгдэхийг харах хэрэгтэй бөгөөд
  // дэлгүүрийн урсгалд байнга дардаг зүйл биш.
  const tabs = [
    { href: `/${locale}`, label: t.nav.home, icon: 'home' as const },
    { href: `/${locale}/schedule`, label: t.nav.booking, icon: 'calendar' as const },
    { href: `/${locale}/shop`, label: t.nav.shop, icon: 'bag' as const },
    // Табанд богино нэр — «Бидний тухай» хоёр мөр болж самбарыг өндөрсгөнө.
    { href: `/${locale}/about`, label: t.nav.aboutShort, icon: 'star' as const },
  ]

  // Цэс нь табанд БАЙХГҮЙ зүйлсийг агуулна — давхардуулбал хэрэглэгч
  // «энэ хоёр өөр газар өөр өөр юм уу?» гэж эргэлзэнэ.
  const menuPrimary = [
    { href: `/${locale}/classes`, label: t.nav.classes },
    { href: `/${locale}/instructors`, label: t.nav.instructors },
    { href: `/${locale}/contact`, label: t.nav.contact },
  ]

  const menuSecondary = [
    { href: `/${locale}/gallery`, label: t.nav.gallery },
    { href: `/${locale}/faq`, label: t.nav.faq },
  ]

  const linkClass = 'rounded-full px-4 py-2 text-sm transition-colors'
  const sheetButton =
    'flex h-12 items-center justify-center rounded-full px-5 text-[15px] font-semibold transition-colors'

  return (
    <>
      <HeaderShell>
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-5">
          <Link
            href={`/${locale}`}
            className="font-display text-base font-bold tracking-[-0.045em] whitespace-nowrap transition-opacity hover:opacity-70"
          >
            Twerk Mongolia
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-0.5 lg:flex">
            {primary.map((item) => (
              <NavLink key={item.href} href={item.href} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Дэлгэц өргөн үед — бүх зүйл мөрөндөө багтана */}
          <div className="ml-auto hidden items-center gap-1.5 lg:ml-0 lg:flex">
            <ThemeToggle label={t.nav.theme} className="h-9 w-9" />
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
              <div className="flex items-center gap-1.5">
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

          {/* Гар утсанд — сагс, горим. Үлдсэн навигаци доод самбарт байна. */}
          <div className="ml-auto flex items-center lg:hidden">
            <Link
              href={`/${locale}/cart`}
              aria-label={t.nav.cart}
              className="relative grid h-11 w-11 place-items-center rounded-full text-foreground transition-colors hover:bg-surface-2"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[22px] w-[22px]"
                aria-hidden="true"
              >
                <path d="M3 4.5h2.2l2.3 10.6h9.4l2.1-7.6H6.4" />
                <circle cx="9.5" cy="19" r="1.4" />
                <circle cx="16.5" cy="19" r="1.4" />
              </svg>
              {count > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background tabular-nums">
                  {count}
                </span>
              )}
            </Link>

            <ThemeToggle label={t.nav.theme} />
          </div>
        </div>
      </HeaderShell>

      <BottomNav
        tabs={tabs}
        menu={
          <MobileMenu
            label={t.nav.menu}
            primary={menuPrimary}
            secondary={menuSecondary}
            footer={
              <>
                {profile ? (
                  <>
                    <Link
                      href={`/${locale}/account`}
                      className={`${sheetButton} bg-button text-button-ink`}
                    >
                      {t.nav.account}
                    </Link>
                    {staff && (
                      <Link
                        href="/admin"
                        className={`${sheetButton} border border-line-strong text-foreground-soft`}
                      >
                        {t.nav.admin}
                      </Link>
                    )}
                    <form action={logout} className="contents">
                      <input type="hidden" name="locale" value={locale} />
                      <button type="submit" className={`${sheetButton} text-muted`}>
                        {t.nav.logout}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/${locale}/login`}
                      className={`${sheetButton} bg-button text-button-ink`}
                    >
                      {t.nav.login}
                    </Link>
                    <Link
                      href={`/${locale}/signup`}
                      className={`${sheetButton} border border-line-strong text-foreground-soft`}
                    >
                      {t.nav.signup}
                    </Link>
                  </>
                )}

                <div className="flex justify-center pt-1">
                  <LocaleSwitch current={locale} />
                </div>
              </>
            }
          />
        }
      />
    </>
  )
}
