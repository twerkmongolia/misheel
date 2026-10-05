import { describe, expect, it } from 'vitest'
import { areaPath, monotonePath, niceTicks, type Point } from './chart'

/* ───────────────────────────────────────────────────────────────────────────
   ГРАФИКИЙН ГЕОМЕТР

   Муруй нь «гоё» харагдах тусам худал хэлэх эрсдэлтэй: хоёр цэгийн хооронд
   тэгээс доош унжвал график сөрөг орлого зурна. Нүдээр анзаарагдахгүй
   (шугам ердөө хэдэн пикселээр унждаг) тул энд баригдана.
   ─────────────────────────────────────────────────────────────────────── */

/** Path-ын `C` хэсгүүдийг куб Безье болгон задална. */
function segments(path: string): [Point, Point, Point, Point][] {
  const numbers = (text: string) => text.split(/[ ,]+/).filter(Boolean).map(Number)
  const [start, ...curves] = path.split('C')
  let from = numbers(start!.slice(1)) as unknown as Point
  return curves.map((curve) => {
    const [ax, ay, bx, by, cx, cy] = numbers(curve)
    const segment: [Point, Point, Point, Point] = [from, [ax!, ay!], [bx!, by!], [cx!, cy!]]
    from = [cx!, cy!]
    return segment
  })
}

function bezierY([p0, p1, p2, p3]: [Point, Point, Point, Point], t: number): number {
  const u = 1 - t
  return u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
}

describe('niceTicks', () => {
  it('хүний уншдаг алхмаар, оргилоос багагүй хүрнэ', () => {
    expect(niceTicks(1_130_000)).toEqual([0, 300_000, 600_000, 900_000, 1_200_000])
    expect(niceTicks(900_000)).toEqual([0, 250_000, 500_000, 750_000, 1_000_000])
  })

  it('оргил нь тэнхлэгийн дээд хэсэгт — графикийн гуравны нэг хоосон үлдэхгүй', () => {
    // 1-2-5 цуваа энд 800 мянга хүртэл зурна (оргил 63%-д)
    const ticks = niceTicks(505_000)
    expect(ticks.at(-1)).toBe(600_000)
  })

  it('бүхэл тоо — бутархай алхамгүй', () => {
    expect(niceTicks(3)).toEqual([0, 1, 2, 3, 4])
    expect(niceTicks(1.1)).toEqual([0, 1, 2, 3, 4])
  })

  it('хоосон өгөгдөлд дурын хуваарь зурахгүй', () => {
    expect(niceTicks(0)).toEqual([0])
  })
})

describe('monotonePath', () => {
  it('цэг бүрийг дайрна', () => {
    const points: Point[] = [[0, 10], [50, 40], [100, 20]]
    const parts = segments(monotonePath(points))
    expect(parts.map((part) => part[3])).toEqual([[50, 40], [100, 20]])
  })

  it('хөрш хоёр цэгийн утгын хүрээнээс ХЭТРЭХГҮЙ — тэгээс доош унжихгүй', () => {
    // SVG-д y доошоо өснө: 300 бол тэнхлэгийн тэг. 0 → оргил → 0 → 0 → оргил.
    const points: Point[] = [[0, 300], [100, 20], [200, 300], [300, 300], [400, 120], [500, 280]]
    for (const segment of segments(monotonePath(points))) {
      const low = Math.min(segment[0][1], segment[3][1])
      const high = Math.max(segment[0][1], segment[3][1])
      for (let step = 0; step <= 20; step++) {
        const y = bezierY(segment, step / 20)
        expect(y).toBeGreaterThanOrEqual(low - 1e-6)
        expect(y).toBeLessThanOrEqual(high + 1e-6)
      }
    }
  })

  it('нэг цэг бол зөвхөн байрлал', () => {
    expect(monotonePath([[5, 5]])).toBe('M5,5')
  })
})

describe('areaPath', () => {
  it('шугамыг тэнхлэг хүртэл буулгаж хаана', () => {
    const path = areaPath([[0, 10], [100, 20]], 300)
    expect(path.endsWith('L100,300L0,300Z')).toBe(true)
  })
})
