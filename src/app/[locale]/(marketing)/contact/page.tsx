import { notFound } from 'next/navigation'
import { Arrow, ButtonLink, Eyebrow, Section } from '@/components/ui'
import { content, getDictionary, isLocale } from '@/lib/i18n'
import { getSiteContent } from '@/lib/data'
import { ContactForm } from './ContactForm'
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
   ─────────────────────────────────────────────────────────────────────── */

type Channel = { label: string; value: string; href: string; external?: boolean }

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const site = await getSiteContent(['contact'])
  const info = content(site.get('contact'), locale)

  const phone = String(info.phone ?? '')
  const email = String(info.email ?? '')
  const address = String(info.address ?? '')
  const instagram = String(info.instagram ?? '')
  const facebook = String(info.facebook ?? '')

  /* Дараалал нь ХУРДААР эрэмбэлэгдэнэ: утас хамгийн шууд, хаяг хамгийн удаан.
     Хоосон талбар (`site_content` дээр бөглөөгүй) огт мөр эзлэхгүй. */
  const channels: Channel[] = [
    phone && { label: t.auth.phone, value: phone, href: `tel:${phone.replace(/\s/g, '')}` },
    instagram && {
      label: 'Instagram',
      value: `@${instagram}`,
      href: `https://instagram.com/${instagram}`,
      external: true,
    },
    facebook && {
      label: 'Facebook',
      value: 'Twerk Mongolia',
      href: facebook,
      external: true,
    },
    email && { label: t.auth.email, value: email, href: `mailto:${email}` },
    address && {
      label: t.contact.address,
      value: address,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      external: true,
    },
  ].filter(Boolean) as Channel[]

  return (
    <>
      <PageBanner page="contact" title={t.contact.title} lead={t.contact.lead} />

      <div className="shell g12 gap-y-16 pt-12 pb-[var(--bay-sm)] sm:pt-16">
        {/* ── Форм — хуудасны үндсэн үйлдэл, 7 багана ─────────────────── */}
        <div className="col-span-12 lg:col-span-7">
          <Section eyebrow={t.contact.formEyebrow} title={t.contact.formTitle}>
            <ContactForm t={t} />
          </Section>
        </div>

        {/* ── Шууд сувгууд — 4 багана, зайтай ─────────────────────────────
            Хоёр баганын хооронд НЭГ багана хоосон үлдэнэ: форм ба шууд
            холбоо хоёр нь ижил зүйлийн хоёр хувилбар биш, ӨӨР зам гэдгийг
            зай нь хэлнэ. */}
        <aside className="col-span-12 flex flex-col lg:col-span-4 lg:col-start-9">
          <div data-rv>
            <Eyebrow>{t.contact.directTitle}</Eyebrow>
          </div>

          <div className="hr hr-draw mt-5" data-rv="line" />

          <div className="flex flex-col">
            {channels.map((channel) => (
              <a
                key={channel.label}
                href={channel.href}
                {...(channel.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                className="group flex items-center justify-between gap-5 border-b border-line py-5 transition-colors"
                data-rv
              >
                <span className="min-w-0">
                  <span className="t-label block text-muted">{channel.label}</span>
                  <span className="t-h3 mt-1.5 block underline-offset-4 group-hover:underline">
                    {channel.value}
                  </span>
                </span>
                <Arrow className="shrink-0 text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground" />
              </a>
            ))}
          </div>

          {/* Хариу өгөх хугацааг ХЭЛНЭ. «Хэзээ хариу ирэх бол» гэсэн
              эргэлзээ нь мессеж бичихээс няцаадаг хамгийн түгээмэл шалтгаан. */}
          <p className="t-meta mt-6 text-muted" data-rv>
            {t.contact.replyNote}
          </p>

          {/* Холбоо барихаар ирсэн хүмүүсийн ихэнх нь ХУВААРЬ хайж байдаг —
              асуухаас нь өмнө хариултыг нь санал болгоно. */}
          <ButtonLink
            href={`/${locale}/schedule`}
            variant="secondary"
            className="mt-8 w-full sm:w-auto sm:self-start"
            data-rv
          >
            {t.nav.schedule}
            <Arrow />
          </ButtonLink>
        </aside>
      </div>
    </>
  )
}
