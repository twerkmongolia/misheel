import { notFound } from 'next/navigation'
import { Alert, PageHeader } from '@/components/ui'
import { getDictionary, isLocale } from '@/lib/i18n'
import { getProfile, requireUser } from '@/lib/auth/dal'
import { ProfileForm } from './ProfileForm'

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const user = await requireUser(locale, `/${locale}/account`)
  const profile = await getProfile()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.auth.profile} lead={user.email ?? undefined} />
      {profile ? (
        <ProfileForm t={t} profile={profile} />
      ) : (
        <Alert tone="warn">Профайл олдсонгүй.</Alert>
      )}
    </div>
  )
}
