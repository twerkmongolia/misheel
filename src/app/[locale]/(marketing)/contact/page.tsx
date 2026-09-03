import { notFound } from 'next/navigation'
import { Arrow, ButtonLink, Eyebrow } from '@/components/ui'
import { ChannelList } from '@/components/site/ChannelList'
import { contactChannels, type Channel } from '@/lib/contact'
import { content, getDictionary, isLocale } from '@/lib/i18n'
import { getSiteContent } from '@/lib/data'
import { PageBanner } from '@/components/site/PageBanner'

/* ───────────────────────────────────────────────────────────────────────────
   ХОЛБОО БАРИХ

   Уншигч энэ хуудсанд ХОЁР өөр сэтгэлгээтэй ирдэг:

     1. «Одоо, шууд» — залгах, Instagram руу бичих. Тэднийг форм сонирхохгүй.
     2. «Урт асуулттай» — тоглолт захиалах, хамтран ажиллах. Тэдэнд форм.

   Өмнөх хувилбар хоёуланг нь ижил жинтэй хоёр багана болгож тавьсан бөгөөд
   баруун талын холбоо барих мэдээлэл нь ЖИЖИГ саарал шошготой текстийн
   овоолго байв — дарж болохыг нь ч мэдэхгүй. Утасны дугаар бол хуудасны
   хамгийн үнэ цэнэтэй зүйл; түүнийг 12px саарал текстээр бичих нь алдаа.

   Одоо шууд сувгууд нь МӨР болов (§ `SessionRow` -той нэг хэл): дээр нь
   шошго, доор нь том утга, баруун талд сум. Дарж болох гэдэг нь хэлбэрээс
   нь уншигдана.

   ── Форм хаана байна вэ ────────────────────────────────────────────────
   ХААНА Ч БАЙХГҮЙ. Мессежийн форм нь `contact_messages` хүснэгт рүү бичдэг
   байсан ч түүнийг УНШИХ хуудас удирдлагад байгаагүй — бичсэн хүн хариу
   хүлээж, хэн ч хараагүй. Ажилладаггүй суваг санал болгохоос үзүүлэхгүй
   нь дээр тул форм, түүний server action хоёулаа хасагдав.

   Одоо холбоо барих гэдэг нь ШУУД СУВГУУД: утас, Instagram, Facebook,
   и-мэйл. Навбарын «Холбоо барих» дарахад эдгээр нь ЦОНХ болж гарна
   (§ site/ContactDialog.tsx); энэ хуудас нь тэдгээрийг хаяг, газрын
   зурагтай нь хамт бүтнээр харуулна.

   Жагсаалтын бүтэц нь `lib/contact.ts` -д — хоёр газар тус тусад нь барьвал
   эрт орой хэзээ нэгэн цагт зөрнө.
   ─────────────────────────────────────────────────────────────────────── */

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const site = await getSiteContent(['contact'])
  const info = content(site.get('contact'), locale)

  const address = String(info.address ?? '')

  /* Утас, сүлжээ, и-мэйл — цонхтой ИЖИЛ жагсаалт, ганц эх сурвалжаас
     (§ lib/contact.ts). Хаяг нь зөвхөн энэ хуудсанд нэмэгдэнэ: газрын
     зураг нээх нь цонхонд хийх ажил биш. */
  const channels: Channel[] = [
    ...contactChannels(info, t),
    ...(address
      ? [
          {
            label: t.contact.address,
            value: address,
            href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
            external: true,
            icon: 'map' as const,
          },
        ]
      : []),
  ]

  return (
    <>
      <PageBanner page="contact" title={t.contact.title} lead={t.contact.lead} />

      {/* ── ОНЦОЛСОН БЛОК ───────────────────────────────────────────────
          Хуудасны гол зорилго нь ХОЛБОГДОХ явдал тул холбоо барих хэсэг
          хуудасны бусад агуулгаас тусгаарлагдана.

          Өмнө нь энэ нь эргүүлсэн ЦАГААН талбай байв. Сайт ганц горимтой
          болмогц тэр нь системийн гадна үлдсэн муж болж, эвдэрсэн мэт
          уншигдах болсон тул тусгаарлалтыг гадаргын шат хийнэ (§ globals.css
          `.panel`). Доторх бүрдлүүд өөрчлөгдөөгүй — бүгд токен уншина. */}
      <div className="panel">
        <div className="shell g12 gap-y-16 pt-16 pb-[var(--bay-sm)] sm:pt-20">
          {/* ── Мэдэгдэл — 5 багана ────────────────────────────────────────
            Урьд нь энд «Бидэнд бичээрэй» товч байсан нь цонх нээдэг байв —
            гэтэл тэр цонх нь ЯГ баруун талд аль хэдийн харагдаж буй
            сувгуудыг үзүүлдэг. Нэг хуудсан дээр нэг зүйлийг хоёр удаа
            санал болгох нь сонголт биш, эргэлзээ төрүүлнэ. */}
          <div className="col-span-12 flex flex-col items-start gap-7 lg:col-span-5">
            <div data-rv>
              <Eyebrow>{t.contact.directTitle}</Eyebrow>
            </div>

            <h2 className="t-h2" data-rv>
              {t.contact.title}
            </h2>

            {/* Хариу өгөх хугацааг ХЭЛНЭ. «Хэзээ хариу ирэх бол» гэсэн
              эргэлзээ нь холбоо барихаас няцаадаг хамгийн түгээмэл шалтгаан. */}
            <p className="t-lead max-w-[30ch] text-muted" data-rv>
              {t.contact.replyNote}
            </p>

            {/* Холбоо барихаар ирсэн хүмүүсийн ихэнх нь ХУВААРЬ хайж байдаг —
              асуухаас нь өмнө хариултыг нь санал болгоно. */}
            <ButtonLink
              href={`/${locale}/schedule`}
              variant="secondary"
              className="w-full sm:w-auto"
              data-rv
            >
              {t.nav.schedule}
              <Arrow />
            </ButtonLink>
          </div>

          {/* ── Шууд сувгууд — 6 багана ─────────────────────────────────────
            Хуудасны гол агуулга. Мөр бүр дээрээ шошго, доороо том утга,
            баруун талдаа сум: дарж болох гэдэг нь хэлбэрээс нь уншигдана. */}
          <aside className="col-span-12 flex flex-col lg:col-span-6 lg:col-start-7">
            <div data-rv>
              <ChannelList channels={channels} />
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
