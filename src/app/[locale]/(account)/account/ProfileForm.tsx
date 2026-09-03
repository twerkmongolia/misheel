'use client'

import { useActionState } from 'react'
import { Alert, Button, Field, Input } from '@/components/ui'
import { updateProfile } from '@/actions/auth'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Profile } from '@/lib/supabase/database.types'

/**
 * Профайлын форм.
 *
 * ── Яагаад хоёр багана ──────────────────────────────────────────────────
 * Нэр ба утас нь ХОЁУЛАА богино утга. Тэднийг доор доор нь өрвөл форм
 * дэлгэцээ гатлан сунаж, баруун тал нь хоосон үлдэнэ — уншигчийн нүд
 * зүүн захаас доошоо унана. Нэг мөрөнд зэрэгцүүлбэл форм өөрөө «энэ бол
 * хоёрхон талбар, хормын зуурын ажил» гэж хэлнэ. Нарийн дэлгэцэд нэг
 * багана болж уналаа.
 *
 * ── Хадгалах товч тусдаа мөрөнд ─────────────────────────────────────────
 * Талбаруудаас ШУГАМААР тусгаарлагдана: товч бол талбар биш, тэр нь
 * бүхэл формын хариу. Урьд нь товч сүүлийн талбарын доор шууд наалдсан
 * байсан тул гуравдахь талбар мэт харагддаг байв.
 */
export function ProfileForm({ t, profile }: { t: Dictionary; profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, undefined)

  return (
    <form action={action} className="card flex flex-col gap-6 p-6 sm:p-7">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      {state?.message === 'updated' && <Alert tone="good">{t.auth.updated}</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.auth.fullName}>
          <Input
            name="full_name"
            defaultValue={profile.full_name ?? ''}
            required
            autoComplete="name"
          />
        </Field>
        <Field label={t.auth.phone}>
          <Input
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={profile.phone ?? ''}
            required
            autoComplete="tel"
          />
        </Field>
      </div>

      <div className="flex items-center justify-end border-t border-line pt-5">
        <Button type="submit" disabled={pending}>
          {t.common.save}
        </Button>
      </div>
    </form>
  )
}
