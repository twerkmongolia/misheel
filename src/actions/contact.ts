'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  name: z.string().trim().min(2, 'Нэрээ бичнэ үү'),
  phone: z.string().trim().max(40).optional().default(''),
  email: z.string().trim().email('И-мэйл буруу байна').or(z.literal('')).default(''),
  message: z.string().trim().min(5, 'Мессежээ бичнэ үү').max(4000),
})

type State = { error?: string; sent?: boolean } | undefined

export async function sendContactMessage(_state: State, formData: FormData): Promise<State> {
  const parsed = schema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone') ?? '',
    email: formData.get('email') ?? '',
    message: formData.get('message'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message }
  }

  // RLS: contact_messages дээр хэн ч insert хийж болно, зөвхөн ажилтан уншина.
  const supabase = await createClient()
  const { error } = await supabase.from('contact_messages').insert(parsed.data)

  if (error) {
    return { error: 'Илгээхэд алдаа гарлаа. Дараа дахин оролдоно уу.' }
  }

  return { sent: true }
}
