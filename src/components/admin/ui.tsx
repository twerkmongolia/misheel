import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { AdminIcon, type NavIcon } from './AdminIcon'

/**
 * Удирдлагын дизайн систем.
 *
 * Яагаад `@/components/ui` -г дахин ашиглаагүй вэ: нийтийн сайт МОНОХРОМ
 * бөгөөд төлөвийг хэлбэрээр (дүүрсэн / хүрээтэй / тасархай) заадаг. Тэр
 * шийдэл маркетингийн хуудсанд зөв ч, удирдлагад алдаа болдог — «Төлөгдсөн»
 * ба «Цуцлагдсан» хоёр яг ижил хар бөмбөлөг болж, хүснэгтийг гүйлгэж
 * харахад ялгагдахаа больдог. Энд өнгө бол чимэг биш, МЭДЭЭЛЭЛ.
 *
 * Хэмжээсийн систем (нягтрал):
 *   радиус  — карт 14px, товч/оролт 8px  (сайт 20px — тэр нь агуулгын хуудас)
 *   өндөр   — товч 36px, жижиг товч 30px, хүснэгтийн мөр ~44px
 *   зай     — хэсэг хооронд 24px, хэсэг доторх 12-16px
 */

/* ── Товч ──────────────────────────────────────────────────────────────── */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

/**
 * Товч нь НИЙТИЙН САЙТЫН товч (§ globals.css `.btn`). Өмнө нь удирдлага
 * өөрийн гэсэн дугуйрсан, ногоон, сүүдэртэй товчтой байв — өөр өнгө, өөр
 * хэлбэр нь хоёр өөр програм мэт мэдрүүлдэг.
 *
 * Hover дээр дүүргэлт доороос дээш ЭРГЭНЭ: цагаан товч хар болж, хар товч
 * цагаан болно. Монохром системд боломжтой цорын ганц жинхэнэ өөрчлөлт.
 */
const variants: Record<Variant, string> = {
  primary: 'btn-solid',
  secondary: 'btn-line',
  ghost: 'btn-bare',
  // Тасархай хүрээ — санамсаргүй дарахаас ХЭЛБЭРЭЭРЭЭ сэргийлнэ.
  danger: 'btn-risk',
}

const sizes: Record<Size, string> = {
  sm: 'btn-sm',
  md: '',
}

const buttonBase = 'btn'

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: Variant; size?: Size }) {
  return (
    <button className={`${buttonBase} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />
  )
}

export function ButtonLink({
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return (
    <Link className={`${buttonBase} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />
  )
}

/* ── Хуудасны толгой ───────────────────────────────────────────────────── */

/**
 * Хуудас бүр ижил бүтэцтэй эхэлнэ: нэр → нэг мөр тайлбар → үйлдэл.
 * Тайлбар нь чимэг биш — «энэ дэлгэц юу хийдэг вэ» гэдгийг шинэ ажилтанд
 * зааж өгнө.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          {/* Гарчиг нь serif — нийтийн сайттай нэг дуу хоолой. Тайлбар нь
              чимэг биш: «энэ дэлгэц юу хийдэг вэ» гэдгийг шинэ ажилтанд
              зааж өгнө. */}
          <h1 className="t-h2">{title}</h1>
          {description && <p className="t-small mt-2 max-w-[68ch] text-muted">{description}</p>}
        </div>
        {/* Утсан дээр үйлдэл нь БҮТЭН ӨРГӨН болно. Гарчгийн хажууд шахагдсан
            жижиг товч нь хамгийн олон дардаг зүйл байтал хамгийн бага бай
            болдог — 44px хүрэлцээний доод хэмжээнд ч хүрэхгүй. */}
        {actions && (
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            {actions}
          </div>
        )}
      </div>
      <div className="hr" />
    </header>
  )
}

/* ── Хайрцаг ───────────────────────────────────────────────────────────── */

