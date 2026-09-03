import { notFound } from 'next/navigation'
import { NavLink } from '@/components/site/NavLink'
import { getDictionary, isLocale } from '@/lib/i18n'

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
          навигацитай ЯГ нэг дүрэм (§ globals.css `.nav-item`). */}
      <nav className="flex gap-7 border-b border-line">
        {tabs.map((tab) => (
          <NavLink key={tab.href} href={tab.href} exact={tab.exact} className="nav-item t-small">
            {tab.label}
          </NavLink>
        ))}
      </nav>
      {children}
    </div>
  )
}
