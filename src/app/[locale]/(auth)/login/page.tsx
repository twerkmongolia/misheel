import { notFound } from 'next/navigation'
import { Alert } from '@/components/ui'
import { getDictionary, isLocale } from '@/lib/i18n'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { LoginForm } from '../AuthForms'
import { GoogleButton } from '../GoogleButton'

/**
 * `?error=` -ийн шалтгаан бүрийг өөрийн мессеж рүү (§ app/auth/*).
 *
 * Танигдахгүй утга нь ерөнхий мессеж рүү унана — хаягийн мөрөнд юу ч бичиж
 * болдог тул энд байхгүй түлхүүр ирэх нь хэвийн.
 */
const authErrors: Record<string, keyof Dictionary['auth']['errors']> = {
  oauth_start: 'oauthStart',
  provider: 'provider',
  missing_code: 'missingCode',
  exchange: 'exchange',
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const [{ locale }, search] = await Promise.all([params, searchParams])
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const next = search.next?.startsWith('/') ? search.next : undefined

  return (
    <>
      <h1 className="t-h2">{t.auth.loginTitle}</h1>
      {search.error && (
        <Alert tone="danger">{t.auth.errors[authErrors[search.error] ?? 'unknown']}</Alert>
      )}

      {/* Google нь маягтын ДЭЭР. Хамгийн хурдан зам эхэнд байх ёстой —
          доор нь тавибал хүн и-мэйл, нууц үгээ бичиж эхэлсэн хойноо л
          олж хардаг. */}
      <GoogleButton t={t} locale={locale} next={next} />

      <LoginForm t={t} locale={locale} next={next} />
    </>
  )
}