export function Panel({
  title,
  description,
  actions,
  children,
  flush = false,
  className = '',
}: {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  /** Хүснэгт өөрөө ирмэг хүртэл дүүрэх үед доторх зайг авна. */
  flush?: boolean
  className?: string
}) {
  return (
    /* ── Яагаад одоо КАРТ болов ──────────────────────────────────────────
       Өмнө нь самбар нь зөвхөн дээд гарчиг + доод зураастай, дэвсгэргүй
       блок байв. Тэр нь editorial хуудсанд зөв — нэг баганат текстэд
       хайрцаг хэрэггүй. Харин удирдлагад нэг дэлгэц дээр 3-5 самбар
       зэрэгцэн суудаг бөгөөд заримд нь хүснэгт, заримд нь форм байдаг:
       зураас дангаараа «энэ хаана дуусаж, дараагийнх хаанаас эхэлж
       байна» гэдгийг хэлж чадахаа болино.

       Карт нь ХИЛ өгнө. Гадарга нь дэвсгэрээс нэг шат ялгарч, доторх
       бүх зүйл нэг биетийн эд анги болж уншигдана.

       `overflow-hidden` нь ЗААВАЛ: доторх хүснэгт, жагсаалт ирмэг хүртэл
       дүүрдэг тул тэдгээрийн булан картын радиусаар тайрагдах ёстой. */
    <section className={`admin-card flex flex-col overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {/* Хуудсанд ГУРВАН түвшний эрэмбэ байх ёстой:
                  хуудасны нэр  → `t-h2`, serif, 28-44px
                  хэсгийн нэр   → `t-h3`, sans, 17-21px   ← энэ
                  баганын нэр   → `t-label`, 11px
                Эхний оролдлогод хэсгийн нэрийг 11px шошго болгосон нь
                дунд түвшинг бүхэлд нь алгасаж, гарчиг ба хүснэгтийн толгой
                хоёрыг ижил жинтэй болгож байв. */}
            {title && <h2 className="t-h3">{title}</h2>}
            {description && <p className="t-meta mt-1.5 text-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
        </div>
      )}
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </section>
  )
}

/**
 * Хумигддаг хэсэг — «шинээр нэмэх» формуудад.
 *
 * Өмнө нь хуудас бүр задгай формоор эхэлж, ажилтны ХАРАХ гэж ирсэн өгөгдөл
 * дэлгэцээс доош түлхэгддэг байв. Нэмэх нь ховор, харах нь байнга — тиймээс
 * форм анхдагчаар хумигдсан. `<details>` тул JS шаардахгүй.
 */
export function Disclosure({
  summary,
  children,
  defaultOpen = false,
  icon = 'plus',
  flush = false,
}: {
  summary: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  /** `plus` нь нээгдэхдээ × болж эргэнэ; бусад дүрс хөдөлгөөнгүй. */
  icon?: NavIcon
  flush?: boolean
}) {
  return (
    <details open={defaultOpen} className="admin-card group overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-5 py-3.5 text-sm font-semibold transition-colors hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-[var(--r)] border border-line text-foreground ${
            icon === 'plus' ? 'transition-transform duration-200 group-open:rotate-45' : ''
          }`}
        >
          <AdminIcon name={icon} className="h-3.5 w-3.5" />
        </span>
        {summary}
      </summary>
      <div className={`border-t border-line ${flush ? '' : 'p-5'}`}>{children}</div>
    </details>
  )
}

/* ── Үзүүлэлт ──────────────────────────────────────────────────────────── */

export function StatCard({
  icon,
  label,
  value,
  hint,
  href,
}: {
  icon: NavIcon
  label: string
  value: string | number
  hint?: ReactNode
  href?: string
}) {
  /* Тоо нь serif — нийтийн сайтын «том тоо» -той нэг дуу хоолой (§ `.t-num`).

     Өмнө нь эдгээр нь хайрцаггүй, зөвхөн босоо зураасаар тусгаарлагдсан
     НЭГ зурвас байв. Тэр нь тайван ч нэг сул талтай: зурваст холбоос
     байгааг нүд олж хардаггүй. Дөрвөөс хоёр нь дарагдаж хуудас нээдэг
     атлаа гуравдугаарынхтайгаа яг ижил харагддаг байлаа.

     Одоо тус бүр өөрийн карттай. Дарагддаг нь `admin-card-link` авна —
     тайван үедээ ялгарахгүй ч хулгана хүрмэгц өргөгдөж, «энэ хаа нэгтээ
     хөтөлнө» гэдгээ хэлнэ (§ globals.css). */
  const body = (
    <>
      <span className="t-label flex items-center gap-2 text-muted">
        <AdminIcon name={icon} className="h-3.5 w-3.5 shrink-0" />
        {label}
      </span>
      <span className="t-num mt-3 block text-[2rem] sm:text-[2.5rem]">{value}</span>
      {/* Тогтмол өндөр: тайлбаргүй карт хажуугийнхаасаа намхан болвол
          дөрвөн тоо нэг шугам дээр эгнэхээ болино. */}
      <span className="t-meta mt-2 block h-4 text-muted">{hint}</span>
    </>
  )

  const shell = 'admin-card px-4 py-4 sm:px-5 sm:py-5'

  return href ? (
    <Link href={href} className={`${shell} admin-card-link group`}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  )
}

