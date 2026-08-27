import { notFound } from 'next/navigation'
import { Header } from '@/components/site/Header'
import { Footer } from '@/components/site/Footer'
import { SetupNotice } from '@/components/site/SetupNotice'
import { isLocale } from '@/lib/i18n/config'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  return (
    <>
      <SetupNotice />
      <Header locale={locale} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-14">{children}</main>
      <Footer locale={locale} />
    </>
  )
}
