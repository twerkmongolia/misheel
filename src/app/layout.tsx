import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Oswald, Rubik } from 'next/font/google'
import { defaultLocale, isLocale, LOCALE_HEADER } from '@/lib/i18n/config'
import './globals.css'

/**
 * Хоёр дуу хоолой.
 *
 * `Oswald` — нарийссан (condensed), том үсгээр хүчтэй уншигддаг grotesque.
 * Спортын постер, тоглолтын зурагт хуудасны хэл: өндөр, шахуу, шийдэмгий.
 * Зөвхөн МЭДЭГДЭЛ хэлнэ — баатар, хэсгийн гарчиг, үнэ, лого, шошго.
 *
 * Хувьсах фонт тул жин заахгүй: 200-700 бүхэлдээ нэг файлаас ирнэ. Налуу
 * зурлага БАЙХГҮЙ — тиймээс кодын хаана ч `italic` бичихгүй (хөтөч
 * зохиомол налуу үүсгэж, зурлагыг гуйвуулна).
 */
const display = Oswald({
  variable: '--font-display',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
})

/**
 * `Rubik` — бага зэрэг дугуйрсан булантай geometric grotesque. Их бие,
 * шошго, тоо, удирдлага бүгд энд. Oswald -ийн хатуу босоо шугамын хажууд
 * зөөлөн байх нь давуу тал: гарчиг ганцаараа хашгирч, бие нь тайван ярина.
 *
 * ── Дэд олонлог (subset) ───────────────────────────────────────────────
 * Зөвхөн `latin` + `cyrillic`. `next/font` нь олонлог бүрийг тусад нь файл
 * болгож, БҮГДИЙГ нь урьдчилан татдаг тул хэрэггүй олонлог бүр эхний
 * зурагдалтыг шууд саатуулна.
 */
const body = Rubik({
  variable: '--font-body',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Twerk Mongolia',
    template: '%s · Twerk Mongolia',
  },
  description: 'Улаанбаатар дахь twerk бүжгийн студи — хичээлийн хуваарь, бүртгэл, дэлгүүр.',
}

/**
 * Сайт нь ЗӨВХӨН харанхуй.
 *
 * `colorScheme: 'dark'` нь хөтчид уугуул удирдлагуудыг (гүйлтийн зурвас,
 * сонголтын жагсаалт, формын анхдагч төрх) харанхуйгаар зурахыг хэлнэ —
 * эс бөгөөс тэдгээр нь цайвар хэвээр гарч, монохром системийн дундуур
 * огт өөр ертөнцийн хэсэг наасан мэт харагдана.
 *
 * `themeColor` нь гар утасны хөтчийн хаягийн мөрийг будна: хуудас
 * дэлгэцийн ирмэг хүртэл үргэлжилсэн мэт мэдрэгдэнэ. Ганц утга — сонгох
 * горим байхгүй тул нөхцөлт жагсаалт шаардахгүй.
 */
export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0D0D0D',
}

/**
 * Зурагдахаас ӨМНӨ ажиллах мөрийн скрипт.
 *
 * Ганц ажил үлдсэн: гүйлтийн хөдөлгөөнийг ЗЭВСЭГЛЭХ (`rv-on`). Загварын
 * хуудсанд элементүүд анхдагчаар ХАРАГДАНА — зөвхөн `rv-on` анги байгаа үед
 * нуугдана. Тиймээс JS унтарсан, унасан, эсвэл скрипт ачаалагдаагүй бол
 * агуулга бүтнээрээ үлдэнэ: хөдөлгөөн бол чимэглэл, агуулгын урьдчилсан
 * нөхцөл БИШ. Хөдөлгөөн багасгах горимд огт зэвсэглэхгүй.
 *
 * Өмнө нь энэ скрипт өнгөний горимыг ч тавьдаг байсан (`localStorage` -оос
 * уншиж `data-theme` бичих). Сайт ганц горимтой болсон тул тэр хэсэг
 * хасагдав — зурагдахаас өмнө ажилладаг код богиносох бүр эхний пикселийн
 * хугацаа шууд хожно.
 */
const bootScript = `try{var d=document.documentElement;if(!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('rv-on')}catch(e){}`

/**
 * Серверт `text/javascript`, клиентэд `text/plain`.
 *
 * React нь бүрдэл дотор `<script>` зурагдахад хөгжүүлэлтийн горимд сануулга
 * өгдөг — DOM шинэчлэлтээр орсон script хөтөч дээр ажилладаггүй учраас.
 * Бидний script-ийн ажил бол зөвхөн ЭХНИЙ HTML тул энэ ялгаа хэвийн.
 * Төрлийг сольж сануулгыг таслана (§ Next.js preventing-flash-before-hydration).
 */
function InlineScript({ html, nonce }: { html: string; nonce?: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/**
 * `lang` нь ЗАМААС ирнэ, тогтмол БИШ.
 *
 * Энэ layout нь `[locale]` segment-ээс дээр сууна — `params` хүрэхгүй,
 * `next/root-params` ч ажиллахгүй (тэр нь зөвхөн үндсэн layout-аас ДЭЭШ
 * байгаа segment-д зориулагдсан). Тиймээс `proxy.ts` зам дахь хэлээ
 * `x-locale` толгойд наагаад дамжуулна.
 *
 * Өмнө нь энд `lang="mn"` гэж бичээстэй байсан: `/en/...` хуудас бүр
 * өөрийгөө монгол гэж зарладаг байв. Дэлгэц уншигч англи өгүүлбэрийг
 * монгол дуудлагаар уншиж, хайлтын систем хэлийг буруу индекслэнэ —
 * хоёулаа ганц атрибутаас болсон.
 *
 * Толгой ирээгүй бол (proxy-ийн matcher-аас гадуурх зам) анхдагч хэл.
 */
export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const head = await headers()
  const requested = head.get(LOCALE_HEADER) ?? ''
  const lang = isLocale(requested) ? requested : defaultLocale

  /**
   * CSP -ийн nonce.
   *
   * Next нь ӨӨРИЙН скрипт бүрд үүнийг автоматаар наадаг ч энэ мөрийн
   * скрипт нь бидний бичсэн тул гараар дамжуулна. Дутвал `script-src`
   * түүнийг хаах ба `rv-on` анги хэзээ ч нэмэгдэхгүй — өөрөөр хэлбэл
   * хөдөлгөөн бүхэлдээ унтарна (агуулга нь ХАРАГДСАН хэвээр, § globals.css § 6).
   */
  const nonce = head.get('x-nonce') ?? undefined

  return (
    // Скрипт `<html>` -ийн ангид `rv-on` нэмдэг тул hydration-ы сануулгыг
    // дарна — энэ бол зориудын зөрүү.
    <html
      lang={lang}
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <InlineScript html={bootScript} nonce={nonce} />
        {children}
      </body>
    </html>
  )
}
