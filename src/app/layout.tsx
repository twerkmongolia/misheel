import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

/**
 * Хоёр дуу хоолой — өнгөгүй системд эрэмбийг ҮСГЭЭР үүсгэнэ.
 *
 * `Playfair Display` бол өндөр ялгаралтай Didone: нимгэн, зузаан зурлагын
 * зөрүү нь моод сэтгүүлийн хуудасны эрчийг авчирна. Зөвхөн МЭДЭГДЭЛ хэлнэ
 * — баатар, хэсгийн гарчиг, том тоо. Хувьсах фонт тул жин заахгүй: 400-900
 * бүхэлдээ нэг файлаас ирнэ, налуу нь тусдаа зурлагатай.
 *
 * Хоёулаа кирилл дэмждэг — монгол текст латинтай ижил чанараар зурагдана.
 */
const display = Playfair_Display({
  variable: '--font-display',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  style: ['normal', 'italic'],
  display: 'swap',
})

/**
 * `Inter` — нарийвчилсан grotesque. Их бие, шошго, тоо, удирдлага бүгд энд.
 * Serif -ийн хажууд төвийг сахисан байх нь давуу тал: гарчиг ганцаараа
 * ярьж, бусад нь мэдээлэл дамжуулна.
 */
const body = Inter({
  variable: '--font-body',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
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
 * Хуудас будагдахаас ӨМНӨ хэрэглэгчийн сонгосон горимыг тавина.
 *
 * Систем дагасан тохиолдлыг CSS (`color-scheme: light dark`) дангаараа
 * барьдаг тул энэ скрипт зөвхөн ШУУД сонголт хийсэн хүнд хэрэгтэй. Хэрэв
 * үүнийг effect дотор хийвэл эхний хүрээнд буруу горим анивчина.
 */
const bootScript = `try{var d=document.documentElement;var t=localStorage.getItem('theme');if(t==='light'||t==='dark')d.dataset.theme=t;if(!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('rv-on')}catch(e){}`

/**
 * Серверт `text/javascript`, клиентэд `text/plain`.
 *
 * React нь бүрдэл дотор `<script>` зурагдахад хөгжүүлэлтийн горимд сануулга
 * өгдөг — DOM шинэчлэлтээр орсон script хөтөч дээр ажилладаггүй учраас.
 * Бидний script-ийн ажил бол зөвхөн ЭХНИЙ HTML тул энэ ялгаа хэвийн.
 * Төрлийг сольж сануулгыг таслана (§ Next.js preventing-flash-before-hydration).
 *
 * Хоёр дахь ажил нь `rv-on`: гүйлтийн хөдөлгөөнийг ЗЭВСЭГЛЭНЭ. Загварын
 * хуудсанд элементүүд анхдагчаар ХАРАГДАНА — зөвхөн энэ анги байгаа үед
 * нуугдана. Тиймээс JS унтарсан, унасан, эсвэл скрипт ачаалагдаагүй бол
 * агуулга бүтнээрээ үлдэнэ: хөдөлгөөн бол чимэглэл, агуулгын урьдчилсан
 * нөхцөл БИШ. Хөдөлгөөн багасгах горимд огт зэвсэглэхгүй.
 */
function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // Скрипт `<html>` -ийн шинжийг гараар өөрчилдөг тул hydration-ы
    // сануулгыг дарна — энэ бол зориудын зөрүү.
    <html
      lang="mn"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <InlineScript html={bootScript} />
        {children}
      </body>
    </html>
  )
}
