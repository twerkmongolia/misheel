import { notFound } from 'next/navigation'
import { getDictionary, isLocale } from '@/lib/i18n'
import { SignupForm } from '../AuthForms'

export default async function SignupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)

  return (
    <>
      <h1 className="text-2xl font-semibold">{t.auth.signupTitle}</h1>
      <SignupForm t={t} locale={locale} />
    </>
  )
}
