import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui'
import { content, getDictionary, isLocale } from '@/lib/i18n'
import { getSiteContent } from '@/lib/data'
import { ContactForm } from './ContactForm'

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const site = await getSiteContent(['contact'])
  const info = content(site.get('contact'), locale)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t.contact.title} />

      <div className="grid gap-10 md:grid-cols-2">
        <ContactForm t={t} />

        <address className="flex flex-col gap-3 text-sm not-italic">
          {info.address && (
            <div>
              <p className="text-muted">{t.schedule.at}</p>
              <p>{info.address}</p>
            </div>
          )}
          {info.phone && (
            <div>
              <p className="text-muted">{t.auth.phone}</p>
              <a href={`tel:${String(info.phone).replace(/\s/g, '')}`} className="hover:text-foreground">
                {info.phone}
              </a>
            </div>
          )}
          {info.email && (
            <div>
              <p className="text-muted">{t.auth.email}</p>
              <a href={`mailto:${info.email}`} className="hover:text-foreground">
                {info.email}
              </a>
            </div>
          )}
          {info.instagram && (
            <div>
              <p className="text-muted">Instagram</p>
              <a
                href={`https://instagram.com/${info.instagram}`}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-foreground"
              >
                @{info.instagram}
              </a>
            </div>
          )}
          {info.facebook && (
            <div>
              <p className="text-muted">Facebook</p>
              <a
                href={String(info.facebook)}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-foreground"
              >
                Twerk Mongolia
              </a>
            </div>
          )}
        </address>
      </div>
    </div>
  )
}