/**
 * Үзүүлэлтийн тор — `StatCard` -уудыг багтаана.
 *
 * Урьд нь эдгээр нь хоорондоо зураасаар наалдсан НЭГ зурвас байв. Карт
 * болсны дараа наалдуулах нь утгагүй: хоёр хөрш картын хүрээ зэрэгцвэл
 * 2px зузаан давхар зураас үүсдэг. Тиймээс зай нь тэднийг тусгаарлана —
 * `gap` бол хамгийн цэвэр тусгаарлагч.
 */
export function StatRow({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
}

/* ── Төлөв ─────────────────────────────────────────────────────────────── */

export type Tone = 'neutral' | 'good' | 'warn' | 'danger' | 'info'

/**
 * Төлөвийн шошго.
 *
 * Монохром систем дээр өнгө байхгүй тул ялгааг ХЭЛБЭР үүсгэнэ — нийтийн
 * сайттай яг ижил дүрэм (§ globals.css `.tag`):
 *
 *   good    → дүүрсэн        · баталгаажсан, дууссан
 *   info    → бүдэг дүүргэлт · явцад буй
 *   warn    → тод хүрээ      · анхаарал шаардсан
 *   danger  → тасархай хүрээ · цуцлагдсан, боломжгүй
 *   neutral → бүдэг дүүргэлт · энгийн мэдээлэл
 *
 * Өнгө дангаараа мэдээлэл дамжуулж БОЛОХГҮЙ (WCAG 1.4.1) — энд өнгө огт
 * байхгүй тул текст ба хэлбэр хоёулаа ажиллана.
 */
const badgeTones: Record<Tone, string> = {
  neutral: 'tag-mute',
  good: 'tag-fill',
  warn: 'tag-line',
  danger: 'tag-dash',
  info: 'tag-mute',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`tag ${badgeTones[tone]}`}>{children}</span>
}

/** Ялгаа нь зүүн ирмэгийн ХЭВ болон текстийн жинд — өнгөнд биш. */
const alertTones: Record<Tone, { box: string; icon: NavIcon }> = {
  neutral: { box: 'border-line text-foreground-soft', icon: 'info' },
  good: { box: 'border-foreground text-foreground', icon: 'success' },
  warn: { box: 'border-line-strong border-dashed text-foreground-soft', icon: 'alert' },
  danger: { box: 'border-foreground border-l-[3px] font-medium text-foreground', icon: 'alert' },
  info: { box: 'border-line text-foreground-soft', icon: 'info' },
}

export function Alert({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  const { box, icon } = alertTones[tone]
  return (
    <div className={`t-small flex items-start gap-3 border-l-2 bg-surface px-5 py-4 ${box}`} role="status">
      <AdminIcon name={icon} className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="min-w-0">{children}</span>
    </div>
  )
}

export function EmptyState({ icon, title, hint }: { icon: NavIcon; title: ReactNode; hint?: ReactNode }) {
  return (
    /* Гадна хүрээгүй. Хоосон төлөв нь ҮРГЭЛЖ картын дотор суудаг (§ `Panel`)
       тул тасархай тэгш өнцөгт нь картын хатуу хүрээний дэргэд наалдаж,
       хоёр давхар хайрцаг үүсгэж байв. «Хоосон» гэдэг дохиог дүрсийг
       тойрсон тасархай тойрог аль хэдийн хэлж байгаа. */
    <div className="flex flex-col items-center gap-4 px-5 py-14 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full border border-dashed border-line-strong text-muted">
        <AdminIcon name={icon} className="h-[18px] w-[18px]" />
      </span>
      <div>
        <p className="t-small font-medium">{title}</p>
        {hint && <p className="t-small mt-1 max-w-[42ch] text-muted">{hint}</p>}
      </div>
    </div>
  )
}

/* ── Формын элементүүд ─────────────────────────────────────────────────── */

/* Хайрцаг биш ШУГАМ — фокуслахад доод шугам зүүнээс баруун тийш татагдана
   (§ globals.css `.ctl`). Нийтийн сайтын формтой яг ижил. */
const control = 'ctl'

export function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: ReactNode
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="t-label text-muted">{label}</span>
      {children}
      {hint && <span className="t-meta text-faint">{hint}</span>}
    </label>
  )
}

