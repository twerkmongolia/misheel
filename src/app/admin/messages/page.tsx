import { Alert, Badge, Empty } from '@/components/ui'
import { markMessageRead } from '@/actions/admin'
import { formatDateTime } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export default async function AdminMessagesPage() {
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  const supabase = await createClient()
  const { data: messages } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Ирсэн мессеж</h1>

      {!messages || messages.length === 0 ? (
        <Empty>Мессеж алга.</Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((message) => (
            <li
              key={message.id}
              className={`flex flex-col gap-2 rounded-xl border bg-surface p-4 ${
                message.is_read ? 'border-line' : 'border-foreground'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{message.name}</p>
                  <p className="text-xs text-muted tabular-nums">
                    {[message.phone, message.email].filter(Boolean).join(' · ')} ·{' '}
                    {formatDateTime(message.created_at, 'mn')}
                  </p>
                </div>

                {message.is_read ? (
                  <Badge tone="neutral">Уншсан</Badge>
                ) : (
                  <form action={markMessageRead}>
                    <input type="hidden" name="message_id" value={message.id} />
                    <button type="submit" className="text-sm text-foreground underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-foreground">
                      Уншсан болгох
                    </button>
                  </form>
                )}
              </div>

              <p className="text-sm whitespace-pre-wrap text-foreground-soft">{message.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
