/**
 * YouTube-ийн холбоосоос видеоны id гаргана.
 *
 * Админ дээр бүтэн холбоос буулгасан ч, зөвхөн id бичсэн ч ажиллана:
 *   https://youtu.be/u261YyMWm0g?si=xxxx
 *   https://www.youtube.com/watch?v=u261YyMWm0g
 *   https://www.youtube.com/embed/u261YyMWm0g
 *   https://www.youtube.com/shorts/u261YyMWm0g
 *   u261YyMWm0g
 */
const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

export function youtubeId(input: string | number | null | undefined): string | null {
  const value = String(input ?? '').trim()
  if (!value) return null

  if (ID_PATTERN.test(value)) return value

  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /\/embed\/([A-Za-z0-9_-]{11})/,
    /\/shorts\/([A-Za-z0-9_-]{11})/,
    /\/live\/([A-Za-z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = pattern.exec(value)
    if (match?.[1]) return match[1]
  }

  return null
}

/**
 * Видеоны зураг.
 *
 * `maxresdefault` нь бүх бичлэгт БАЙДАГГҮЙ (эх бичлэг нь HD биш бол).
 * `hqdefault` нь үргэлж байдаг тул нөөц болгож ашиглана.
 */
export function youtubeThumbnail(id: string, quality: 'max' | 'hq' = 'max'): string {
  const file = quality === 'max' ? 'maxresdefault' : 'hqdefault'
  return `https://i.ytimg.com/vi/${id}/${file}.jpg`
}

/** Cookie тавихгүй хувилбар — хэрэглэгч тоглуулах хүртэл YouTube мөшгихгүй. */
export function youtubeEmbedUrl(id: string, autoplay = false): string {
  const params = new URLSearchParams({ rel: '0', modestbranding: '1' })
  if (autoplay) params.set('autoplay', '1')
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`
}
