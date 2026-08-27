import { notFound } from 'next/navigation'
import { Alert } from '@/components/ui'
import { signInWithGoogle } from '@/actions/auth'
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

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        <span>эсвэл</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={signInWithGoogle}>
        <input type="hidden" name="locale" value={locale} />
        <button
          type="submit"
          className="w-full rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm font-medium hover:bg-surface-2"
        >
          {t.auth.google}
        </button>
      </form>
    </>
  )
}
