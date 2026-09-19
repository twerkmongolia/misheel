import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Alert } from '@/components/ui'
import { getUser } from '@/lib/auth/dal'
import { getDictionary, isLocale } from '@/lib/i18n'
import { ResetPasswordForm } from '../AuthForms'

/**
 * Шинэ нууц үг тавих хуудас.
 *
 * ── Session-гүйгээр энэ хуудас АЖИЛЛАХГҮЙ ─────────────────────────────────
 * И-мэйлийн холбоос нь `/auth/callback` дээр session үүсгээд ЭНД авчирдаг.
 * Тэр session байхгүй бол `updateUser` нь юу ч хийж чадахгүй.
 *
 * Өмнө нь маягт ямар ч тохиолдолд харагддаг байв: хугацаа нь дууссан
 * холбоосоор орсон хүн шинэ нууц үгээ бичиж, «Хадгалах» дараад Supabase-ийн
 * «Auth session missing!» гэсэн АНГЛИ техникийн мөрийг хардаг байлаа. Тэр
 * өгүүлбэр нь юу хийхийг нь хэлдэггүй тул хүн нууц үгээ дахин бичиж үзээд,
 * дахиад л ижил хана мөргөнө.
 *
 * Тиймээс session-ийг ЭНД, маягтыг зурахаас ӨМНӨ шалгана: хийж болохгүй
 * зүйлийг санал болгохгүй, харин хийж БОЛОХ зүйл рүү нь (шинэ холбоос
 * авах) шууд заана.
 */
export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const user = await getUser()

  if (!user) {
    return (
      <>
        <h1 className="t-h2">{t.auth.newPassword}</h1>
        <Alert tone="warn">{t.auth.resetNoLink}</Alert>

        <div className="flex flex-col gap-3 text-sm">
          <Link
            href={`/${locale}/forgot-password`}
            className="text-foreground underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-foreground"
          >
            {t.auth.resetAgain}
          </Link>
          <Link href={`/${locale}/login`} className="text-muted transition-colors hover:text-foreground">
            {t.auth.backToLogin}
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <h1 className="t-h2">{t.auth.newPassword}</h1>
      <ResetPasswordForm t={t} locale={locale} />
    </>
  )
}
