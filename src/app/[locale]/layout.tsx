import { notFound } from 'next/navigation'
import { Header } from '@/components/site/Header'
import { TodayBar } from '@/components/site/TodayBar'
import { Footer } from '@/components/site/Footer'
import { StudentShell } from '@/components/site/StudentShell'
import { getProfile } from '@/lib/auth/dal'
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

  /* ── Нэвтэрсэн сурагч ӨӨР БҮРХҮҮЛТЭЙ ──────────────────────────────────
     Маркетингийн толгой, хөл хоёр нь ЗАРАХ хэрэгсэл: «Бидний тухай»,
     «Холбоо барих», хөлд нь хаяг, олон нийтийн сүлжээ. Мөнгөө төлчихсөн
     сурагчид тэдгээр нь зөвхөн дуу чимээ.

     Шийдвэрийг ЗАМААР биш ЭРХЭЭР гаргана: урьд нь зөвхөн `/account`
     доторх хуудас өөр бүрхүүлтэй байсан тул сурагч дэлгүүр рүү дармагц
     маркетингийн навбар буцаж ирдэг байв — хоёр ертөнц хооронд үсэрдэг
     навигаци нь «би хаана байна» гэсэн асуулт төрүүлнэ.

     Ажилтан, багш нар маркетингийн бүрхүүлээ хадгална: тэдэнд сайт нь
     ажлын хэрэгсэл, тэд түүнийг үйлчлүүлэгчийн нүдээр харах ёстой. */
  const viewer = await getProfile()
  if (viewer?.role === 'customer') {
    return <StudentShell locale={locale}>{children}</StudentShell>
  }

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

    </>
  )
}
