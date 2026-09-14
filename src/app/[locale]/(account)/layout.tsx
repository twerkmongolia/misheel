import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AccountSubNav } from '@/components/site/AccountNav'
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
   ХУВИЙН ХУУДСУУД

   Гадна бүрхүүлийг (толгой, табууд, доод самбар) `StudentShell` зурна
   (§ [locale]/layout.tsx) — сурагч БҮХ хуудсан дээр түүнийг өмсдөг тул энд
   давтах шаардлагагүй.

   Энэ layout -ын үлдсэн ганц ажил: хувийн дөрвөн хуудсыг холбосон дотоод
   цэс ба баганы өргөн.

   ⚠️ Ажилтан, багш нар энд орж ирвэл маркетингийн бүрхүүлтэйгээ харагдана
   — тэдэнд `StudentShell` хамаарахгүй. Дотоод цэс хоёуланд нь ажиллана.
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

  const mine = [
    { href: `/${locale}/account/courses`, label: t.courses.mine, exact: false },
    { href: `/${locale}/account/bookings`, label: t.booking.myBookings, exact: false },
    { href: `/${locale}/account/orders`, label: t.shop.myOrders, exact: false },
    { href: `/${locale}/account`, label: t.auth.profile, exact: true },
  ]

  return (
    <div className="shell pt-8 sm:pt-12">
      <AccountSubNav items={mine} />
      {children}
    </div>
  )
}
