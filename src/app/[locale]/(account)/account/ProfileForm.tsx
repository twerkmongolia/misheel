'use client'

import { useActionState } from 'react'
import { Alert, Button, Field, Input } from '@/components/ui'
import { updateProfile } from '@/actions/auth'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Profile } from '@/lib/supabase/database.types'

export function ProfileForm({ t, profile }: { t: Dictionary; profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, undefined)

  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      {state?.message === 'updated' && <Alert tone="good">{t.auth.updated}</Alert>}

      <Field label={t.auth.fullName}>
        <Input name="full_name" defaultValue={profile.full_name ?? ''} required autoComplete="name" />
      </Field>
      <Field label={t.auth.phone}>
        <Input name="phone" defaultValue={profile.phone ?? ''} required autoComplete="tel" />
      </Field>

      <Button type="submit" disabled={pending} className="self-start">
        {t.common.save}
      </Button>
    </form>
  )
}
