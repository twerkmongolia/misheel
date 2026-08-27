import { Alert, Badge, Button, Card, Empty, Field, Input, Section, Select, TableWrap, Td, Th, Textarea } from '@/components/ui'
import { createClassType, toggleActive } from '@/actions/admin'
import { formatMnt } from '@/lib/format'
import { getClassTypes } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export default async function AdminClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const search = await searchParams
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  const classTypes = await getClassTypes(true)

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Хичээлийн төрлүүд</h1>

      {search.ok && <Alert tone="good">Хадгалагдлаа.</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}

      <Card>
        <form action={createClassType} className="flex flex-col gap-4">
          <h2 className="font-semibold">Шинэ төрөл</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Slug" hint="жишээ: twerk-basics">
              <Input name="slug" required pattern="[a-z0-9\-]+" />
            </Field>
            <Field label="Нэр (MN)">
              <Input name="name_mn" required />
            </Field>
            <Field label="Нэр (EN)">
              <Input name="name_en" />
            </Field>
            <Field label="Түвшин">
              <Select name="level" defaultValue="beginner">
                <option value="beginner">Анхан шат</option>
                <option value="intermediate">Дунд шат</option>
                <option value="advanced">Ахисан шат</option>
              </Select>
            </Field>
            <Field label="Үргэлжлэх (мин)">
              <Input type="number" name="duration_min" defaultValue={60} min={15} max={300} required />
            </Field>
            <Field label="Үндсэн үнэ (₮)">
              <Input type="number" name="base_price" defaultValue={35000} min={0} step={1000} required />
            </Field>
          </div>

          <Field label="Тайлбар (MN)">
            <Textarea name="desc_mn" rows={3} />
          </Field>
          <Field label="Тайлбар (EN)">
            <Textarea name="desc_en" rows={3} />
          </Field>

          <Button type="submit" className="self-start">
            Нэмэх
          </Button>
        </form>
      </Card>

      <Section title="Бүртгэлтэй төрлүүд">
        {classTypes.length === 0 ? (
          <Empty>Одоогоор алга.</Empty>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Нэр</Th>
                <Th>Slug</Th>
                <Th>Түвшин</Th>
                <Th>Хугацаа</Th>
                <Th>Үнэ</Th>
                <Th>Төлөв</Th>
              </tr>
            </thead>
            <tbody>
              {classTypes.map((classType) => (
                <tr key={classType.id}>
                  <Td>{classType.name_mn}</Td>
                  <Td className="font-mono text-xs">{classType.slug}</Td>
                  <Td>{classType.level}</Td>
                  <Td className="tabular-nums">{classType.duration_min}м</Td>
                  <Td className="tabular-nums">{formatMnt(classType.base_price)}</Td>
                  <Td>
                    <form action={toggleActive} className="flex items-center gap-2">
                      <input type="hidden" name="table" value="class_types" />
                      <input type="hidden" name="id" value={classType.id} />
                      <input type="hidden" name="is_active" value={String(!classType.is_active)} />
                      <input type="hidden" name="back" value="/admin/classes" />
                      <button type="submit">
                        <Badge tone={classType.is_active ? 'good' : 'neutral'}>
                          {classType.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                        </Badge>
                      </button>
                    </form>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Section>
    </div>
  )
}
