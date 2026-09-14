'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Alert, Button, Field, Input } from '@/components/ui'
import { login, requestPasswordReset, signup, updatePassword } from '@/actions/auth'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

type Props = { t: Dictionary; locale: Locale; next?: string }

/**
 * Илгээх товч — хүлээлтийг ХАРАГДУУЛНА.
 *
 * Сүлжээ удаан үед дарсны дараа юу ч болоогүй мэт харагдвал хүн дахин
 * дарна: хоёр бүртгэл, хоёр и-мэйл, эсвэл «яагаад ажиллахгүй байна вэ»
 * гэсэн эргэлзээ. `disabled` ганцаараа тэр асуултад хариулдаггүй —
 * бүдгэрсэн товч нь «боломжгүй» гэж уншигдана. Цагираг нь «хүлээж байна»
 * гэдгийг хэлнэ (§ globals.css `.spinner`).
 *
 * Шошго нь БАЙРАНДАА үлдэж, цагираг нь зүүн талд НЭМЭГДЭНЭ: үгийг нь
 * сольвол товчны өргөн үсэрч, маягт доргино.
 */
function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending && <span aria-hidden className="spinner animate-spin motion-reduce:animate-none" />}
      {children}
    </Button>
  )
}

/** Маягтын доорх асуулт + үйлдэл. Зөвхөн ҮЙЛДЭЛ нь холбоос. */
function Aside({ question, action, href }: { question: string; action: string; href: string }) {
  return (
    <p className="text-sm text-muted">
      {question}{' '}
      <Link
        href={href}
        className="text-foreground underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-foreground"
      >
        {action}
      </Link>
    </p>
  )
}

export function LoginForm({ t, locale, next }: Props) {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      {next && <input type="hidden" name="next" value={next} />}

      {state?.error && <Alert tone="danger">{state.error}</Alert>}

      <Field label={t.auth.email}>
        <Input name="email" type="email" required autoComplete="email" disabled={pending} />
      </Field>
      <Field label={t.auth.password}>
        <Input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          disabled={pending}
        />
      </Field>

      <Submit pending={pending}>{t.auth.loginTitle}</Submit>

      {/* Монгол өгүүлбэрүүд урт тул нарийн дэлгэцэд хооронд нь давхарлана —
          баганаар эхэлж, зай хүрэлцсэн үед л мөрөндөө зэрэгцүүлнэ. */}
      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-baseline sm:justify-between">
        <Link
          href={`/${locale}/forgot-password`}
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          {t.auth.forgot}
        </Link>
        <Aside href={`/${locale}/signup`} question={t.auth.noAccount} action={t.nav.signup} />
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
        <Input name="full_name" required autoComplete="name" disabled={pending} />
      </Field>
      <Field label={t.auth.phone}>
        <Input name="phone" type="tel" required autoComplete="tel" disabled={pending} />
      </Field>
      <Field label={t.auth.email}>
        <Input name="email" type="email" required autoComplete="email" disabled={pending} />
      </Field>
      <Field label={t.auth.password} hint="8+ тэмдэгт">
        <Input
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          disabled={pending}
        />
      </Field>

      <Submit pending={pending}>{t.auth.signupTitle}</Submit>

      <div className="pt-1 text-center">
        <Aside href={`/${locale}/login`} question={t.auth.hasAccount} action={t.nav.login} />
      </div>
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
        <Input name="email" type="email" required autoComplete="email" disabled={pending} />
      </Field>

      <Submit pending={pending}>{t.common.submit}</Submit>
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
        <Input
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          disabled={pending}
        />
      </Field>

      <Submit pending={pending}>{t.common.save}</Submit>
    </form>
  )
}
