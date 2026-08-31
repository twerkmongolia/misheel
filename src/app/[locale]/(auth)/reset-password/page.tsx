import { notFound } from 'next/navigation'
import { getDictionary, isLocale } from '@/lib/i18n'
import { ResetPasswordForm } from '../AuthForms'

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)

  return (
    <>
      <h1 className="t-h2">{t.auth.newPassword}</h1>
      <ResetPasswordForm t={t} locale={locale} />
    </>
  )
}
