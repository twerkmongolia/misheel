/* ───────────────────────────────────────────────────────────────────────────
   ГРАФИКИЙН ГЕОМЕТР — ЦЭВЭР ФУНКЦУУД

   Сан (Recharts, ApexCharts …) нэмээгүй: хоёр график, нэг бөгж — тэдний
   хэрэгцээ нь доорх гурван функц. 100KB-ийн сан нь энд түүнээс өөр юу ч
   өгөхгүй бөгөөд CSP, SSR, харанхуй горимтой нь тус бүр нь тохиргоо
   шаардана.
   ─────────────────────────────────────────────────────────────────────── */

export type Point = readonly [x: number, y: number]

const NICE = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]

/**
 * Тэнхлэгийн «гоё» алхмууд: 0-ээс эхлээд `count` алхам, сүүлийнх нь
 * `peak` -аас багагүй. Алхам нь 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8 × 10ⁿ — хүн
 * толгойдоо уншдаг тоонууд («300 мян», «600 мян»), «283 мян» биш.
 *
 * Сонгодог 1-2-5 цуваа нь хэт ХОЛ үсэрдэг: 505 мянган оргилд 800 мянга
 * хүртэлх тэнхлэг зурж, графикийн дээд гуравны нэг хоосон үлдэнэ. Энэ
 * цуваа оргилыг тэнхлэгийн 70–100% -д байлгана.
 *
 * Алхам нь 1-ээс багагүй: мөнгө, ширхэг хоёулаа бүхэл тоо — «0.8 захиалга»
 * гэсэн шошго утгагүй.
 *
 * Өгөгдөл хоосон (тэг) бол зөвхөн `[0]` — дурын хуваарь зурах нь
 * «энд хэмжээ бий» гэсэн худал дохио болно.
 */
export function niceTicks(peak: number, count = 4): number[] {
  if (!(peak > 0)) return [0]
  const raw = peak / count
  const exp = 10 ** Math.floor(Math.log10(raw))
  const fraction = raw / exp
  const nice = NICE.find((candidate) => fraction <= candidate) ?? 10
  // `nice * exp` нь 10⁻ⁿ дээр 0.30000000000000004 гаргадаг — 12 оронд тайрч цэвэрлэнэ.
  const step = Math.max(Number((nice * exp).toPrecision(12)), 1)
  return Array.from({ length: count + 1 }, (_, index) => Number((index * step).toPrecision(12)))
}

const round = (value: number) => Math.round(value * 100) / 100

/**
 * Цэгүүдийг дайрсан ГӨЛГӨР муруй — монотон куб (Steffen, d3-ийн
 * `curveMonotoneX` -тай ижил).
 *
 * ⚠️ Энгийн «гөлгөрүүлэлт» (Catmull-Rom, cardinal) нь цэгүүдийн хооронд
 * ХЭТЭРДЭГ: 0 → 500 мян → 0 гэсэн гурван өдрийн хооронд шугам тэгээс доош
 * унжиж, «сөрөг орлого» зурна; оргилын дээгүүр гарч, байгаагүй дүнг
 * харуулна. Монотон арга нь хөрш хоёр цэгийн хоорондох хэсэг бүрийг тэр
 * хоёр цэгийн утгын ХҮРЭЭНД барина — гөлгөр боловч худал хэлэхгүй.
 */
export function monotonePath(points: readonly Point[]): string {
  const count = points.length
  if (count === 0) return ''
  const [x0, y0] = points[0]!
  if (count === 1) return `M${round(x0)},${round(y0)}`

  const xs = points.map((point) => point[0])
  const ys = points.map((point) => point[1])

  // Хөрш цэгүүдийн хоорондох налуу
  const secants = xs.slice(0, -1).map((x, index) => (ys[index + 1]! - ys[index]!) / (xs[index + 1]! - x))

  const tangents = new Array<number>(count).fill(0)
  for (let index = 1; index < count - 1; index++) {
    const before = secants[index - 1]!
    const after = secants[index]!
    const h0 = xs[index]! - xs[index - 1]!
    const h1 = xs[index + 1]! - xs[index]!
    const blend = (before * h1 + after * h0) / (h0 + h1)
    /* Хоёр налуу эсрэг тэмдэгтэй (оргил, хонхор) бол шүргэгч 0 — муруй
       тэр цэг дээр хэвтээ эргэнэ, давж гарахгүй. */
    tangents[index] =
      (Math.sign(before) + Math.sign(after)) *
        Math.min(Math.abs(before), Math.abs(after), 0.5 * Math.abs(blend)) || 0
  }

  if (count === 2) {
    tangents[0] = tangents[1] = secants[0]!
  } else {
    tangents[0] = (3 * secants[0]! - tangents[1]!) / 2
    tangents[count - 1] = (3 * secants[count - 2]! - tangents[count - 2]!) / 2
  }

  let path = `M${round(x0)},${round(y0)}`
  for (let index = 0; index < count - 1; index++) {
    const dx = (xs[index + 1]! - xs[index]!) / 3
    path +=
      `C${round(xs[index]! + dx)},${round(ys[index]! + dx * tangents[index]!)}` +
      ` ${round(xs[index + 1]! - dx)},${round(ys[index + 1]! - dx * tangents[index + 1]!)}` +
      ` ${round(xs[index + 1]!)},${round(ys[index + 1]!)}`
  }
  return path
}

/** Муруйн доорх талбай — шугамаас `baseline` (тэнхлэгийн тэг) хүртэл хаалттай. */
export function areaPath(points: readonly Point[], baseline: number): string {
  if (points.length < 2) return ''
  const first = points[0]!
  const last = points[points.length - 1]!
  return `${monotonePath(points)}L${round(last[0])},${round(baseline)}L${round(first[0])},${round(baseline)}Z`
}
