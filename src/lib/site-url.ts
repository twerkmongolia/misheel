import 'server-only'

import { headers } from 'next/headers'

/**
 * И-мэйлийн холбоос буцаж ирэх ЭХ ХАЯГ (`https://…`).
 *
 * ── Яагаад орчны хувьсагчид найдаж болохгүй вэ ────────────────────────────
 * Өмнө нь `process.env.NEXT_PUBLIC_SITE_URL ?? ''` байв. Гурван байдлаар
 * ЧИМЭЭГҮЙ унадаг:
 *
 *   · Хувьсагч БАЙХГҮЙ (Vercel дээр тавихаа мартсан) → `'/auth/callback…'`
 *     гэсэн ХАРЬЦАНГУЙ зам үүснэ. Supabase харьцангуй хаягийг хүлээж авдаггүй
 *     тул түүнийг хаяад төслийн «Site URL» рүү унана — өөрөөр хэлбэл `next`
 *     алга болно: нууц үг сэргээх и-мэйл дарсан хүн нууц үгийн маягт дээр
 *     биш НҮҮР ХУУДАС дээр буух ба юу хийхээ мэдэхгүй үлдэнэ.
 *
 *   · Хувьсагч нь `http://localhost:3000` хэвээр (яг одоо `.env.local` дээр
 *     байгаа утга) → production-д илгээсэн и-мэйл localhost руу заана.
 *
 *   · Preview deployment бүр өөрийн домэйнтой → нэг тогтмол утга хэзээ ч
 *     бүгдэд таарахгүй.
 *
 * ── Яагаад хүсэлтийн толгойноос уншиж болох вэ ────────────────────────────
 * Хүн ЯМАР хаяг дээр байгаад маягтыг илгээсэн, и-мэйл нь ТЭР хаяг руу
 * буцаах ёстой — localhost, preview, production гурвуулаа өөрөө зөв болно.
 *
 * `Host` толгой нь хүсэлт илгээгчийн гарт байдаг ч энд аюул болохгүй:
 * эцсийн шүүлт нь Supabase талын «Redirect URLs» цагаан жагсаалт. Тэнд
 * байхгүй хаяг руу Supabase хэзээ ч буцаахгүй — зөвхөн Site URL руу унана.
 * (Тиймээс тэр жагсаалтыг ЧАНГА байлгах нь чухал: `*` бүү тавь.)
 *
 * `NEXT_PUBLIC_SITE_URL` нь толгой байхгүй үед л (жишээ нь cron, script)
 * хэрэглэгдэх нөөц зам болж үлдэнэ.
 */
export async function siteOrigin(): Promise<string> {
  const h = await headers()

  /* Vercel болон бусад proxy нь ЖИНХЭНЭ домэйныг `x-forwarded-*` дотор
     дамжуулна; `host` нь дотоод хаяг байж мэднэ. Тиймээс эхлээд тэрийг. */
  const host = h.get('x-forwarded-host') ?? h.get('host')

  if (host) {
    const proto = h.get('x-forwarded-proto') ?? (isLocal(host) ? 'http' : 'https')
    return `${proto}://${host}`
  }

  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ?? ''
}

function isLocal(host: string): boolean {
  return host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('[::1]')
}
