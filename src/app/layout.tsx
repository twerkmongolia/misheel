import type { Metadata } from 'next'
import { Manrope, Unbounded } from 'next/font/google'
import './globals.css'

// Кирилл үсэгтэй, тод дүрстэй — студийн шөнийн уур амьсгалд тохирно.
const display = Unbounded({
  variable: '--font-display',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['500', '700'],
})

const body = Manrope({
  variable: '--font-body',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
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
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`

/**
 * Серверт `text/javascript`, клиентэд `text/plain`.
 *
 * React нь бүрдэл дотор `<script>` зурагдахад хөгжүүлэлтийн горимд сануулга
 * өгдөг — DOM шинэчлэлтээр орсон script хөтөч дээр ажилладаггүй учраас.
 * Бидний script-ийн ажил бол зөвхөн ЭХНИЙ HTML тул энэ ялгаа хэвийн.
 * Төрлийг сольж сануулгыг таслана (§ Next.js preventing-flash-before-hydration).
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
        <InlineScript html={themeScript} />
        {children}
      </body>
    </html>
  )
}
