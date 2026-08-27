'use client'

import { useActionState } from 'react'
import { Alert, Button, Field, Input, Textarea } from '@/components/ui'
import { sendContactMessage } from '@/actions/contact'
import type { Dictionary } from '@/lib/i18n/dictionaries'

export function ContactForm({ t }: { t: Dictionary }) {
  const [state, action, pending] = useActionState(sendContactMessage, undefined)

  if (state?.sent) {
    return <Alert tone="good">{t.contact.sent}</Alert>
  }

  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}

      <Field label={t.auth.fullName}>
        <Input name="name" required autoComplete="name" />
      </Field>
      <Field label={t.auth.phone}>
        <Input name="phone" type="tel" autoComplete="tel" />
      </Field>
      <Field label={t.auth.email}>
        <Input name="email" type="email" autoComplete="email" />
      </Field>
      <Field label={t.contact.message}>
        <Textarea name="message" required />
      </Field>

      <Button type="submit" disabled={pending} className="self-start">
        {t.common.submit}
      </Button>
    </form>
  )
}
