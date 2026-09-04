import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NavLink } from '@/components/site/NavLink'
import { getDictionary, isLocale } from '@/lib/i18n'

/**
 * Бүртгэлийн хэсэг бүхэлдээ индексээс ГАДУУР.
 *
 * Агуулга нь нэвтэрсэн хүн тус бүрд өөр тул хайлтын үр дүнд гарах ямар ч
 * утга байхгүй — робот зөвхөн нэвтрэх хуудас руу чиглүүлэгдэнэ. Layout
 * дээр нэг удаа тавьснаар дөрвөн таб бүгд өвлөнө.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

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
  const tabs = [
    // Профайл нь эцэг зам тул `exact`: дэд хуудсууд дээр идэвхтэй болохгүй.
    { href: `/${locale}/account`, label: t.auth.profile, exact: true },
    { href: `/${locale}/account/courses`, label: t.courses.mine, exact: false },
    { href: `/${locale}/account/bookings`, label: t.booking.myBookings, exact: false },
    { href: `/${locale}/account/orders`, label: t.shop.myOrders, exact: false },
  ]

  return (
    <div className="shell flex flex-col gap-12 pt-12 sm:pt-16">
      {/* Табууд — дүүрсэн товч биш, доогуур зураастай текст. Сайтын дээд
          навигацитай ЯГ нэг дүрэм (§ globals.css `.nav-item`).

          ⚠️ Нарийн дэлгэцэд ХЭВТЭЭ гүйнэ, дараагийн мөр рүү УНАХГҮЙ. Дөрвөн
          таб 360px дээр багтахгүй бөгөөд унасан таб нь навигаци биш
          «жагсаалт» мэт харагддаг: идэвхтэй зураас нь хоёр мөрийн аль
          нэгэнд нуугдаж, хэрэглэгч хаана байгаагаа алддаг. Гүйлтийн зурвас
          нуугдана — доорх зураас өөрөө «үргэлжилж байна» гэж хэлнэ. */}
      <nav className="-mx-[var(--shell-pad)] overflow-x-auto px-[var(--shell-pad)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-7 border-b border-line">
          {tabs.map((tab) => (
            <NavLink
              key={tab.href}
              href={tab.href}
              exact={tab.exact}
              className="nav-item t-small whitespace-nowrap"
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>
      {children}
    </div>
  )
}