export function Input({ className = '', ...props }: ComponentProps<'input'>) {
  return <input className={`${control} ${className}`} {...props} />
}

export function Select({ className = '', ...props }: ComponentProps<'select'>) {
  return <select className={`${control} ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }: ComponentProps<'textarea'>) {
  return <textarea className={`${control} ${className}`} rows={3} {...props} />
}

export { FileInput } from './FileInput'

/** Формын доод мөр — үндсэн үйлдэл баруун талд, тусгаарлах зураастай. */
/**
 * Формын үйлдлийн мөр.
 *
 * `sticky` нь УРТ формд: талбар нь дэлгэцэнд багтахгүй үед хадгалах товч
 * доод ирмэгт наалдаж, ажилтан бөглөж дуусаад доош гүйлгэх шаардлагагүй
 * болно. «Бөглөчихсөн атлаа хадгалах товч хаана байна» гэдэг нь урт
 * формын хамгийн түгээмэл гацаа.
 *
 * Сөрөг зах (`-mx-6`) нь цонхны их биеийн ДОТООД зайг (§ `DialogFrame`
 * `p-6`) буцаан татаж, мөрийг ирмэгээс ирмэг хүртэл дүүргэнэ — эс бөгөөс
 * хажуугийн 24px зайгаар доорх агуулга гүйж харагдана. Тиймээс энэ нь
 * ЦОНХНЫ дотор л зөв: самбар доторх формд асуухгүй.
 */
export function FormActions({
  children,
  sticky = false,
}: {
  children: ReactNode
  sticky?: boolean
}) {
  return (
    <div
      className={`mt-2 flex flex-wrap items-center justify-end gap-3 border-t border-line pt-5 ${
        sticky
          ? 'sticky bottom-0 z-10 -mx-6 -mb-6 bg-surface/95 px-6 pt-4 pb-6 backdrop-blur-sm'
          : ''
      }`}
    >
      {children}
    </div>
  )
}

/* ── Шүүлтүүр ──────────────────────────────────────────────────────────── */

export function FilterChip({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      /* Нийтийн сайтын шүүлтийн чиптэй ижил (§ globals.css `.chip`).
         Сонгогдсон нь ЭРГЭНЭ — дугуй бөмбөлөг биш, 3px булантай. */
      className={`chip ${active ? 'chip-on' : ''}`}
    >
      {children}
    </Link>
  )
}

/* ── Хайлт ба хуудаслалт ───────────────────────────────────────────────── */

/**
 * Хайлтын мөр — JavaScript-гүй GET форм.
 *
 * Хайлт нь хаяганд үлддэг (`?q=…`) тул хуудсыг хуваалцах, сэргээх, буцах
 * товч бүгд ажиллана. Хайсан үгээ талбарт нь эргүүлж тавина — юу хайснаа
 * мартах нь хамгийн олон давтагддаг эвгүй мөч.
 */
export function SearchBox({
  placeholder,
  defaultValue,
  hidden = {},
}: {
  placeholder: string
  defaultValue?: string
  /** Хайхад ХАДГАЛАГДАХ бусад шүүлт (төлөв, ангилал гэх мэт). */
  hidden?: Record<string, string | undefined>
}) {
  return (
    <form className="flex items-end gap-3">
      {Object.entries(hidden).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
      <label className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="t-label text-muted">Хайх</span>
        <Input name="q" defaultValue={defaultValue} placeholder={placeholder} />
      </label>
      <Button type="submit">Хайх</Button>
      {defaultValue ? (
        <ButtonLink href="?" variant="ghost">
          Цэвэрлэх
        </ButtonLink>
      ) : null}
    </form>
  )
}

/**
 * Хуудаслалт.
 *
 * Жагсаалтууд 100-200 мөрөөр таслагдаж, түүнээс цааш ХҮРЭХ АРГАГҮЙ байв —
 * 300 дахь захиалга оршин байсаар атал харагдахгүй. Одоо хязгаар нь
 * хуудасны хэмжээ болж, цаашлах зам гарлаа.
 *
 * Нийт тоог харуулна: «41–60 / 312». Хуудасны дугаар ганцаараа хаана
 * байгааг хэлдэггүй.
 */
export function Pager({
  page,
  pageSize,
  total,
  href,
}: {
  page: number
  pageSize: number
  total: number
  /** Хуудасны дугаараас хаяг угсарна — бусад шүүлт хадгалагдана. */
  href: (page: number) => string
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <nav className="flex items-center justify-between gap-4 border-t border-line pt-4">
      <span className="t-meta text-muted tnum">
        {from}–{to} / {total}
      </span>

      <span className="flex items-center gap-2">
        {page > 1 ? (
          <ButtonLink href={href(page - 1)} size="sm">
            ← Өмнөх
          </ButtonLink>
        ) : null}
        <span className="t-meta text-faint tnum">
          {page} / {pages}
        </span>
        {page < pages ? (
          <ButtonLink href={href(page + 1)} size="sm">
            Дараах →
          </ButtonLink>
        ) : null}
      </span>
    </nav>
  )
}

/* ── Хүснэгт ───────────────────────────────────────────────────────────── */

/**
 * Мөр дээгүүр гүйлгэхэд тодрох (hover) нь урт мөрийг нүдээр дагахад тусална.
 * Сүүлийн мөрийн доод зураасыг авна — картын хүрээтэй давхацдаг.
 *
 * Тодрох өнгө нь `surface-2` — `surface` БИШ. Хүснэгт нь одоо картын дотор
 * (§ `Panel`) суудаг бөгөөд картын дэвсгэр өөрөө `surface` тул тэр нь
 * харагдахгүй болно: hover байгаа ч мэдрэгдэхгүй байх нь hover огт
 * байхгүйгээс ДОР — ажилтан мөр дагаж чадахгүй атлаа систем эвдэрсэн эсэхийг
 * мэдэхгүй.
 */
export function Table({ children, minWidth = 640 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table
        // `admin-table` нь жижиг дэлгэц дээр мөрийг карт болгож задална
        // (§ globals.css «Утасны төрх»). `--tbl-min` нь зөвхөн md-ээс дээш.
        className="admin-table t-small [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-150 [&_tbody_tr:hover]:bg-surface-2 [&_tbody_tr:last-child>td]:border-b-0"
        style={{ '--tbl-min': `${minWidth}px` } as React.CSSProperties}
      >
        {children}
      </table>
    </div>
  )
}

export function Th({
  children,
  className = '',
  align = 'left',
}: {
  children?: ReactNode
  className?: string
  align?: 'left' | 'right'
}) {
  return (
    <th
      /* Дэвсгэргүй. Хүснэгтийн толгойг өнгөөр биш ШУГАМААР тусгаарлана —
         саарал зурвас нь хүснэгтийг хайрцаг болгодог. */
      className={`t-label border-b border-line-strong px-4 py-3 text-muted ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${className}`}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  className = '',
  colSpan,
  align = 'left',
  label,
}: {
  children?: ReactNode
  className?: string
  colSpan?: number
  align?: 'left' | 'right'
  /**
   * Утсан дээр энэ нүдний өмнө гарах шошго — багана хаана байсныг орлоно.
   * Мөрийн гарчиг (эхний нүд) болон үйлдлийн нүдэнд ӨГӨХГҮЙ: тэдгээр нь
   * шошгогүйгээр өөрсдөө ойлгогдоно.
   */
  label?: string
}) {
  return (
    <td
      colSpan={colSpan}
      data-label={label}
      className={`border-b border-line px-4 py-3.5 align-middle ${
        align === 'right' ? 'text-right' : ''
      } ${className}`}
    >
      {children}
    </td>
  )
}

/** Хүснэгт доторх хоёрдогч мөр — жишээ нь утас, хаяг нэрийн доор. */
export function Sub({ children }: { children: ReactNode }) {
  return <span className="mt-0.5 block text-xs text-muted">{children}</span>
}
