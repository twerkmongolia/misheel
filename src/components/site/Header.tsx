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

/**
 * Сайтын толгой — сэтгүүлийн масthead шиг.
 *
 * Гурван бүс, тэгш хэмтэй БИШ: зүүнд лого, голд навигаци, баруунд хэрэгсэл.
 * Голын навигаци нь бөмбөлгөн товчны эгнээ биш, ЗҮГЭЭР Л ТЕКСТ — идэвхтэйг
 * доогуур зураас заана. Хайрцаг арилахаар навбар хөнгөрч, доорх агуулга
 * навбарыг дамжин үргэлжилдэг мэт болно.
 */
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

  return (
    <>
      <HeaderShell>
        <div className="shell flex h-20 items-center gap-8">
          {/* ── Лого ────────────────────────────────────────────────────
              Дүрсгүй: нэр өөрөө тэмдэг болно — хажууд нь дүрс тавих нь тэр
              эрчийг сулруулна. Үсэг нь grotesque, том үсэг, өргөн зайтай
              (§ globals.css `.wordmark`) — 17px дээр Didone ажиллахгүй. */}
          <Link
            href={`/${locale}`}
            className="group flex shrink-0 items-baseline gap-2.5 whitespace-nowrap"
          >
            <span className="wordmark transition-opacity duration-300 group-hover:opacity-60">
              Twerk Mongolia
            </span>
            {/* Хотын шошго — масthead -ийн дэд гарчиг. Зөвхөн өргөн дэлгэцэд:
                нарийн дэлгэцэд лого өөрөө хангалттай. */}
            <span aria-hidden className="hidden items-center gap-2.5 xl:flex">
              <span className="h-3 w-px bg-line-strong" />
              <span className="t-label text-faint">УБ</span>
            </span>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-9 lg:flex">
            {primary.map((item) => (
              <NavLink key={item.href} href={item.href} className="nav-item t-small">
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* ── Хэрэгсэл ───────────────────────────────────────────────── */}
          <div className="ml-auto hidden items-center gap-2 lg:ml-0 lg:flex">
            <ThemeToggle label={t.nav.theme} />
            <LocaleSwitch current={locale} />

            <span aria-hidden className="mx-2 h-4 w-px bg-line" />

            <NavLink
              href={`/${locale}/cart`}
              className="icon-btn relative"
              aria-label={t.nav.cart}
            >
              <CartIcon />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[10px] leading-none font-bold text-background tabular-nums">
                  {count}
                </span>
              )}
            </NavLink>

            {profile ? (
              <div className="flex items-center gap-4 pl-1">
                {staff && (
                  <Link href="/admin" className="lnk t-small text-muted hover:text-foreground">
                    {t.nav.admin}
                  </Link>
                )}
                <NavLink href={`/${locale}/account`} className="lnk t-small hover:text-foreground">
                  {t.nav.account}
                </NavLink>
                <form action={logout}>
                  <input type="hidden" name="locale" value={locale} />
                  <button type="submit" className="lnk t-small text-muted hover:text-foreground">
                    {t.nav.logout}
                  </button>
                </form>
              </div>
            ) : (
              <Link href={`/${locale}/login`} className="btn btn-solid btn-sm ml-1">
                {t.nav.login}
              </Link>
            )}
          </div>

          {/* Гар утсанд — сагс, горим. Үлдсэн навигаци доод самбарт байна. */}
          <div className="ml-auto flex items-center gap-1 lg:hidden">
            <Link
              href={`/${locale}/cart`}
              aria-label={t.nav.cart}
              className="icon-btn relative h-11 w-11"
            >
              <CartIcon />
              {count > 0 && (
                <span className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[10px] leading-none font-bold text-background tabular-nums">
                  {count}
                </span>
              )}
            </Link>

            <ThemeToggle label={t.nav.theme} className="h-11 w-11" />
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
                    <Link href={`/${locale}/account`} className="btn btn-solid w-full">
                      {t.nav.account}
                    </Link>
                    {staff && (
                      <Link href="/admin" className="btn btn-line w-full">
                        {t.nav.admin}
                      </Link>
                    )}
                    <form action={logout} className="contents">
                      <input type="hidden" name="locale" value={locale} />
                      <button type="submit" className="btn btn-bare w-full">
                        {t.nav.logout}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href={`/${locale}/login`} className="btn btn-solid w-full">
                      {t.nav.login}
                    </Link>
                    <Link href={`/${locale}/signup`} className="btn btn-line w-full">
                      {t.nav.signup}
                    </Link>
                  </>
                )}

                <div className="flex justify-center pt-2">
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

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <path d="M3 4.5h2.4l2.2 10.5h9.6l2-7.4H6.3" />
      <path d="M9 18.6h.01M16.4 18.6h.01" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
