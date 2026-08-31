import { notFound } from 'next/navigation'
import { Header } from '@/components/site/Header'
import { Footer } from '@/components/site/Footer'
import { Reveal } from '@/components/site/Reveal'
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
      <Header locale={locale} />

      {/*
        `main` дээр хажуугийн зай БАЙХГҮЙ. Зай нь `.shell` дээр амьдардаг тул
        хуудас өөрөө шийднэ: аль хэсэг баганад багтах, аль нь дэлгэцийн ирмэг
        хүртэл гарахыг. Зайг `main` дээр тавьбал бүтэн өргөн тууз бүр
        сөрөг захаар тэмцэх шаардлагатай болно.
      */}
      <main className="flex-1 pb-24">{children}</main>

      <Footer locale={locale} />

      {/* Гүйлтийн хөдөлгөөний ажиглагч — DOM зурагдсаны дараа залгагдана */}
      <Reveal />
    </>
  )
}
