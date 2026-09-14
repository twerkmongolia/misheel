import Link from 'next/link'
import { AccountBottomNav, AccountTabs, type AccountTab } from './AccountNav'
import { logout } from '@/actions/auth'
import { getProfile } from '@/lib/auth/dal'
import { getDictionary, type Locale } from '@/lib/i18n'

/* ───────────────────────────────────────────────────────────────────────────
   СУРАГЧИЙН БҮРХҮҮЛ

   Нэвтэрсэн сурагч сайтын маркетингийн толгой, хөл хоёрыг ХААНА Ч ХАРАХГҮЙ
   (§ [locale]/layout.tsx).

   ── Яагаад ──────────────────────────────────────────────────────────────
   Тэр хоёр нь ЗАРАХ хэрэгсэл: «Нүүр», «Бидний тухай», «Холбоо барих», хөлд
   нь хаяг, утас, олон нийтийн сүлжээ. Эдгээр нь ШИЙДВЭР ГАРГААГҮЙ хүнд
   зориулагдсан. Мөнгөө төлчихсөн сурагчид тэдгээр нь зөвхөн дуу чимээ —
   түүний хайж байгаа зүйл нь гурав: юу сурах, юу авах, өөрийн зүйлс.

   ── Яагаад ЗАМААР биш ЭРХЭЭР шийддэг вэ ─────────────────────────────────
   Урьд нь зөвхөн `/account` доторх хуудсууд энэ бүрхүүлтэй байв: сурагч
   дэлгүүр рүү дармагц маркетингийн навбар буцаж ирдэг байлаа. Хоёр ертөнц
   хооронд үсэрдэг навигаци нь хүнийг «би хаана байна» гэж бодоход хүргэнэ.

   Ажилтан, багш нар маркетингийн бүрхүүлээ ХАДГАЛНА: тэдэнд сайт нь
   ажлын хэрэгсэл — тэд түүнийг үйлчлүүлэгчийн нүдээр харах ёстой.
   ─────────────────────────────────────────────────────────────────────── */

export async function StudentShell({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  const t = getDictionary(locale)
  const profile = await getProfile()
  const name = profile?.full_name?.trim() || t.auth.noName

  /* Дараалал нь МӨНГӨНИЙ урсгалыг дагана: юу сурахаа сонго → юу авахаа
     сонго → өөрийн зүйлс. Хамгийн олон дардаг нь утасны эрхий хуруунд
     хамгийн ойр (зүүн тал). */
  const tabs: AccountTab[] = [
    {
      href: `/${locale}/courses?mode=studio`,
      label: t.nav.studioCourses,
      short: t.nav.studioShort,
      icon: 'courses',
    },
    {
      href: `/${locale}/courses?mode=online`,
      label: t.nav.onlineCourses,
      short: t.nav.onlineShort,
      icon: 'play',
    },
    { href: `/${locale}/shop`, label: t.nav.shop, icon: 'bag' },
    {
      href: `/${locale}/account/courses`,
      label: t.nav.account,
      short: t.nav.accountShort,
      icon: 'person',
    },
  ]

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[72rem] items-center gap-3 px-4 py-3 sm:px-6">
          {/* Лого нь сурагчийн НҮҮР рүү — түүний хичээл рүү. Нийтийн нүүр
              хуудас нь зарлалын хуудас бөгөөд түүнд хэрэггүй. */}
          <Link
            href={`/${locale}/account/courses`}
            className="flex min-w-0 items-center gap-2.5 transition-opacity duration-300 hover:opacity-70"
          >
            <span className="font-display grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-foreground text-[0.78rem] leading-none font-extrabold tracking-[0.01em] text-background uppercase">
              TM
            </span>
            <span className="min-w-0 leading-tight">
              <span className="wordmark block truncate">{t.brand}</span>
              <span className="t-meta mt-0.5 block text-faint">{t.auth.student}</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-1">
            {/* Нэр нь утсан дээр нуугдана — эхний үсэг нь хэн болохыг
                хэлэхэд хангалттай, үлдсэн зай нь гарах товчинд хэрэгтэй. */}
            <span className="hidden text-right text-[13px] leading-tight sm:block">
              <span className="block max-w-[12rem] truncate font-medium">{name}</span>
            </span>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line-strong text-xs font-semibold">
              {name.slice(0, 1).toUpperCase()}
            </span>

            <form action={logout}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="rounded-full px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                {t.nav.logout}
              </button>
            </form>
          </div>
        </div>

        {/* Ширээний компьютерт энд. Утасны самбар нь толгойн ГАДНА —
            `backdrop-blur` нь `fixed` -ийг өөртөө уядаг
            (§ site/AccountNav.tsx). */}
        <AccountTabs tabs={tabs} />
      </header>

      {/* Өргөнийг ХУУДАС өөрөө шийднэ (`.shell`) — энэ бүрхүүл нь нийтийн
          хуудсуудыг ч агуулдаг тул энд хязгаарлавал тэдний тууз, торны
          хэмнэл хоёул эвдэрнэ. `pb-24` нь доод самбарын өндөр. */}
      <main className="flex-1 pb-24">{children}</main>

      <AccountBottomNav tabs={tabs} />
    </div>
  )
}
