import { Alert, Button, Card, Empty, Field, Input, Textarea } from '@/components/ui'
import { updateSiteContent } from '@/actions/admin'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'

const titles: Record<string, string> = {
  hero: 'Нүүр хуудасны эхний блок',
  about: 'Бидний тухай',
  contact: 'Холбоо барих мэдээлэл',
  booking: 'Бүртгэлийн тохиргоо',
  shop: 'Дэлгүүрийн тохиргоо',
}

/** Урт текстийг textarea-гаар харуулна. */
function isLong(value: unknown): boolean {
  return typeof value === 'string' && value.length > 80
}

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const search = await searchParams
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  const supabase = await createClient()
  const { data: rows } = await supabase.from('site_content').select('*').order('key')

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Сайтын контент</h1>

      {search.ok && <Alert tone="good">Хадгалагдлаа.</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}

      {!rows || rows.length === 0 ? (
        <Empty>Контент алга. Seed-ээ ажиллуулсан уу?</Empty>
      ) : (
        rows.map((row) => {
          const keys = [...new Set([...Object.keys(row.value_mn ?? {}), ...Object.keys(row.value_en ?? {})])]

          return (
            <Card key={row.key}>
              <form action={updateSiteContent} className="flex flex-col gap-4">
                <input type="hidden" name="key" value={row.key} />

                <div>
                  <h2 className="font-semibold">{titles[row.key] ?? row.key}</h2>
                  <p className="font-mono text-xs text-muted">{row.key}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {keys.map((field) => {
                    const mnValue = String(row.value_mn?.[field] ?? '')
                    const enValue = String(row.value_en?.[field] ?? '')
                    const long = isLong(mnValue) || isLong(enValue)

                    return (
                      <div key={field} className="contents">
                        <Field label={`${field} · MN`}>
                          {long ? (
                            <Textarea name={`mn.${field}`} defaultValue={mnValue} rows={4} />
                          ) : (
                            <Input name={`mn.${field}`} defaultValue={mnValue} />
                          )}
                        </Field>
                        <Field label={`${field} · EN`}>
                          {long ? (
                            <Textarea name={`en.${field}`} defaultValue={enValue} rows={4} />
                          ) : (
                            <Input name={`en.${field}`} defaultValue={enValue} />
                          )}
                        </Field>
                      </div>
                    )
                  })}
                </div>

                <Button type="submit" className="self-start">
                  Хадгалах
                </Button>
              </form>
            </Card>
          )
        })
      )}
    </div>
  )
}
