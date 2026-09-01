'use client'

import { useActionState } from 'react'
import { Alert, Button, Field, Input, Textarea } from '@/components/ui'
import { sendContactMessage } from '@/actions/contact'
import type { Dictionary } from '@/lib/i18n/dictionaries'

/**
 * Холбоо барих форм.
 *
 * ── Илгээсний дараа ────────────────────────────────────────────────────
 * Урьд нь форм бүхэлдээ алга болж, оронд нь нэг мөр жижиг мэдэгдэл үлддэг
 * байв. Дөнгөж сая дөрвөн талбар бөглөсөн хүнд энэ нь «хуудас эвдэрсэн үү»
 * гэсэн мэдрэмж төрүүлдэг: том блок алга болоод жижиг зүйл үлдсэн.
 *
 * Одоо баталгаажуулалт нь өөрөө БҮТЭН блок — тэмдэг, гарчиг, тайлбар.
 * Оруулсан хөдөлмөрийн хэмжээтэй тэнцүү хариу.
 *
 * ── Талбарын зохион байгуулалт ─────────────────────────────────────────
 * Нэр, утас хоёр богино тул зэрэгцэнэ; и-мэйл, мессеж урт тул бүтэн мөр.
 * Дөрвөн талбар босоо жагсаад байснаас форм нь хоёр дахин богино
 * харагдана — уншигч «энэ удаан үргэлжлэх юм байна» гэж бодохгүй.
 */
export function ContactForm({ t }: { t: Dictionary }) {
  const [state, action, pending] = useActionState(sendContactMessage, undefined)

  if (state?.sent) {
    return (
      <div className="card flex flex-col items-start gap-6 p-8 sm:p-10" data-rv>
        <span
          aria-hidden
          className="grid h-12 w-12 place-items-center rounded-full border border-line-strong"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
            className="h-5 w-5"
          >
            <path d="M4 12.5l5 5L20 7" />
          </svg>
        </span>

        <div className="flex flex-col gap-2.5">
          <h3 className="t-h3">{t.contact.sentTitle}</h3>
          <p className="t-small max-w-[42ch] text-muted">{t.contact.sent}</p>
        </div>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-7" data-rv>
      {state?.error && <Alert tone="danger">{state.error}</Alert>}

      <div className="grid gap-7 sm:grid-cols-2">
        <Field label={t.auth.fullName}>
          <Input name="name" required autoComplete="name" />
        </Field>
        <Field label={t.auth.phone}>
          <Input name="phone" type="tel" autoComplete="tel" />
        </Field>
      </div>

      <Field label={t.auth.email}>
        <Input name="email" type="email" autoComplete="email" />
      </Field>

      <Field label={t.contact.message}>
        <Textarea name="message" required rows={6} />
      </Field>

      {/* Товч нь ажиллаж байгаагаа ҮГЭЭР хэлнэ — идэвхгүй болсон товч
          ганцаараа «дарагдсан уу, үгүй юу» гэдгийг тодорхойгүй үлдээдэг. */}
      <Button type="submit" disabled={pending} className="w-full sm:w-auto sm:self-start">
        {pending ? t.contact.sending : t.common.submit}
      </Button>
    </form>
  )
}
