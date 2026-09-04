import Link from 'next/link'
import type { ComponentProps, CSSProperties, ReactNode } from 'react'

/* ═══════════════════════════════════════════════════════════════════════════
   БҮРДЭЛ

   Хэв нь энд БИШ, `globals.css` -д амьдарна. Энэ файл зөвхөн семантик
   тавина: аль бүрдэл ямар үүрэгтэй, ямар хувилбартай вэ. Ингэснээр
   загварыг өөрчлөхөд React файл хөндөгдөхгүй, харин үүргийг өөрчлөхөд
   загвар хөндөгдөхгүй.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Сум ──────────────────────────────────────────────────────────────────
   Товч, холбоос бүрд давтагдана. Зурсан зураас нь `→` тэмдэгтээс тогтвортой:
   үсгийн фонт солигдоход хэмжээ, суурь нь хөвөхгүй. */

export function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
      className={`ico h-3.5 w-3.5 shrink-0 ${className}`}
    >
      <path d="M2 8h11M9 4l4 4-4 4" />
    </svg>
  )
}

/* ── Сүлжээний дүрс ───────────────────────────────────────────────────────
   Брэндүүдийн албан ёсны дүрс нь ДҮҮРСЭН биет байдаг ч энэ систем бүхэлдээ
   шугамаар баригдсан — дүүрсэн дүрс нь `Arrow` -ийн хажууд өөр гаралтай мэт
   харагдана. Тиймээс хоёуланг нь ижил зузаантай (1.5) зурлагаар, ижил
   дугуйрсан дөрвөлжин хүрээнд оруулж дахин зурав: танигдац хэвээр,
   гэр бүл нь нэг.

   `aria-hidden` — нэрийг нь дэргэд нь текстээр эсвэл `aria-label` -аар
   өгнө. Дүрс өөрөө хэзээ ч ганцаараа утга дамжуулахгүй. */

const socialSvg = 'ico h-[18px] w-[18px] shrink-0'

export function InstagramIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className={`${socialSvg} ${className}`}
    >
      <rect x="3" y="3" width="18" height="18" rx="5.2" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function PhoneIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${socialSvg} ${className}`}
    >
      <path d="M6.4 3.5h3.1l1.5 3.9-2 1.5a11.2 11.2 0 0 0 6.1 6.1l1.5-2 3.9 1.5v3.1a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 4.4 5.7a2 2 0 0 1 2-2.2Z" />
    </svg>
  )
}

export function MailIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${socialSvg} ${className}`}
    >
      <rect x="3" y="5.5" width="18" height="13" rx="2.6" />
      <path d="m4.2 7.6 7.8 5.8 7.8-5.8" />
    </svg>
  )
}

