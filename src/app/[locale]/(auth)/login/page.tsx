import { notFound } from 'next/navigation'
import { Alert } from '@/components/ui'
import { getDictionary, isLocale } from '@/lib/i18n'
import { LoginForm } from '../AuthForms'

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
      <h1 className="text-2xl font-semibold">{t.auth.loginTitle}</h1>
      {search.error && <Alert tone="danger">{t.booking.errors.UNKNOWN}</Alert>}

      <LoginForm t={t} locale={locale} next={next} />
    </>
  )
}
