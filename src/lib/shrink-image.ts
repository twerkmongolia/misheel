/**
 * Зургийг ХӨТӨЧ ДЭЭР жижигрүүлнэ — серверт хүрэхээс өмнө.
 *
 * ── Яагаад энд, серверт биш вэ ────────────────────────────────────────────
 * Сервер хүртэл нь очих боломжгүй. Server Action -ы биеийн хязгаар
 * (§ next.config.ts `bodySizeLimit`) нь хүсэлтийг ЗАДЛАХ давхаргад буюу
 * бидний ямар ч код ажиллахаас өмнө барьдаг: 12MB зураг илгээвэл
 * «Алдаа гарлаа» гэсэн хоосон хуудас гарах бөгөөд шалтгааныг нь хэлэх
 * газар байхгүй.
 *
 * Утсаар авсан зураг 4-12MB байдаг нь хэвийн. Ажилтнаас «эхлээд шахаад
 * ир» гэж шаардах нь тэднийг өөр программ руу явуулна — тэр нь зураг
 * оруулахгүй байх хамгийн найдвартай шалтгаан болно.
 *
 * ── Юу хийдэг вэ ──────────────────────────────────────────────────────────
 * Хамгийн урт талыг нь багасгаж, WEBP болгон дахин кодлоно. Багтахгүй бол
 * чанараа нэг шат буулгаад дахин оролдоно; тэр ч хүрэхгүй бол хэмжээгээ
 * дахин багасгана.
 *
 * ── Юуг нь БҮҮ хөнд ───────────────────────────────────────────────────────
 * Аль хэдийн жижиг файлыг дахин кодлохгүй: WEBP → WEBP гэсэн дахин
 * кодлолт бүр чанарыг бууруулдаг ба хожих зүйл алга.
 *
 * Алдаа гарвал (хөтөч тухайн хэлбэрийг тайлж чадахгүй, canvas хаалттай)
 * ЭХ файлаа буцаана: шахалт бол сайжруулалт, урьдчилсан нөхцөл БИШ. Тэр
 * тохиолдолд хэмжээний шалгалт (§ admin/FileInput.tsx) ойлгомжтой мессеж
 * өгнө.
 */

/** Хамгийн урт тал. 2000px нь 4:5 хөрөгт 1600×2000 — вэбэд илүү хэрэггүй. */
const MAX_EDGE = 2000

/** Чанарын шатууд. 0.82 нь нүдэнд ялгагдахааргүй, 0.5 нь ч гэсэн эвтэйхэн. */
const QUALITY_STEPS = [0.82, 0.66, 0.52]

/** Хэмжээ буулгах оролдлогын тоо — тус бүр 25% -иар багасна. */
const RESIZE_PASSES = 4

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
}

/**
 * `IMG_4471.HEIC` → `IMG_4471.webp`. Сервер өргөтгөлөөр нь замаа угсардаг
 * (§ actions/admin.ts `uploadImage`) тул нэр нь агуулгатайгаа таарах ёстой.
 *
 * Өргөтгөлийг ХҮСЭЛТЭЭС биш ХАРИУНААС авна: `toBlob` нь тухайн хэлбэрийг
 * дэмжихгүй бол дуугүйхэн PNG буцаадаг (тодорхойлолтоор). Тэр үед `.webp`
 * гэж нэрлэвэл файлын нэр худал болно.
 */
function renameFor(name: string, type: string): string {
  const ext = type === 'image/png' ? 'png' : type === 'image/jpeg' ? 'jpg' : 'webp'
  return `${name.replace(/\.[^.]+$/, '') || 'image'}.${ext}`
}

export async function shrinkImage(file: File, maxBytes: number): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  /* Аль хэдийн багтаж байгаа бөгөөд том биш зургийг хөндөхгүй. Хязгаарын
     дөрөвний нэг гэдэг нь ойролцоогоор 1MB — тэр хэмжээний зураг вэбэд
     аль хэдийн зохистой. */
  if (file.size <= maxBytes / 4) return file

  let bitmap: ImageBitmap
  try {
    // `from-image` — утасны зураг EXIF эргэлттэй ирдэг. Үүнгүй бол
    // хэвтээ зураг босоо болж хадгалагдана.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return file
  }

  try {
    let edge = MAX_EDGE

    for (let pass = 0; pass < RESIZE_PASSES; pass++) {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height))
      const width = Math.max(1, Math.round(bitmap.width * scale))
      const height = Math.max(1, Math.round(bitmap.height * scale))

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const context = canvas.getContext('2d')
      if (!context) return file

      context.drawImage(bitmap, 0, 0, width, height)

      for (const quality of QUALITY_STEPS) {
        const blob = await toBlob(canvas, quality)
        if (!blob) return file

        if (blob.size <= maxBytes) {
          /* Анхных нь жижиг байсан бол (жишээ нь маш сайн шахагдсан JPEG)
             эхийг нь үлдээнэ — дахин кодлолт нь зөвхөн чанар алдуулна. */
          if (blob.size >= file.size) return file
          const type = blob.type || 'image/webp'
          return new File([blob], renameFor(file.name, type), {
            type,
            lastModified: Date.now(),
          })
        }
      }

      edge = Math.round(edge * 0.75)
    }

    return file
  } finally {
    bitmap.close?.()
  }
}
