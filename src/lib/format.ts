import { formatInTimeZone } from 'date-fns-tz'
import { enUS } from 'date-fns/locale/en-US'
import type { Locale as AppLocale } from './i18n/config'

/** Студи Улаанбаатарт байрладаг. DB бүхэлдээ UTC — харуулахдаа л хөрвүүлнэ. */
export const TIMEZONE = 'Asia/Ulaanbaatar'

const MN_WEEKDAYS = ['Ня', 'Да', 'Мя', 'Лха', 'Пү', 'Ба', 'Бя']
const MN_WEEKDAYS_LONG = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба']

const mntFormatter = new Intl.NumberFormat('mn-MN')

export function formatMnt(amount: number): string {
  return `${mntFormatter.format(amount)}₮`
}

export function formatTime(iso: string): string {
  return formatInTimeZone(new Date(iso), TIMEZONE, 'HH:mm')
}

export function formatDate(iso: string, locale: AppLocale): string {
  const date = new Date(iso)
  if (locale === 'en') {
    return formatInTimeZone(date, TIMEZONE, 'd MMM yyyy', { locale: enUS })
  }
  const month = formatInTimeZone(date, TIMEZONE, 'M')
  const day = formatInTimeZone(date, TIMEZONE, 'd')
  const year = formatInTimeZone(date, TIMEZONE, 'yyyy')
  return `${year}.${month.padStart(2, '0')}.${day.padStart(2, '0')}`
}

export function formatDateTime(iso: string, locale: AppLocale): string {
  return `${formatDate(iso, locale)} ${formatTime(iso)}`
}

export function weekdayShort(iso: string, locale: AppLocale): string {
  const date = new Date(iso)
  if (locale === 'en') return formatInTimeZone(date, TIMEZONE, 'EEE', { locale: enUS })
  return MN_WEEKDAYS[Number(formatInTimeZone(date, TIMEZONE, 'i')) % 7] ?? ''
}

export function weekdayLong(iso: string, locale: AppLocale): string {
  const date = new Date(iso)
  if (locale === 'en') return formatInTimeZone(date, TIMEZONE, 'EEEE', { locale: enUS })
  return MN_WEEKDAYS_LONG[Number(formatInTimeZone(date, TIMEZONE, 'i')) % 7] ?? ''
}

/** `2026-08-29` хэлбэрээр — өдрөөр бүлэглэхэд ашиглана (УБ-ын цагаар). */
export function dayKey(iso: string): string {
  return formatInTimeZone(new Date(iso), TIMEZONE, 'yyyy-MM-dd')
}

/**
 * Улаанбаатарын цагаар тухайн долоо хоногийн эхлэл (Даваа 00:00) — UTC Date.
 * `offsetWeeks` -ээр өмнөх/дараагийн долоо хоног руу шилжинэ.
 */
export function weekStart(offsetWeeks = 0, from: Date = new Date()): Date {
  const ubDay = Number(formatInTimeZone(from, TIMEZONE, 'i')) // 1 = Даваа
  const ubDate = formatInTimeZone(from, TIMEZONE, 'yyyy-MM-dd')
  const midnightUtc = new Date(`${ubDate}T00:00:00+08:00`)
  midnightUtc.setUTCDate(midnightUtc.getUTCDate() - (ubDay - 1) + offsetWeeks * 7)
  return midnightUtc
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

/**
 * Одоогийн цаг (мс).
 *
 * Server Component нь хүсэлт бүрд нэг удаа рендер хийгддэг тул одоогийн
 * цагийг унших нь зөв. Цагийг уншдаг цорын ганц цэгийг энд төвлөрүүлснээр
 * компонентууд өөрсдөө «цэвэр бус» дуудлага хийхгүй болно.
 */
export function nowMs(): number {
  return new Date().getTime()
}
