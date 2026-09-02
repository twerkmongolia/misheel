'use client'

import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { AdminIcon } from './AdminIcon'

/**
 * Зураг сонгогч — урьдчилан харах, хасах боломжтой.
 *
 * ── Яагаад төрөлхийг нь орхисон бэ ─────────────────────────────────────
 * `<input type="file">` нь «Choose File · No file chosen» гэсэн хоёр хэсгийг
 * өөрөө зурдаг. Товчны бичиг нь ХӨТЧИЙН хэлээр гардаг — монгол интерфейсийн
 * дунд англи товч сууна — бөгөөд «No file chosen» мөрийг нуух, солих ямар ч
 * арга байхгүй. Тиймээс оролтыг сонгох мөрийг бүрхсэн тунгалаг давхарга
 * болгов: дарагдах чадвар хэвээр, харагдах бичиг бүхэлдээ бидний хяналтад.
 *
 * ── Урьдчилан харах ────────────────────────────────────────────────────
 * Файлын нэр нь зураг ЗӨВ эсэхийг хэлдэггүй — `IMG_4471.jpg` гэдэг нь юу ч
 * биш. Тиймээс `URL.createObjectURL` -ээр жинхэнэ зургийг нь харуулна.
 * Хаягуудыг солигдох, устах бүрд `revoke` хийнэ: эс тэгвэл сонгосон зураг
 * бүр санах ойд үлдэнэ.
 *
 * ── Хасах ──────────────────────────────────────────────────────────────
 * `input.files` нь зөвхөн `FileList` хүлээж авдаг тул `DataTransfer` -ээр
 * шинийг угсарна. Ингэснээр форм илгээхэд ҮЛДСЭН файлууд л явна — устгасан
 * зураг чимээгүй хамт орох эрсдэлгүй.
 */
export function FileInput({
  className = '',
  placeholder = 'Зураг сонгох',
  onChange,
  multiple,
  ...props
}: ComponentProps<'input'> & { placeholder?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<{ file: File; url: string }[]>([])

  /* Хаягуудыг ҮЙЛ ЯВДАЛ дотор үүсгэнэ, effect дотор биш — effect дотор
     `setState` дуудвал нэмэлт рендер үүсч, React дүрэм ч зөвшөөрөхгүй.
     Энэ effect зөвхөн ЦЭВЭРЛЭНЭ: `items` солигдоход өмнөх хаягуудыг,
     бүрдэл салахад үлдсэнийг нь. Эс тэгвэл сонгосон зураг бүр санах ойд
     үлдэнэ. */
  useEffect(() => () => items.forEach((item) => URL.revokeObjectURL(item.url)), [items])

  /** Оролтын `FileList` -ийг жагсаалттай тааруулна. */
  const sync = (next: File[]) => {
    const transfer = new DataTransfer()
    next.forEach((file) => transfer.items.add(file))
    if (ref.current) ref.current.files = transfer.files
    setItems(next.map((file) => ({ file, url: URL.createObjectURL(file) })))
  }

  const files = items.map((item) => item.file)
  const label = files.length === 0 ? placeholder : multiple ? 'Өөр зураг нэмэх' : 'Зураг солих'

  return (
    <span className="flex flex-col gap-3">
      {items.length > 0 && (
        <span className="flex flex-wrap gap-2">
          {items.map(({ url }, index) => (
            <span
              key={url}
              className="group relative block h-24 w-20 overflow-hidden rounded-[var(--r)] border border-line"
            >
              {/* Blob хаягийг `next/image` боловсруулж чадахгүй — энэ нь
                  сервер дээр байхгүй, зөвхөн хөтчийн санах ойд байгаа файл. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />

              <button
                type="button"
                aria-label={`${files[index]?.name ?? 'Зураг'} — хасах`}
                title="Хасах"
                onClick={(event) => {
                  /* Энэ бүрдэл `<label>` дотор сууна (§ ui.tsx `Field`).
                     Шошго доторх дарлага нь оролтоо идэвхжүүлдэг тул
                     `preventDefault` -гүй бол хасахын зэрэгцээ файл сонгох
                     цонх нээгдэнэ. */
                  event.preventDefault()
                  event.stopPropagation()
                  sync(files.filter((_, at) => at !== index))
                }}
                className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-[var(--r)] border border-line-strong bg-background text-muted transition-colors hover:border-foreground hover:text-foreground"
              >
                <AdminIcon name="close" className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </span>
      )}

      <span className="relative flex items-center gap-3 border-b border-line-strong py-2.5 transition-colors focus-within:border-foreground hover:border-foreground-soft">
        <AdminIcon
          name="image"
          className={`h-4 w-4 shrink-0 ${files.length ? 'text-foreground' : 'text-muted'}`}
        />
        <span className={`t-meta min-w-0 flex-1 truncate ${files.length ? '' : 'text-faint'}`}>
          {label}
        </span>

        {/* Зөвхөн СОНГОХ мөрийг бүрхэнэ — урьдчилан харах хэсгийг бүрхвэл
            хасах товчнууд дарагдахаа болино. `opacity-0` болохоос `hidden`
            БИШ: нуусан оролт гарын товчлуурт хүрэхгүй болно. */}
        <input
          ref={ref}
          type="file"
          multiple={multiple}
          onChange={(event) => {
            sync([...(event.target.files ?? [])])
            onChange?.(event)
          }}
          className={`absolute inset-0 cursor-pointer opacity-0 ${className}`}
          {...props}
        />
      </span>
    </span>
  )
}
