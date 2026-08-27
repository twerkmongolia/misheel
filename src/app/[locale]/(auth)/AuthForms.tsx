'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Alert, Button, Field, Input } from '@/components/ui'
import { login, requestPasswordReset, signup, updatePassword } from '@/actions/auth'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

type Props = { t: Dictionary; locale: Locale; next?: string }

export function LoginForm({ t, locale, next }: Props) {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      {next && <input type="hidden" name="next" value={next} />}

      {state?.error && <Alert tone="danger">{state.error}</Alert>}

      <Field label={t.auth.email}>
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label={t.auth.password}>
        <Input name="password" type="password" required autoComplete="current-password" />
      </Field>

      <Button type="submit" disabled={pending}>
        {t.auth.loginTitle}
      </Button>

      <div className="flex justify-between text-sm">
        <Link href={`/${locale}/forgot-password`} className="text-muted hover:text-foreground">
          {t.auth.forgot}
        </Link>
        <Link href={`/${locale}/signup`} className="text-foreground underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-foreground">
          {t.auth.noAccount} {t.nav.signup}
        </Link>
      </div>
    </form>
  )
}

export function SignupForm({ t, locale }: Props) {
  const [state, action, pending] = useActionState(signup, undefined)

  if (state?.message === 'checkEmail') {
    return <Alert tone="good">{t.auth.checkEmail}</Alert>
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />

      {state?.error && <Alert tone="danger">{state.error}</Alert>}

      <Field label={t.auth.fullName}>
        <Input name="full_name" required autoComplete="name" />
      </Field>
      <Field label={t.auth.phone}>
        <Input name="phone" type="tel" required autoComplete="tel" />
      </Field>
      <Field label={t.auth.email}>
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label={t.auth.password} hint="8+ тэмдэгт">
        <Input name="password" type="password" required autoComplete="new-password" minLength={8} />
      </Field>

      <Button type="submit" disabled={pending}>
        {t.auth.signupTitle}
      </Button>

      <Link href={`/${locale}/login`} className="text-center text-sm text-foreground underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-foreground">
        {t.auth.hasAccount} {t.nav.login}
      </Link>
    </form>
  )
}

export function ForgotPasswordForm({ t, locale }: Props) {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined)

  if (state?.message === 'resetSent') {
    return <Alert tone="good">{t.auth.resetSent}</Alert>
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      {state?.error && <Alert tone="danger">{state.error}</Alert>}

      <Field label={t.auth.email}>
        <Input name="email" type="email" required autoComplete="email" />
      </Field>

      <Button type="submit" disabled={pending}>
        {t.common.submit}
      </Button>
    </form>
  )
}

export function ResetPasswordForm({ t, locale }: Props) {
  const [state, action, pending] = useActionState(updatePassword, undefined)

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      {state?.error && <Alert tone="danger">{state.error}</Alert>}

      <Field label={t.auth.newPassword} hint="8+ тэмдэгт">
        <Input name="password" type="password" required autoComplete="new-password" minLength={8} />
      </Field>

      <Button type="submit" disabled={pending}>
        {t.common.save}
      </Button>
    </form>
  )
}
