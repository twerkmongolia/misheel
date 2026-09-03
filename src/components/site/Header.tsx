import Link from 'next/link'
import { getDictionary, type Locale } from '@/lib/i18n'
import { getProfile } from '@/lib/auth/dal'
import { cartCount } from '@/lib/cart'
import { logout } from '@/actions/auth'
import { LocaleSwitch } from './LocaleSwitch'
import { ThemeToggle } from './ThemeToggle'
import { NavLink } from './NavLink'
import { HeaderShell } from './HeaderShell'
import { MobileMenu } from './MobileMenu'
import { BottomNav } from './BottomNav'
import { ContactTrigger } from './ContactDialog'

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

  /* Ширээний компьютерын гол цэс — таван зүйл. «Холбоо барих» энд БАЙХГҮЙ:
     тэр нь хуудас нээдэггүй, цонх нээдэг тул холбоос биш товч (доор).

     ── Яагаад ХОЁР ангийн цэг вэ ──────────────────────────────────────
     Студи хоёр л зүйл зардаг: заалдаа ирж сурах, эсвэл гэрээсээ сурах.
     Хүн сайт нээхдээ аль хэдийн аль нэгийг нь шийдсэн байдаг — «Анги,
     курс» гэсэн нэг цэг нь тэр шийдвэрийг хүлээн авахын оронд дахин нэг
     хуудас, дахин нэг шүүлтүүр дамжуулна.

     Хоёр цэг нь мөн САНАЛ БОЛГОЖ байгаа зүйлээ навбар дээрээ бичнэ:
     онлайн анги байдгийг мэдэхгүй хүн түүнийг хайхгүй.

     Хуваарь (нэг удаагийн хичээл) энд БАЙХГҮЙ: тэр нь аль хэдийн ирж
     байгаа хүний хэрэгсэл, шинэ хүний сонголт биш. Гар утасны доод тааз,
     хөл, нүүр хуудсанд хэвээр. */
  const primary = [
    { href: `/${locale}`, label: t.nav.home },
    { href: `/${locale}/courses?mode=studio`, label: t.nav.studioCourses },
    { href: `/${locale}/courses?mode=online`, label: t.nav.onlineCourses },
    { href: `/${locale}/shop`, label: t.nav.shop },
    { href: `/${locale}/about`, label: t.nav.about },
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
    { href: `/${locale}/courses?mode=studio`, label: t.nav.studioCourses },
    { href: `/${locale}/courses?mode=online`, label: t.nav.onlineCourses },
    { href: `/${locale}/classes`, label: t.nav.classes },
    { href: `/${locale}/instructors`, label: t.nav.instructors },
  ]

  const menuSecondary = [{ href: `/${locale}/faq`, label: t.nav.faq }]

  return (
    <>
      <HeaderShell>
        {/* Өндөр нь `.header-bar` -аас: дээд талд 5rem, гүйлгэсний дараа
            4rem болж хумирна (§ globals.css). */}
        <div className="shell header-bar flex items-center gap-8">
          {/* ── Лого ────────────────────────────────────────────────────
              Дүрсгүй: нэр өөрөө тэмдэг болно — хажууд нь дүрс тавих нь тэр
              эрчийг сулруулна. Нарийссан том үсэг (§ globals.css
              `.wordmark`) нь урт нэрийг навбарын багахан зайд багтаана.

              Өмнө нь хажууд нь «| УБ» гэсэн хотын шошго байв. Хасагдсан:
              лого нь хамгийн эхэнд уншигддаг тул хамгийн ЦЭВЭР байх ёстой,
              мөн хот нь хөл, холбоо барих хуудсанд аль хэдийн бичигдсэн —
              навбар дээр давтагдах шаардлагагүй. */}
          <Link
            href={`/${locale}`}
            className="wordmark shrink-0 whitespace-nowrap transition-opacity duration-300 hover:opacity-60"
          >
            Twerk Mongolia
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-8 lg:flex xl:gap-10">
            {primary.map((item) => (
              <NavLink key={item.href} href={item.href} className="nav-item">
                {item.label}
              </NavLink>
            ))}

            {/* Бусад мөртэй ЯГ ижил төрхтэй — хэрэглэгчид «энэ бол өөр
                төрлийн зүйл» гэсэн дохио өгөх шаардлагагүй. Ялгаа нь зөвхөн
                дарсны дараа мэдэгдэнэ: хуудас солигдохгүй, цонх нээгдэнэ. */}
            <ContactTrigger className="nav-item">{t.nav.contact}</ContactTrigger>
          </nav>

          {/* ── Хэрэгсэл ───────────────────────────────────────────────── */}
          {/* ── Хэрэгсэл ────────────────────────────────────────────────
              Гурван бүлэг, хоёр зураасаар зааглагдана: ХЭЛ · САГС · БҮРТГЭЛ.
              Зураасгүй бол зургаан жижиг элемент нэг урт эгнээ болж, аль нь
              алинтайгаа холбоотойг нүд ялгаж чадахгүй. */}
          <div className="ml-auto hidden items-center gap-1 lg:ml-0 lg:flex">
            <LocaleSwitch current={locale} label={t.nav.language} />

            <span aria-hidden className="mx-3 h-5 w-px bg-line" />

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

            <span aria-hidden className="mx-3 h-5 w-px bg-line" />

            {profile ? (
              <div className="flex items-center gap-5">
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
              <Link href={`/${locale}/login`} className="btn btn-solid btn-sm">
                {t.nav.login}
              </Link>
            )}
          </div>

          {/* Гар утсанд — зөвхөн сагс. Үлдсэн навигаци доод самбарт байна. */}
          <div className="ml-auto flex items-center lg:hidden">
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
          </div>
        </div>
      </HeaderShell>

      <BottomNav
        tabs={tabs}
        menu={
          <MobileMenu
            label={t.nav.menu}
            contactLabel={t.nav.contact}
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
                  <LocaleSwitch current={locale} label={t.nav.language} placement="up" />
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
