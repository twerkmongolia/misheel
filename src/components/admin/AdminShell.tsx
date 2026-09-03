'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { logout } from '@/actions/auth'
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

/** `undefined` = сонголт хийгээгүй → үйлдлийн системийг дагана. */
export type AdminTheme = 'light' | 'dark' | undefined

const THEME_COOKIE = 'tm_admin_theme'

function remember(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
}

/**
 * Удирдлагын бүрхүүл — зүүн тал дүрсний зурвас, дээр толгой мөр.
 *
 * ── Зурвас нь ХУЛГАНА хүрэхэд нээгдэнэ ─────────────────────────────────
 * Тайван үедээ 5rem — зөвхөн дүрс. Хулгана хүрмэгц 15.5rem болж нэрсээ
 * дэлгэнэ, холдмогц буцаж хумирна.
 *
 * Өмнө нь энд ГАРААР дардаг «Хумих» товч байсан бөгөөд сонголт нь cookie-д
 * хадгалагддаг байв. Хасагдав: тэр нь ажилтнаас ШИЙДВЭР шаарддаг байсан —
 * «өргөн зурвас нэртэйгээ, эсвэл нарийн зурвас илүү ажлын талбайтай» гэсэн
 * хоёрын аль нэгийг сонгож, дараа нь харамсах. Хулгана хүрэхэд нээгддэг
 * зурвас нь хоёуланг нь өгнө: ажиллах үедээ нарийн, хайх үедээ өргөн.
 *
 * ── Яагаад агуулгыг ТҮЛХЭХГҮЙ вэ ───────────────────────────────────────
 * Дэлгэсэн самбар нь агуулгын ДЭЭГҮҮР хөвнө. Урьд нь зурвас өргөсөхөд
 * хуудас баруун тийш шахагддаг байсан — тэр нь дарж нээдэг товчид зүгээр,
 * харин хулганы хөдөлгөөнд уягдвал хүснэгт, багана бүр хулгана зүүн ирмэг
 * дайрах болгонд дахин эвхэгдэнэ. Хөвсөн самбар нь зохиомжийг огт
 * хөндөхгүй: доорх хуудас байрандаа зогсоно.
 *
 * Гар ашиглагчид ч мөн адил: `focus` зурвас руу ормогц дэлгэгдэнэ.
 */
