import Link from 'next/link'
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
      <h1 className="t-h2">{t.auth.resetTitle}</h1>
      <ForgotPasswordForm t={t} locale={locale} />

      {/* Гарц. Энэ хуудас нь мухар байв: и-мэйлээ бичсэн ч, бичихээ больсон
          ч — нэвтрэх рүү буцах цорын ганц зам нь хөтчийн буцах товч байлаа.
          Нууц үгээ гэнэт САНАЖ байгаа хүн бол энд хамгийн түгээмэл зочин. */}
      <Link
        href={`/${locale}/login`}
        className="text-sm text-muted transition-colors hover:text-foreground"
      >
        {t.auth.backToLogin}
      </Link>
    </>
  )
}
