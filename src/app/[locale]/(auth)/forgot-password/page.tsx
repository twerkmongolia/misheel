import { notFound } from 'next/navigation'
import { getDictionary, isLocale } from '@/lib/i18n'
import { ForgotPasswordForm } from '../AuthForms'

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)

  return (
    <>
      <h1 className="text-2xl font-semibold">{t.auth.resetTitle}</h1>
      <ForgotPasswordForm t={t} locale={locale} />
    </>
  )
}