export function MapPinIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${socialSvg} ${className}`}
    >
      <path d="M12 21.2s6.8-5.6 6.8-11a6.8 6.8 0 1 0-13.6 0c0 5.4 6.8 11 6.8 11Z" />
      <circle cx="12" cy="10.2" r="2.5" />
    </svg>
  )
}

export function FacebookIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
      className={`${socialSvg} ${className}`}
    >
      <rect x="3" y="3" width="18" height="18" rx="5.2" />
      <path d="M15.1 8.4h-1.6a1.9 1.9 0 0 0-1.9 1.9V21" />
      <path d="M9.6 13.1h4.6" />
    </svg>
  )
}

/* ── Товч ─────────────────────────────────────────────────────────────────
   Дөрвөн үүрэг. Нэрс нь ХУУЧНААР үлдэв — 20 гаруй дуудлагын газрыг
   дэмий хөдөлгөхгүйн тулд. Харагдах байдал нь бүхэлдээ шинэ. */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  // Дүүрсэн. Хуудсанд ГАНЦ л байна — hover дээр дүүргэлт эргэнэ.
  primary: 'btn-solid',
  // Хүрээтэй. Hover дээр дүүрч, үндсэн товч болж хувирна.
  secondary: 'btn-line',
  // Хүрээгүй. Гуравдагч үйлдэл — анхаарал бараг татахгүй.
  ghost: 'btn-bare',
  // Тасархай хүрээ. Санамсаргүй дарахаас ХЭЛБЭРЭЭРЭЭ сэргийлнэ.
  danger: 'btn-risk',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: Variant }) {
  return <button className={`btn ${variants[variant]} ${className}`} {...props} />
}

export function ButtonLink({
  variant = 'primary',
  className = '',
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`btn ${variants[variant]} ${className}`} {...props} />
}

/* ── Шошго ба гарчиг ──────────────────────────────────────────────────── */

/**
 * Хэсгийн шошго. Богино зураас дагалдана — эйброу ганцаараа хөвж байвал
 * гарчгийн блок хаанаас эхэлж байгаа нь тодорхойгүй үлддэг.
 */
export function Eyebrow({ children, plain = false }: { children: ReactNode; plain?: boolean }) {
  if (plain) return <span className="t-label text-muted">{children}</span>

  return (
    <span className="flex items-center gap-3 text-muted">
      <span aria-hidden className="h-px w-6 shrink-0 bg-line-strong" />
      <span className="t-label">{children}</span>
    </span>
  )
}

/**
 * Хэсэг.
 *
 * Гарчиг ба үйлдэл нэг шугам дээр сууна: шугам нь хоёрыг ХОЛБОНО. Шугам
 * өөрөө гүйлтэд татагдана — хэсэг эхэлж байгааг хөдөлгөөн зарлана.
 */
export function Section({
  title,
  eyebrow,
  action,
  children,
  className = '',
}: {
  title?: ReactNode
  eyebrow?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`flex flex-col gap-9 ${className}`}>
      {(title || action) && (
        <div className="flex flex-col gap-5">
          {eyebrow && (
            <div data-rv>
              <Eyebrow>{eyebrow}</Eyebrow>
            </div>
          )}
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4" data-rv>
            {title && <h2 className="t-h2">{title}</h2>}
            {action}
          </div>
          <div className="hr hr-draw" data-rv="line" />
        </div>
      )}
      {children}
    </section>
  )
}

/**
 * Хуудасны толгой.
 *
 * Гарчиг нь дэлгэцийн өргөнөөс хамаарч 2.25rem-4.25rem хооронд урсана.
 * Тайлбар нь гарчгийн ДООР биш, ХАЖУУД сууна — уншигч гарчгийг уншаад
 * шууд доош үргэлжлүүлэх бус, хажуу тийш нүдээ шилжүүлнэ. Ингэснээр
 * толгой хэсэг хуудсыг битүүлэхгүй, зөвхөн нээнэ.
 *
 * ── Яагаад `.enter`, `data-rv` БИШ вэ ──────────────────────────────────
 * Хуудасны толгой нь ТОДОРХОЙЛОЛТООРОО дэлгэц нээгдмэгц харагдана. Түүнийг
 * гүйлтийн ажиглагчид уях нь: «энэ сайтын 26 хуудасны гол гарчиг нь
 * IntersectionObserver ачаалж чадсан эсэхээс хамаарна» гэсэн үг. Ажиглагч
 * алдвал `opacity: 0` -д үүрд гацна — тэр яг л туузан дээр тохиолдсон
 * (§ site/PageBanner.tsx). globals.css § 6 өөрөө энэ дүрмийг бичсэн:
 * дээд хэсэг ЦАГААР, доод хэсэг ГҮЙЛТЭЭР. `Section` нь гүйлтэд үлдэнэ —
 * тэр нь тодорхойлолтоороо доор байдаг.
 */
export function PageHeader({
  title,
  lead,
  eyebrow,
}: {
  title: ReactNode
  lead?: ReactNode
  eyebrow?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-7 pb-4">
      {eyebrow && (
        <div className="enter">
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
      )}
      <div className="g12 items-end gap-y-6">
        <h1
          className="t-h1 enter col-span-12 lg:col-span-7"
          style={{ '--d': '60ms' } as CSSProperties}
        >
          {title}
        </h1>
        {lead && (
          <p
            className="t-lead enter col-span-12 text-foreground-soft lg:col-span-4 lg:col-start-9"
            style={{ '--d': '140ms' } as CSSProperties}
          >
            {lead}
          </p>
        )}
      </div>
      <div className="hr enter-line" style={{ '--d': '200ms' } as CSSProperties} />
    </header>
  )
}

/* ── Гадарга ──────────────────────────────────────────────────────────── */

export function Card({
  children,
  className = '',
  interactive = false,
}: {
  children: ReactNode
  className?: string
  interactive?: boolean
}) {
  return (
    <div className={`card p-7 ${interactive ? 'card-link' : ''} ${className}`}>{children}</div>
  )
}

/**
 * Төлөвийн шошго.
 *
 * Монохром систем дээр өнгө байхгүй тул ялгааг ХЭЛБЭР үүсгэнэ:
 *   accent  → дүүрсэн        · онцолсон
 *   good    → дүүрсэн + ✓    · баталгаажсан, эерэг
 *   warn    → тод хүрээ      · анхаарал шаардсан
 *   danger  → тасархай + ✕   · боломжгүй, цуцлагдсан
 *   neutral → бүдэг дүүргэлт · энгийн мэдээлэл
 *
 * ── Яагаад тэмдэг нэмэгдсэн бэ ─────────────────────────────────────────
 * Өмнө нь `good` ба `accent` хоёр АЛЬ АЛЬ нь `tag-fill` байсан — өөрөөр
 * хэлбэл «Төлөгдсөн» ба «Онлайн» хоёр яг ижил харагдана. Дөрвөн хэлбэр нь
 * таван төлөвт хүрэхгүй.
 *
 * Хоёуланг нь дүүрсэн байлгах нь зөв: аль аль нь анхаарал татах ёстой.
 * Тиймээс ялгааг ЗУРЛАГА үүсгэнэ — дүүрсэн хэлбэр дээрх ганц тэмдэг
 * (§ globals.css `.tag-mark`). `aria-hidden` шаардахгүй: тэмдэг нь
 * `::before` -ээр зурагдах тул хандах модонд огт ордоггүй, харин утга нь
 * шошгын текстэд аль хэдийн бий.
 */
export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'good' | 'warn' | 'danger'
}) {
  const tones = {
    neutral: 'tag-mute',
    accent: 'tag-fill',
    good: 'tag-fill tag-mark',
    warn: 'tag-line',
    danger: 'tag-dash tag-mark',
  }
  const marks: Partial<Record<typeof tone, string>> = { good: '\u2713', danger: '\u2715' }

  return (
    <span className={`tag ${tones[tone]}`} data-mark={marks[tone]}>
      {children}
    </span>
  )
}

/**
 * Мэдэгдэл. Ялгаа нь зүүн ирмэгийн хэв болон текстийн жинд — өнгөнд биш.
 *
 * ── Яагаад тэмдэг нэмэгдсэн бэ ─────────────────────────────────────────
 * Өмнө нь `good` нь 2px тод шугам, `danger` нь 3px тод шугам байв. Нэг
 * пикселийн зөрүү бол ялгаа биш: «Хадгалагдлаа» ба «Алдаа гарлаа» хоёрыг
 * хажуу хажууд нь тавихгүйгээр ялгах боломжгүй. Монохром систем нь өнгөө
 * орлуулах ӨӨР материал олох ёстой болохоос ялгааг арилгах эрхгүй.
 *
 * Одоо гурван зэрэгцээ дохио: зүүн ирмэгийн ЗУЗААН (2 → 4px), ДЭВСГЭР
 * (`surface` → `surface-3`), болон ТЭМДЭГ (✓ / !). Гурвуулаа нэг чиглэлд
 * заана.
 *
 * ── `role` ────────────────────────────────────────────────────────────
 * `status` нь эелдэг: дэлгэц уншигч одоогийн уншилтаа дуусгаад дараа нь
 * хэлнэ. Алдаа тэр болтол хүлээж болохгүй — хэрэглэгч аль хэдийн дараагийн
 * талбар руу шилжсэн байна. Тиймээс `danger` нь `alert`.
 */
export function Alert({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'good' | 'warn' | 'danger'
  children: ReactNode
}) {
  const tones = {
    neutral: 'border-l-2 border-line bg-surface text-foreground-soft',
    good: 'border-l-2 border-foreground bg-surface text-foreground',
    warn: 'border-l-2 border-dashed border-line-strong bg-surface text-foreground-soft',
    danger: 'border-l-4 border-foreground bg-surface-3 font-medium text-foreground',
  }
  const marks = { neutral: null, good: '\u2713', warn: null, danger: '!' } as const

  return (
    <div
      className={`t-small flex items-start gap-2.5 px-5 py-4 ${tones[tone]}`}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      {marks[tone] && (
        <span aria-hidden className="shrink-0 font-bold">
          {marks[tone]}
        </span>
      )}
      <span className="min-w-0">{children}</span>
    </div>
  )
}

/**
 * Хоосон төлөв. «Юу ч алга» гэдгийг ҮГЭЭР биш ХЭЛБЭРЭЭР эхэлж хэлнэ:
 * тасархай тойрог, дотор нь ганц зураас.
 */
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 border border-dashed border-line px-5 py-14 text-center sm:px-6 sm:py-24">
      <span
        aria-hidden
        className="grid h-11 w-11 place-items-center rounded-full border border-dashed border-line-strong text-muted"
      >
        <span className="h-px w-4 bg-current" />
      </span>
      <span className="t-small max-w-[42ch] text-muted">{children}</span>
    </div>
  )
}

/* ── Форм ─────────────────────────────────────────────────────────────────
   Хайрцаг биш ШУГАМ. Фокуслахад доод шугам зүүнээс баруун тийш татагдана
   (§ globals.css `.ctl`) — хүрээ өнгө солихоос хамаагүй тодорхой дохио. */

export function Field({
  label,
  hint,
  children,
}: {
  label: ReactNode
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="t-label text-muted">{label}</span>
      {children}
      {hint && <span className="t-meta text-faint">{hint}</span>}
    </label>
  )
}

export function Input({ className = '', ...props }: ComponentProps<'input'>) {
  return <input className={`ctl ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }: ComponentProps<'textarea'>) {
  return <textarea className={`ctl ${className}`} rows={4} {...props} />
}

export function Select({ className = '', ...props }: ComponentProps<'select'>) {
  return <select className={`ctl ${className}`} {...props} />
}

/* ── Хүснэгт ──────────────────────────────────────────────────────────────
   Хүрээгүй. Мөрүүдийг зөвхөн хэвтээ шугам тусгаарлана — босоо шугам
   нэмбэл хүснэгт тор болж, уншилтын урсгал таслагдана. */

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="t-small w-full min-w-[560px] border-collapse">{children}</table>
    </div>
  )
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={`t-label border-b border-line-strong px-0 py-3 pr-6 text-left text-muted last:pr-0 ${className}`}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  className = '',
  colSpan,
}: {
  children?: ReactNode
  className?: string
  colSpan?: number
}) {
  return (
    <td
      colSpan={colSpan}
      className={`border-b border-line px-0 py-5 pr-6 align-top last:pr-0 ${className}`}
    >
      {children}
    </td>
  )
}
