import type { CSSProperties } from 'react'

/**
 * Ачаалалтын араг яс.
 *
 * Бүх хуудас нь сервер дээр зурагддаг (`ƒ`) тул эхний байт нь Supabase-ийн
 * хариунаас хойш явна. `loading.tsx` -гүй бол тэр хугацаанд хөтөч ӨМНӨХ
 * хуудсан дээр зогсоно: хэрэглэгч дарсан ч юу ч болоогүй мэт мэдрэгдэнэ.
 *
 * Араг яс нь эргэлдэх дугуйнаас дээр: ирэх зохиомжийн ХЭЛБЭРийг зурдаг
 * тул агуулга ирэхэд нүд шинээр байрлал хайхгүй, хуудас үсэрч мэдрэгдэхгүй.
 *
 * ⚠️ Хэмжээ нь жинхэнэ хуудастайгаа ойролцоо байх ёстой. Хэт жижиг араг яс
 * нь агуулга ирэхэд том үсрэлт үүсгэдэг — тэр нь араг яс огт байхаас ч
 * дор. Тиймээс энд ашигласан зай, өндөр нь `PageHeader`, `.card` -тай
 * тааруулсан (§ components/ui `PageHeader`).
 *
 * `aria-hidden` + `role="status"`: дэлгэц уншигчид хоосон хайрцгуудыг
 * уншиж өгөх нь утгагүй, харин «ачаалж байна» гэдгийг нэг удаа хэлэх нь
 * хэрэгтэй.
 */
export function PageSkeleton({
  rows = 3,
  media = false,
  bare = false,
}: {
  /** Хэдэн мөр/карт зурах вэ. */
  rows?: number
  /** Мөр бүр зурагтай юу (дэлгүүр, галерей, анги). */
  media?: boolean
  /**
   * Эцэг layout нь `.shell` -ээ аль хэдийн тавьсан бол (§ account/layout).
   * Давхарлавал захын зай хоёр дахин орж, араг яс нь ирэх агуулгатайгаа
   * эгнэхээ болино.
   */
  bare?: boolean
}) {
  return (
    <div
      className={`flex flex-col gap-12 ${bare ? '' : 'shell pt-12 sm:pt-16'}`}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">…</span>

      {/* Толгой — гарчиг + тайлбар + доогуур зураас */}
      <div aria-hidden className="flex flex-col gap-7 pb-4">
        <div className="g12 items-end gap-y-6">
          <div className="col-span-12 flex flex-col gap-3 lg:col-span-7">
            <div className="sk sk-line h-[2.75rem] w-[68%]" />
            <div className="sk sk-line h-[2.75rem] w-[42%]" />
          </div>
          <div
            className="col-span-12 flex flex-col gap-2 lg:col-span-4 lg:col-start-9"
            style={{ '--sk-d': '180ms' } as CSSProperties}
          >
            <div className="sk sk-line w-full" />
            <div className="sk sk-line w-[70%]" />
          </div>
        </div>
        <div className="hr" />
      </div>

      {/* Их бие */}
      <div aria-hidden className={media ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-5'}>
        {Array.from({ length: rows }, (_, index) => (
          /*
            Шүүрдэлтийн саатал КАРТ дээр сууна, блок бүр дээр биш —
            CSS хувьсагч удамшдаг тул доторх зураг, мөрүүд бүгд НЭГ
            цуваанд орно. Карт бүр өмнөхөөсөө 120ms хоцорч, гэрэл
            жагсаалтын дагуу дамжина.

            Дээд хязгаар нь мөчлөгийн урт (1.5s): түүнээс цааш саатуулбал
            зургаа дахь карт нэгдүгээртэй давхцаж, цуваа алдагдана.
          */
          <div
            key={index}
            className="card flex flex-col gap-4 p-6"
            style={{ '--sk-d': `${(index * 120) % 1500}ms` } as CSSProperties}
          >
            {media && <div className="sk aspect-[4/3] w-full" />}
            <div className="sk sk-line w-[55%]" />
            <div className="sk sk-line w-[80%]" />
            <div className="sk sk-line w-[35%]" />
          </div>
        ))}
      </div>
    </div>
  )
}
