import Link from 'next/link'
import { notFound } from 'next/navigation'
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
    { href: `/${locale}/account`, label: t.auth.profile },
    { href: `/${locale}/account/bookings`, label: t.booking.myBookings },
    { href: `/${locale}/account/orders`, label: t.shop.myOrders },
  ]

  return (
    <div className="flex flex-col gap-8">
      <nav className="flex gap-1 border-b border-line pb-2 text-sm">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href} className="rounded-lg px-3 py-2 hover:bg-surface-2">
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
