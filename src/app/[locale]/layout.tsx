import { notFound } from 'next/navigation'
import { Header } from '@/components/site/Header'
import { TodayBar } from '@/components/site/TodayBar'
import { Footer } from '@/components/site/Footer'
import { Reveal } from '@/components/site/Reveal'
import { ContactDialog } from '@/components/site/ContactDialog'
import { contactChannels } from '@/lib/contact'
import { getSiteContent } from '@/lib/data'
import { content, getDictionary } from '@/lib/i18n'
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

  const t = getDictionary(locale)

  /* `getSiteContent` нь хүсэлтийн хүрээнд кэшлэгддэг тул хөл, нүүр хуудас
     ч мөн үүнийг дуудсан ч өгөгдлийн сан руу НЭГ л асуулга явна
     (§ lib/data.ts `allSiteContent`). */
  const site = await getSiteContent(['contact'])
  const channels = contactChannels(content(site.get('contact'), locale), t)

  return (
    <>
      {/* Наалдмал навбарын ДЭЭР, наалдамхай БИШ — доош гүйлгэхэд үүрд
          зайлж, навбар нь дэлгэцийн дээд ирмэгт очно. Өдрийн мэдээлэл
          нэг л удаа хэрэгтэй; навбар үргэлж хэрэгтэй. */}
      <TodayBar locale={locale} />

      <Header locale={locale} />

      {/*
        `main` дээр хажуугийн зай БАЙХГҮЙ. Зай нь `.shell` дээр амьдардаг тул
        хуудас өөрөө шийднэ: аль хэсэг баганад багтах, аль нь дэлгэцийн ирмэг
        хүртэл гарахыг. Зайг `main` дээр тавьбал бүтэн өргөн тууз бүр
        сөрөг захаар тэмцэх шаардлагатай болно.
      */}
      <main className="flex-1 pb-24">{children}</main>

      <Footer locale={locale} />

      {/* Холбоо барих цонх — хуудасны аль ч «Холбоо барих» товчноос
          дуудагдана. НЭГ л удаа холбогдоно: товч бүрд өөрийн цонх өгвөл
          нэг хуудсанд хэд хэдэн хувилбар DOM-д зэрэг сууна
          (§ site/ContactDialog.tsx). */}
      <ContactDialog
        title={t.contact.title}
        eyebrow={t.contact.directTitle}
        note={t.contact.replyNote}
        closeLabel={t.common.cancel}
        channels={channels}
      />

      {/* Гүйлтийн хөдөлгөөний ажиглагч — DOM зурагдсаны дараа залгагдана */}
      <Reveal />
    </>
  )
}
