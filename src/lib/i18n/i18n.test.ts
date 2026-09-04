import { describe, expect, it } from 'vitest'
import { content, loc } from './index'
import { getDictionary, type Dictionary } from './dictionaries'
import { isLocale, locales } from './config'

describe('isLocale', () => {
  it('зөвхөн мэддэг хэлээ хүлээж авна', () => {
    expect(isLocale('mn')).toBe(true)
    expect(isLocale('en')).toBe(true)
    expect(isLocale('ru')).toBe(false)
    expect(isLocale('')).toBe(false)
    // Proxy нь замын эхний segment-ийг шууд дамжуулдаг тул эдгээр нь
    // бодит оролт: `/EN/shop`, `/mn-MN/shop`.
    expect(isLocale('EN')).toBe(false)
    expect(isLocale('mn-MN')).toBe(false)
  })
})

describe('loc', () => {
  const row = { name_mn: 'Анхан шат', name_en: 'Beginner', desc_mn: 'Тайлбар', desc_en: '' }

  it('хүссэн хэлний талбарыг өгнө', () => {
    expect(loc(row, 'name', 'mn')).toBe('Анхан шат')
    expect(loc(row, 'name', 'en')).toBe('Beginner')
  })

  it('англи хувилбар ХООСОН бол монгол руу унана', () => {
    // Админ бүх талбарыг хоёр хэлээр бөглөдөггүй. Хоосон мөр харуулах
    // нь монголоор харуулахаас ДОР.
    expect(loc(row, 'desc', 'en')).toBe('Тайлбар')
  })

  it('зөвхөн зайнаас бүрдсэн утгыг ч хоосонд тооцно', () => {
    expect(loc({ name_mn: 'Нэр', name_en: '   ' }, 'name', 'en')).toBe('Нэр')
  })

  it('талбар огт байхгүй бол хоосон мөр', () => {
    expect(loc({} as Record<string, unknown>, 'name', 'mn')).toBe('')
  })
})

describe('content', () => {
  const row = {
    value_mn: { title: 'Гарчиг', fee: 5000 },
    value_en: { title: 'Title', fee: 5000 },
  }

  it('хэлээрээ сонгоно', () => {
    expect(content(row, 'en').title).toBe('Title')
    expect(content(row, 'mn').title).toBe('Гарчиг')
  })

  it('англи jsonb ХООСОН бол монгол руу унана', () => {
    expect(content({ ...row, value_en: {} }, 'en').title).toBe('Гарчиг')
  })

  it('мөр байхгүй бол хоосон объект — дуудагч задлахад алдахгүй', () => {
    expect(content(null, 'mn')).toEqual({})
    expect(content(undefined, 'en')).toEqual({})
  })
})

describe('толь бичиг', () => {
  /**
   * Монгол нь эх сурвалж (`type Dictionary = typeof mn`) тул англи нь
   * бүтцээрээ ЗААВАЛ тохирно — үүнийг TypeScript барина. Тестийн ажил нь
   * ХООСОН утга хайх: төрлийн систем `''` -ийг бүрэн утга гэж үзнэ.
   */
  const emptyStrings = (value: unknown, path: string[] = []): string[] => {
    if (typeof value === 'string') return value.trim() === '' ? [path.join('.')] : []
    if (value && typeof value === 'object') {
      return Object.entries(value).flatMap(([key, inner]) => emptyStrings(inner, [...path, key]))
    }
    return []
  }

  it.each(locales)('%s хэлэнд хоосон мөр байхгүй', (locale) => {
    const dictionary: Dictionary = getDictionary(locale)
    /*
     * Зориудаар хоосон утгууд:
     *   about.shows.v2 — тайлбаргүй шоу.
     *   today.weekday  — монголд «Пүрэв ГАРАГ» гэсэн дагавар байдаг ч
     *                    англид «Thursday day» гэж хэлэхгүй.
     */
    const intentional = new Set(['about.shows.v2', 'today.weekday'])
    const found = emptyStrings(dictionary).filter((path) => !intentional.has(path))
    expect(found).toEqual([])
  })
})