export function AdminShell({
  groups,
  profile,
  defaultTheme,
  children,
}: {
  groups: NavGroup[]
  profile: { name: string; role: string }
  /** Cookie-оос уншсан сонголт. Байхгүй бол системийн тохиргоо ажиллана. */
  defaultTheme: AdminTheme
  children: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const collapsed = !expanded

  const [theme, setTheme] = useState<AdminTheme>(defaultTheme)

  /**
   * Горим солих.
   *
   * Сервер нь үйлдлийн системийн тохиргоог МЭДЭХГҮЙ тул `theme` нь
   * `undefined` байх боломжтой — тэр үед одоо ЯМАР горим зурагдаж байгааг
   * хөтчөөс асууна. Ингэснээр товч үргэлж «одоогийнхны эсрэг» рүү үсэрнэ:
   * гэрэлтэй харагдаж байвал харанхуй болно, эсрэгээр нь ч мөн адил.
   *
   * Уншилт нь ЗӨВХӨН дарсан агшинд болно — render дотор биш. Тиймээс
   * сервер ба хөтчийн эхний зураг зөрөхгүй (hydration).
   */
  const flipTheme = () => {
    const shown =
      theme ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    const next = shown === 'light' ? 'dark' : 'light'
    setTheme(next)
    remember(THEME_COOKIE, next)
  }
  // Самбарыг НЭЭСЭН үеийн зам. Хуудас солигдонгуут өөрөө хаагдана —
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

  return (
    <div
      data-theme={theme}
      className="admin-shell flex min-h-screen flex-1 bg-background text-foreground"
    >
      {/* ── Зүүн зурвас ────────────────────────────────────────────────── */}
      {/* Гадна бүрхүүл нь зохиомжид ҮРГЭЛЖ 5rem эзэлнэ — дотоод самбар нь
          үүнээс өргөсөхдөө агуулгын дээгүүр гарна, хуудсыг түлхэхгүй.
          `z-40` нь толгой мөрнөөс (z-30) дээгүүр байх ёстой: дэлгэгдсэн
          самбар түүний зүүн захыг халхална. */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onFocus={() => setExpanded(true)}
        /* `relatedTarget` нь фокус ОЧИЖ буй элемент. Зурвасын дотор үлдсэн
           бол хумихгүй — эс бөгөөс Tab дарах бүрд самбар анивчина. */
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false)
        }}
        className="sticky top-0 z-40 hidden h-screen w-[5rem] shrink-0 lg:block"
      >
        {/* ── Дотоод самбар ──────────────────────────────────────────
            Хумигдсан үедээ дэвсгэргүй — зурвасыг зөвхөн ШУГАМ тусгаарлана.
            Дэлгэгдэхэд л нэг шат гэрэлтэж сүүдэр авна: тэр мөчид энэ нь
            зохиомжийн хэсэг биш, ХӨВЖ буй самбар болно.

            ⚠️ Хажуугийн зай нь ХОЁР төлөвт ИЖИЛ (`px-3`). Өмнө нь 1rem →
            1.25rem болж хамт хөдөлдөг байсан бөгөөд үр дүнд нь дүрс бүр
            дэлгэгдэх бүрд 4px хажуу тийш гулсдаг байв. Зурвас нээгдэхэд
            НЭР нь гарч ирэх ёстой, дүрс нь хөдлөх ёсгүй — хөдөлгөөнгүй
            дүрс нь нүдэнд тогтвортой тулгуур үлдээнэ.

            `overflow-hidden` нь нэрсийг самбарын ирмэгээр тайрна: нэр нь
            гарч ирэхдээ өргөнөө тэлэхгүй, зүгээр л ил гарна. */}
        <div
          className={`flex h-full flex-col overflow-hidden border-r border-line px-3 py-4 transition-[width,background-color,box-shadow] duration-200 ease-out ${
            collapsed
              ? 'w-[5rem] bg-background'
              : 'w-[15.5rem] bg-surface shadow-[var(--shadow-pop)]'
          }`}
        >
          {/* ── Лого ─────────────────────────────────────────────────────
              Хоёр хэсэгтэй: ТЭМДЭГ + нэр. Тэмдэг нь дүрсний баганад суудаг
              тул хумигдсан үед зурвасын яг голд, дэлгэгдсэн үед нэрийнхээ
              хажууд — хөдлөхгүй.

              Нийтийн сайт дээр «нэр өөрөө тэмдэг» гэсэн дүрэмтэй (тэнд
              зурвас гэж байхгүй, лого нь мөрийн эхэнд бүтнээрээ суудаг).
              80px өргөнтэй зурваст тэр дүрэм ажиллахгүй: «TWERK MONGOLIA»
              багтахгүй, зөвхөн «TM» үлдэх ба тэр нь задгай хоёр үсэг болж
              унших зүйл мэт харагдана. Дүүрсэн хавтан нь түүнийг ТЭМДЭГ
              болгож ялгана — зурвас дахь цорын ганц дүүрсэн биет. */}
          <Link
            href="/admin"
            /* `-mx-3 px-3` нь доод зураасыг самбарын ирмэгээс ирмэг хүртэл
               татна. Агуулгын өргөнөөр зурвал хумигдсан үед 56px-ийн
               богино зураас болж, тасарсан мэт харагдана. */
            className="-mx-3 mb-3 flex h-12 shrink-0 items-center border-b border-line px-3 pb-4 transition-opacity duration-300 hover:opacity-70"
          >
            <span className="grid w-14 shrink-0 place-items-center">
              {/* `.wordmark` анги ЗОРИУД хэрэглээгүй: тэр нь давхаргагүй CSS
                  тул Tailwind-ийн `text-*` утилитыг дардаг бөгөөд хавтан
                  1.3rem үсгээр дүүрч халина. Энд бүх зүйл утилитээр —
                  нэг давхаргад, зөрчилгүй. */}
              <span className="font-display grid h-8 w-8 place-items-center rounded-lg bg-foreground text-[0.8rem] leading-none font-bold tracking-[0.02em] text-background uppercase">
                TM
              </span>
            </span>
            <span
              className={`min-w-0 leading-tight transition-opacity duration-200 ${
                collapsed ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <span className="font-display block truncate text-[1.05rem] leading-none font-bold tracking-[0.02em] uppercase">
                Twerk Mongolia
              </span>
              <span className="t-meta mt-0.5 block text-faint">Удирдлага</span>
            </span>
          </Link>

          {/* Бүлгийн гарчиг нь хумигдсан үед ч ЗАЙГАА эзэлсээр байна —
              зөвхөн харагдахаа болино. Ингэснээр зурвас нээгдэхэд мөрүүд
              босоо тэнхлэгээрээ огт хөдлөхгүй: зөвхөн өргөн, зөвхөн
              тунгалагшилт өөрчлөгдөнө. Өмнө нь гарчиг нь богино зураасаар
              солигддог байсан тул мөр бүр дээш доош үсэрдэг байв. */}
          {/* `-mx-3 px-3` нь ЗААВАЛ. `overflow-y-auto` нь хэвтээ тэнхлэгээр ч
              тайрдаг (CSS: нэг тэнхлэг `visible` биш бол нөгөө нь `auto`
              болно) — тиймээс идэвхтэй мөрийн `-left-3` зураас энэ савны
              гадна үлдэж, тайрагдана. Сав нь самбарын БҮТЭН өргөнийг эзэлж,
              дотоод зайг нь өөрөө буцаан өгснөөр зураас багтана. */}
          <nav
            aria-label="Удирдлагын цэс"
            className="-mx-3 flex w-auto flex-1 flex-col gap-4 overflow-y-auto px-3"
          >
            {groups.map((group, index) => (
              <div key={index} className="flex w-full flex-col gap-0.5">
                {group.label && (
                  <p
                    /* Мөрийн НЭРСТЭЙ нэг босоо шугамаас эхэлнэ (pl-14 =
                       дүрсний баганын өргөн). Дүрснүүд захад унжиж, текст
                       нь цэвэр багана үүсгэнэ. */
                    className={`t-label mb-1.5 pl-14 text-faint transition-opacity duration-200 ${
                      collapsed ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    {group.label}
                  </p>
                )}
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
        </div>
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

            {/* Баруун булан = ХЭН нэвтэрсэн, тэгээд ГАРАХ. Өмнө нь энд
                «Сайт руу ↗» гэсэн холбоос байсан — хасагдав: зүүн дээд
                булангийн лого аль хэдийн нийтийн сайт руу хөтөлдөг тул тэр
                нь давхардал байсан бөгөөд ажилтны хамгийн их хайдаг зүйл
                болох гарах товчны байрыг эзэлж байв. */}
            <div className="ml-auto flex items-center gap-1">
              <div className="flex items-center gap-2.5">
                <span className="hidden text-right text-[13px] leading-tight sm:block">
                  <span className="block font-medium">{profile.name}</span>
                  <span className="block text-[11px] text-muted">{profile.role}</span>
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line-strong text-xs font-semibold">
                  {profile.name.slice(0, 1).toUpperCase()}
                </span>
              </div>

              {/* Хэн нэвтэрсэн бэ / орчны тохиргоо — хоёр өөр төрлийн зүйл
                  тул зураасаар зааглагдана. */}
              <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />

              {/* Дүрс нь ОДОО харагдаж буй горимыг заана (нар = гэрэлтэй).
                  Хоёулаа зурагдаад аль нэг нь CSS-ээр нуугддаг — сервер нь
                  системийн тохиргоог мэдэхгүй тул JS-ээр сонговол эхний
                  зурагт буруу дүрс анивчина (§ globals.css `.theme-sun`). */}
              <button
                type="button"
                onClick={flipTheme}
                aria-label="Гэрэлтэй / харанхуй горим солих"
                title="Гэрэлтэй / харанхуй горим солих"
                className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <AdminIcon name="sun" className="theme-sun h-4 w-4" />
                <AdminIcon name="moon" className="theme-moon h-4 w-4" />
              </button>

              {/* Гарах нь хэнийхээ хажууд зогсоно: «энэ бол ТА, эндээс
                  гарна». Утсан дээр зөвхөн дүрс — нэр, эрх аль хэдийн
                  нуугдсан бөгөөд бүтэн цэс нь доод таазны самбарт байна. */}
              <form action={logout}>
                {/* Удирдлага зөвхөн монголоор ажилладаг тул гарсны дараа
                    `/mn` руу буцна (§ actions/auth.ts `localeFrom`). */}
                <input type="hidden" name="locale" value="mn" />
                <button
                  type="submit"
                  className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-muted transition-colors hover:bg-surface-2 hover:text-foreground sm:px-3"
                >
                  <AdminIcon name="logout" className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Гарах</span>
                  <span className="sr-only sm:hidden">Гарах</span>
                </button>
              </form>
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

              {/* Жагсаалтын сүүлчийн мөр, шугамаар тусгаарлагдсан: гарах нь
                  навигаци БИШ — хуудас солихгүй, session-ийг дуусгана. */}
              <form action={logout} className="mt-1 border-t border-line pt-1">
                <input type="hidden" name="locale" value="mn" />
                <button
                  type="submit"
                  className="flex h-12 w-full items-center gap-3 rounded-lg px-3 text-[15px] text-foreground transition-colors active:bg-surface-2"
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

/**
 * Зурвасын нэг мөр.
 *
 * ── Идэвхтэйг ЮУ заах вэ ───────────────────────────────────────────────
 * Өмнө нь зүүн зураас нь `-left-5` дээр байсан бөгөөд ЗӨВХӨН дэлгэгдсэн
 * үед зурагддаг байв. Гэтэл зурвас нь ихэнх хугацаанд ХУМИГДСАН байдаг —
 * өөрөөр хэлбэл «би хаана байна» гэдэг тэмдэг нь хамгийн хэрэгтэй үедээ
 * байхгүй байлаа. Ажилтан долоон ижил дүрсийг хараад аль нь нээлттэй
 * байгааг таамаглах ёстой болдог.
 *
 * Одоо гурван дохио зэрэг ажиллана:
 *   · дэвсгэр    — мөр өөрөө нэг шат гэрэлтэнэ
 *   · зураас     — зурвасын ЗҮҮН ИРМЭГ дээр, хоёр төлөвт ч харагдана
 *   · жин, өнгө  — тод, 500 жинтэй
 *
 * Зураас нь `-left-3` дээр: хажуугийн зай тогтмол 3 нэгж тул энэ нь яг
 * самбарын ирмэгт таарна. Зай нь өөрчлөгддөг байсан бол энэ тоо хоёр
 * төлөвийн аль нэгэнд нь буруу болох байв.
 */
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
      className={`relative flex h-10 w-full items-center rounded-lg text-[13px] whitespace-nowrap transition-colors duration-150 ${
        active
          ? 'bg-surface-2 font-medium text-foreground'
          : 'text-foreground-soft hover:bg-surface-2 hover:text-foreground'
      }`}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-2 -left-3 w-[2px] rounded-r-full bg-foreground"
        />
      )}

      {/* Дүрсний багана — хумигдсан самбарын АГУУЛГЫН өргөнтэй яг тэнцүү
          (5rem − 2×0.75rem = 3.5rem). Тиймээс дүрс нь хумигдсан үед
          зурвасын голд, дэлгэгдсэн үед нэрийнхээ өмнө — хоёр тохиолдолд
          ЯГ НЭГ цэгт зогсоно. */}
      <span className="grid w-14 shrink-0 place-items-center">
        <AdminIcon name={item.icon} className="h-[18px] w-[18px]" />
      </span>

      {/* Нэр нь ҮРГЭЛЖ зурагдана — зөвхөн харагдахаа болино. Нөхцөлт
          зурагдалт нь өргөн 200ms гүйж байхад текстийг НЭГ ХҮРЭЭНД
          үсрүүлж гаргадаг байв. */}
      <span
        className={`min-w-0 truncate pr-3 transition-opacity duration-200 ${
          collapsed ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {item.label}
      </span>
    </Link>
  )
}
