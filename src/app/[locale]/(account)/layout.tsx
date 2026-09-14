import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  AccountBottomNav,
  AccountTabs,
  type AccountTab,
} from '@/components/site/AccountNav'
import { logout } from '@/actions/auth'
import { getProfile } from '@/lib/auth/dal'
import { getDictionary, isLocale } from '@/lib/i18n'

/**
 * Бүртгэлийн хэсэг бүхэлдээ индексээс ГАДУУР.
 *
 * Агуулга нь нэвтэрсэн хүн тус бүрд өөр тул хайлтын үр дүнд гарах ямар ч
 * утга байхгүй — робот зөвхөн нэвтрэх хуудас руу чиглүүлэгдэнэ.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/* ───────────────────────────────────────────────────────────────────────────
   СУРАГЧИЙН САМБАР

   Маркетингийн толгой, хөл хоёр энд БАЙХГҮЙ (§ [locale]/layout.tsx).

   ── Яагаад ──────────────────────────────────────────────────────────────
   Тэр хоёр нь ЗАРАХ хэрэгсэл: цэс нь «ямар анги байна», хөл нь «бид хэн
   бэ, хаана байрладаг». Нэвтэрсэн сурагч тэр асуултуудад аль хэдийн
   хариулсан. Түүний дэлгэц дээр байх ёстой зүйл гурав: хичээл, бүртгэл,
   захиалга. Зарлалын дундуур тэднийг хайлгах нь ажлын хэрэгслийг
   сурталчилгааны хуудсан дээр тавихтай адил — удирдлага өөрийн бүрхүүлтэй
   байдаг яг тэр шалтгаан.

   ── Гарц нээлттэй ───────────────────────────────────────────────────────
   Хаалттай хайрцаг биш: толгой мөрөнд «Анги үзэх» холбоос байна. Сурагч
   дахин анги авах, дэлгүүр харах бол нийтийн сайт руу нэг дарж гарна.
   ─────────────────────────────────────────────────────────────────────── */

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const profile = await getProfile()
  const name = profile?.full_name?.trim() || t.auth.noName

  /* ХИЧЭЭЛ эхэнд — энэ бол сурагчийн нүүр (§ (marketing)/page.tsx дээрх
     чиглүүлэлт). Профайл нь сүүлд: утсаа сольхын тулд л нээдэг хуудас.

     Дараалал нь утасны доод самбар дээр ЗҮҮНЭЭС БАРУУН тийш яг ийм байна —
     хамгийн олон дардаг нь эрхий хуруунд хамгийн ойр. */
  const tabs: AccountTab[] = [
    {
      href: `/${locale}/account/courses`,
      label: t.courses.mine,
      short: t.courses.mineShort,
      icon: 'courses',
    },
    {
      href: `/${locale}/account/bookings`,
      label: t.booking.myBookings,
      short: t.booking.myBookingsShort,
      icon: 'calendar',
    },
    {
      href: `/${locale}/account/orders`,
      label: t.shop.myOrders,
      short: t.shop.myOrdersShort,
      icon: 'receipt',
    },
    /* ── ГАДАГШ гарах таб ──────────────────────────────────────────────
       Дэлгүүр нь сурагчийн хэсэгт БИШ нийтийн сайтад амьдардаг: хувцас,
       хэрэгслийг нэвтрээгүй хүн ч үздэг тул хоёр хувилбар барих утгагүй.

       Гэвч сурагч дэлгүүрээс худалдан авалт хийсээр байна — тэр замыг
       самбараас хасвал хүн хаягийн мөр рүү гараар бичих эсвэл гарч
       нэвтрэхээ болих ёстой болно. Тиймээс таб нь энд зогсоод, дарахад
       нийтийн сайт руу гаргана: тэнд сайтын өөрийн навигаци угтана. */
    { href: `/${locale}/shop`, label: t.nav.shop, icon: 'bag' },
    // Эцэг зам тул `exact`: дэд хуудсууд дээр идэвхтэй болохгүй.
    { href: `/${locale}/account`, label: t.auth.profile, icon: 'person', exact: true },
  ]

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[72rem] items-center gap-3 px-4 py-3 sm:px-6">
          {/* Лого нь сурагчийн НҮҮР рүү — хичээл рүү. Нийтийн нүүр хуудас
              руу биш: тэр нь түүнийг эргүүлээд энд буцаана. */}
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

      {/* `pb-24` — доод самбар агуулгын сүүлийн мөрийг дарахгүйн тулд. */}
      <main className="mx-auto w-full max-w-[72rem] flex-1 px-4 pt-8 pb-24 sm:px-6 lg:pt-12 lg:pb-16">
        {children}
      </main>

      <AccountBottomNav tabs={tabs} />
    </div>
  )
}
