# Twerk Mongolia — Вэб платформын төлөвлөгөө

Огноо: 2026-08-27 · Repo: `twerk` · Next.js 16.3.3 · React 19.2.8 · Tailwind v4

## 0. Хамрах хүрээ

Нэг кодын сан, дөрвөн бүтээгдэхүүн:

| # | Модуль | Товч |
|---|--------|------|
| 1 | Танилцуулга сайт | Twerk Mongolia-гийн нүүр, бидний тухай, багш нар, хичээлийн төрлүүд, галерей, холбоо барих |
| 2 | Хуваарь + бүртгэл | Танхимын хичээлийн цагийн хуваарь, суудал захиалга, ирц |
| 3 | Онлайн дэлгүүр | Биет бараа (хувцас, merch) — хэмжээ/өнгө, нөөц, хүргэлт |
| 4 | Admin dashboard | Хуваарь, бүртгэл, захиалга, бараа, төлбөр, контент удирдлага |

**Шийдвэрлэгдсэн сонголтууд**
- Хичээл: **танхимын** (заалан дээр) — байршил, багш, цаг, суудлын багтаамжтай
- Дэлгүүр: **биет бараа** — variant (хэмжээ/өнгө), нөөц, хүргэлтийн хаяг
- Хэл: **Монгол + Англи** (`/mn`, `/en`)
- Төлбөр: **Bonum Gateway** (Монгол) — карт, QPay QR, банкны апп, Apple/Google Pay. Дотоод 1%, олон улсын 3–5%

---

## 1. Технологийн стек

| Давхарга | Сонголт | Шалтгаан |
|---|---|---|
| Framework | Next.js 16.3.3 App Router | Аль хэдийн суусан, Server Components + Server Actions нь энэ төрлийн CRUD-д хамгийн бага код шаарддаг |
| Хостинг | Vercel | Preview deploy, Cron, Image optimization бэлэн |
| DB + Auth | Supabase (Postgres + Auth + Storage) | RLS-ээр өгөгдлийн аюулгүй байдлыг DB давхаргад тавина; зураг Storage-д |
| Session | `@supabase/ssr` (cookie-based) | Server Component-ээс шууд уншина, RSC-тэй зохицдог |
| Загвар | Tailwind v4 (суусан) + өөрийн UI компонентууд | Нэмэлт UI library шаардлагагүй; хэрэгтэй бол `shadcn/ui` |
| Валидаци | `zod` | Server Action бүрийн орох өгөгдлийг шалгана |
| Хэл | `next-intl` эсвэл гар аргаар dictionary | Хоёрхон хэл тул dictionary хангалттай (§8) |
| И-мэйл | Resend | Захиалга/бүртгэлийн баталгаа, сануулга |

**Шинээр нэмэх пакетууд**
```
@supabase/supabase-js @supabase/ssr zod
resend                # и-мэйл
date-fns date-fns-tz  # цагийн бүс: Asia/Ulaanbaatar
```

---

## 2. Next.js 16 — энэ проектод нөлөөлөх ялгаанууд

> Эдгээрийг `node_modules/next/dist/docs/` дотроос шалгасан. Хуучин заавартай зөрөх тул анхаараарай.

1. **`middleware.ts` → `proxy.ts`.** Файл нь `src/proxy.ts` байна, функцээ `proxy` нэрээр эсвэл default-аар export хийнэ. Supabase-ийн олон жишээ `middleware.ts` гэж бичсэн байдаг — тэр нь энд ажиллахгүй.
2. **`params`, `searchParams` нь Promise.** `const { slug } = await params`. Layout дотор дээд түвшинд `await` хийвэл prerender эвдэрдэг тул promise-оо доош дамжуулна.
3. **`cookies()` нь async** — `(await cookies()).get(...)`.
4. **Typed routes**: `PageProps<'/shop/[slug]'>`, `LayoutProps<'/'>` global type-ууд бий (одоогийн `layout.tsx` аль хэдийн ашиглаж байна).
5. **Server Action бүр шууд POST-оор дуудагдаж болно.** UI-д товч нуусан нь хамгаалалт биш — action бүрийн эхэнд эрх шалгана.
6. **Proxy нь өгөгдлийн сан руу хандах ёсгүй** — зөвхөн cookie-ээс "optimistic" шалгалт. Жинхэнэ шалгалт нь DAL + RLS дээр.
7. **`cacheComponents` (PPR + `use cache`)** — эхний ээлжинд **асахгүй**. Маркетингийн хуудсууд тогтвортой болсны дараа тэдэн дээр нь сонгож асаана. Хуваарь, сагс, admin нь хэрэглэгч бүрд өөр тул динамик хэвээр.

---

## 3. Өгөгдлийн сангийн загвар

Бүх хүснэгт `public` schema-д, `id uuid default gen_random_uuid()`, `created_at timestamptz default now()`.

### 3.1 Хэрэглэгч ба эрх

```
profiles            id (=auth.users.id), full_name, phone, avatar_url,
                    role: 'customer'|'instructor'|'staff'|'admin',
                    locale: 'mn'|'en', created_at
instructors         id, profile_id?, name, bio_mn, bio_en, photo_url,
                    instagram, sort_order, is_active
locations           id, name, address_mn, address_en, map_url, default_capacity
```
`auth.users` дээр trigger тавьж бүртгүүлмэгц `profiles` мөр үүсгэнэ (`role='customer'`).

### 3.2 Хичээл ба хуваарь

```
class_types         id, slug, name_mn, name_en, desc_mn, desc_en,
                    level: 'beginner'|'intermediate'|'advanced',
                    duration_min, cover_url, base_price, is_active, sort_order
class_sessions      id, class_type_id, instructor_id, location_id,
                    starts_at timestamptz, ends_at timestamptz,
                    capacity int, price int, status: 'scheduled'|'cancelled'|'completed',
                    note, series_id?   -- давтагдах хуваарийн бүлэг
bookings            id, session_id, user_id, status: 'pending'|'confirmed'|
                    'cancelled'|'attended'|'no_show',
                    price_paid, payment_id?, cancelled_at, created_at
waitlist            id, session_id, user_id, created_at
```

**Чухал индекс/хязгаарлалт**
```sql
-- нэг хүн нэг цагт давхар бүртгүүлэхгүй
create unique index bookings_one_per_session
  on bookings (session_id, user_id)
  where status in ('pending','confirmed','attended');

create index class_sessions_starts_at on class_sessions (starts_at);
```

### 3.3 Дэлгүүр

```
products            id, slug, name_mn, name_en, desc_mn, desc_en,
                    category, base_price, is_active, sort_order
product_variants    id, product_id, sku, size, color, price, stock_qty
product_images      id, product_id, url, alt, sort_order
carts               id, user_id?, guest_token, updated_at
cart_items          id, cart_id, variant_id, qty
orders              id, order_no (богино, хүнд ойлгомжтой), user_id?,
                    status: 'pending_payment'|'paid'|'preparing'|'shipped'|
                            'delivered'|'cancelled'|'refunded',
                    subtotal, shipping_fee, discount, total,
                    ship_name, ship_phone, ship_district, ship_khoroo,
                    ship_address, note, created_at
order_items         id, order_id, variant_id,
                    name_snapshot, variant_snapshot, unit_price, qty
                    -- snapshot: бараа устсан ч захиалга унших боломжтой байх
discount_codes      id, code, type:'percent'|'amount', value, max_uses,
                    used_count, valid_from, valid_to, is_active
```

### 3.4 Төлбөр ба бусад

```
payments            id, provider, provider_ref, amount, currency 'MNT',
                    status: 'pending'|'paid'|'failed'|'refunded',
                    target_type: 'order'|'booking', target_id,
                    raw jsonb, paid_at
contact_messages    id, name, phone, email, message, is_read
audit_log           id, actor_id, action, entity, entity_id, diff jsonb
site_content        key, value_mn jsonb, value_en jsonb  -- hero текст, тухай г.м.
```

### 3.5 RLS (Row Level Security) бодлого

Бүх хүснэгт дээр RLS **асаана**. Үндсэн зарчим:

```sql
create function public.is_staff() returns boolean
language sql security definer stable as $$
  select exists (select 1 from profiles
                 where id = auth.uid() and role in ('staff','admin'));
$$;
```

| Хүснэгт | Нийтэд | Хэрэглэгчид | Staff/Admin |
|---|---|---|---|
| `class_types`, `class_sessions`, `instructors`, `locations`, `products`, `product_variants`, `product_images` | `select` (зөвхөн `is_active`/`scheduled`) | — | бүх эрх |
| `bookings`, `orders`, `order_items`, `carts` | — | зөвхөн `user_id = auth.uid()` | бүх эрх |
| `payments`, `audit_log` | — | зөвхөн өөрийн төлбөрөө унших | бүх эрх |
| `profiles` | — | өөрийн мөрөө унших/засах (**`role` баганыг засахыг хориглоно**) | бүх эрх |

`role` баганыг хэрэглэгч өөрөө өөрчлөхөөс сэргийлэх trigger заавал бичнэ — үгүй бол хэн ч өөрийгөө admin болгоно.

---

## 4. Аюулгүй байдал ба session

Гурван давхарга — аль нэг нь эвдэрсэн ч бусад нь барина:

1. **`src/proxy.ts`** — Supabase session cookie-г шинэчлэх + `/admin`, `/account` руу нэвтрээгүй хүнийг `/login` рүү шидэх (optimistic). DB-д хандахгүй.
2. **DAL — `src/lib/auth/dal.ts`** — `getSession()`, `requireUser()`, `requireStaff()`. React `cache()`-ээр memoize. Хуудас болон Server Action бүрийн эхэнд дуудна.
3. **RLS** — өгөгдлийн сан өөрөө татгалзана. Хамгийн сүүлийн бэхлэлт.

```
src/lib/supabase/server.ts   createServerClient (cookies() ашиглана) — RSC/Action-д
src/lib/supabase/client.ts   createBrowserClient — 'use client' компонентод
src/lib/supabase/admin.ts    service_role түлхүүр — ЗӨВХӨН webhook/cron дотор
```

- `SUPABASE_SERVICE_ROLE_KEY` нь **хэзээ ч** `NEXT_PUBLIC_` угтваргүй, client bundle-д орохгүй. `import 'server-only'` тавина.
- Нэвтрэлт: и-мэйл+нууц үг, Google OAuth. Утасны OTP хүсвэл дараа нэмнэ (SMS үнэтэй).
- `/auth/callback` route handler — OAuth болон и-мэйл баталгаажуулалтын код солилцоо.

---

## 5. Route бүтэц

```
src/
  proxy.ts                     ← middleware биш!
  app/
    [locale]/                  ← 'mn' | 'en'
      layout.tsx               header/footer, хэл сонголт
      (marketing)/
        page.tsx               Нүүр: hero, дараагийн хичээлүүд, тухай, CTA
        about/page.tsx         Twerk Mongolia-гийн түүх, эрхэм зорилго
        instructors/page.tsx   Багш нар
        instructors/[slug]/
        classes/page.tsx       Хичээлийн төрөл, түвшин, үнэ
        classes/[slug]/
        gallery/page.tsx
        faq/page.tsx
        contact/page.tsx       + Server Action → contact_messages
      (booking)/
        schedule/page.tsx      7 хоногийн хуваарь, шүүлтүүр (багш/түвшин/байршил)
        schedule/[sessionId]/  Дэлгэрэнгүй + "Бүртгүүлэх"
        booking/[id]/page.tsx  Баталгаажуулалт + төлбөрийн заавар
      (shop)/
        shop/page.tsx          Каталог, ангилал, шүүлтүүр
        shop/[slug]/page.tsx   Variant сонголт, нөөц, сагсанд нэмэх
        cart/page.tsx
        checkout/page.tsx      Хүргэлтийн хаяг + төлбөр
        order/[orderNo]/page.tsx
      (account)/
        account/page.tsx       Профайл
        account/bookings/      Миний хичээлүүд (ирээдүй/өнгөрсөн)
        account/orders/        Миний захиалгууд
      (auth)/
        login/, signup/, forgot-password/, reset-password/
    auth/callback/route.ts     OAuth code exchange (locale-гүй)
    api/
      payments/webhook/route.ts
      cron/reminders/route.ts
  components/  ui/, marketing/, booking/, shop/, admin/
  lib/         supabase/, auth/, i18n/, payments/, validation/
  actions/     bookings.ts, cart.ts, orders.ts, admin/*.ts
```

Admin нь тусдаа root-д (locale-гүй, зөвхөн монголоор):
```
    admin/
      layout.tsx               requireStaff() + sidebar
      page.tsx                 Хяналтын самбар
      schedule/                Хуваарь үүсгэх/засах, давтагдах цуврал
      bookings/                Ирц бүртгэх, цуцлах
      classes/  instructors/  locations/
      shop/products/  shop/orders/  shop/inventory/
      payments/                Гар шилжүүлэг баталгаажуулах
      customers/
      content/                 Hero, тухай, галерей
      settings/  audit/
```

---

## 6. Модуль тус бүрийн төлөвлөгөө

### 6.1 Танилцуулга сайт

- Нүүр хуудас: hero видео/зураг → "Дараагийн хичээлүүд" (3-4 карт, DB-ээс) → хичээлийн төрлүүд → багш нар → сэтгэгдэл → CTA.
- Бүх текст `site_content` хүснэгтээс — admin өөрөө засах боломжтой. Хатуу бичсэн текст үлдээхгүй.
- SEO: `generateMetadata`, OG зураг, `JSON-LD` (`LocalBusiness` + `Event` — хичээлүүд Google-д харагдана).
- Гүйцэтгэл: маркетингийн хуудсууд статик, зөвхөн "дараагийн хичээлүүд" хэсэг динамик `<Suspense>` дотор.

### 6.2 Хуваарь ба хичээлийн бүртгэл ⚠️ хамгийн эмзэг хэсэг

**Багтаамжийн уралдаан (race condition).** Хоёр хүн сүүлийн суудлыг зэрэг дарвал хоёулаа бүртгэгдэж болзошгүй. Шийдэл — Postgres функц дотор мөр түгжих:

```sql
create function public.book_session(p_session_id uuid)
returns uuid language plpgsql security definer as $$
declare v_capacity int; v_taken int; v_booking_id uuid;
begin
  select capacity into v_capacity from class_sessions
    where id = p_session_id and status = 'scheduled'
    for update;                                   -- ← мөрийг түгжинэ
  if not found then raise exception 'SESSION_NOT_AVAILABLE'; end if;

  select count(*) into v_taken from bookings
    where session_id = p_session_id
      and status in ('pending','confirmed','attended');

  if v_taken >= v_capacity then raise exception 'SESSION_FULL'; end if;

  insert into bookings (session_id, user_id, status)
  values (p_session_id, auth.uid(), 'pending')
  returning id into v_booking_id;
  return v_booking_id;
end $$;
```
Server Action нь энэ функцийг `rpc('book_session')`-ээр дуудна. Багтаамжийн логик хэзээ ч JS талд бичигдэхгүй.

- Цагийн бүс **Asia/Ulaanbaatar** — DB-д `timestamptz` (UTC), харуулахдаа `date-fns-tz`-ээр хөрвүүлнэ.
- Цуцлалтын дүрэм: хичээл эхлэхээс N цагийн өмнө үнэгүй цуцална (`settings`-д тохируулна).
- Дараалал (waitlist): дүүрсэн үед бүртгүүлж, суудал сулрахад автоматаар и-мэйл.
- Сануулга: Vercel Cron → өдөрт нэг удаа маргаашийн хичээлүүдийн и-мэйл.
- Admin ирц: хичээлийн жагсаалт дээр нэг товшилтоор `attended`/`no_show`.

### 6.3 Онлайн дэлгүүр

- **Сагс**: нэвтэрсэн хүнд DB (`carts`), зочинд `guest_token` cookie. Нэвтрэхэд зочны сагсыг нэгтгэнэ.
- **Үнэ ба нөөцийг хэзээ ч client-ээс авахгүй** — checkout дээр DB-ээс дахин уншиж тооцоолно.
- **Нөөц хасах** нь төлбөр баталгаажсан үед, Postgres функц дотор атомаар (`stock_qty = stock_qty - qty where stock_qty >= qty`).
- Хүргэлт: Улаанбаатар доторх дүүрэг/хороо сонголт + тогтмол хураамж; хөдөө орон нутаг → унаагаар (тайлбар талбар).
- Захиалгын статус солигдох бүрд и-мэйл + `audit_log`.
- Зураг: Supabase Storage → `next.config.ts`-д `images.remotePatterns` нэмнэ.

### 6.4 Төлбөр — Bonum Gateway

Баримт: `https://psp.bonum.mn/bonum-gateway-apis.html`. Merchant данс нээлгэхэд `APP_SECRET`,
`TERMINAL_ID`, `MERCHANT_CHECKSUM_KEY` гурвыг өгнө.

| Орчин | `API_BASE_URL` |
|---|---|
| Тест | `https://testapi.bonum.mn` |
| Бодит | `https://apis.bonum.mn` |

**Урсгал**

```
1. GET  /bonum-gateway/ecommerce/auth/create
        Authorization: AppSecret {APP_SECRET}
        X-TERMINAL-ID: {TERMINAL_ID}
        → { tokenType, accessToken, expiresIn, refreshToken, refreshExpiresIn }

2. POST /bonum-gateway/ecommerce/invoices
        Authorization: Bearer {accessToken}
        Accept-Language: mn | en
        { amount, callback, transactionId, expiresIn?, providers?, items?, extras? }
        → { invoiceId, followUpLink }

3. Хэрэглэгчийг followUpLink рүү шилжүүлнэ (эсвэл iframe/webview).

4. Bonum → бидний callback URL руу POST:
        { type: "PAYMENT", status: "SUCCESS" | "FAILED", message, body: {
            amount, currency, completedAt, terminalId, invoiceId,
            paymentVendor, initType, status, respCode, transactionId, extras } }
```

Нэмэлт эндпойнтууд:
- `GET /bonum-gateway/ecommerce/auth/refresh` — `Authorization: Bearer {refreshToken}`
- `GET /bonum-gateway/ecommerce/invoices/payment-providers` — идэвхтэй сувгууд: `QPAY`, `E_COMMERCE`, `WE_CHAT`, `SONO_SHOP`
- `POST /mpay-service/merchant/transaction/qr/create` — `{ amount, transactionId, expiresIn? }` → `{ invoiceId, qrCode, qrImage (base64), links[] }`. Өөрийн сайтан дээрээ QR + банкны апп-уудын deeplink харуулах бол энэ.
- Карт токен (`/mpay-service/merchant/cards/tokenize/request`) ба захиалгат төлбөр (`/subscriptions/*`) — **сарын эрх / багц карт** зарах бол дараа нь ашиглана.
- `GET /mpay-service/merchant/transaction/rollback/{id}` — буцаалт.

**Заавал баримтлах 6 дүрэм**

1. **Webhook-ийн гарын үсэг.** HMAC-SHA256-г `MERCHANT_CHECKSUM_KEY`-ээр **түүхий JSON body** (indentation-гүй) дээр тооцоод `x-checksum-v2` header-тэй тулгана. Тиймээс route handler дотор эхлээд `await req.text()` -ээр түүхий текстийг авч, дараа нь `JSON.parse` хийнэ — `await req.json()` шууд дуудвал гарын үсэг таарахгүй. Харьцуулалтад `timingSafeEqual` ашиглана.
2. **`transactionId` бол манай тал дээрх идентификатор** — `payments.id`-г дамжуулна. Энэ багана дээр unique index тавьж webhook давхар ирэхэд нөөц/суудал 2 дахин боловсрогдохоос сэргийлнэ.
3. **`amount`-ыг client-ээс хэзээ ч авахгүй** — invoice үүсгэхийн өмнө сагс/хичээлийн үнийг DB-ээс дахин тооцоолно.
4. **Access token-оо кэшлэнэ** — `expiresIn` дуустал module-level кэш эсвэл DB-д. Дуудалт бүрд шинэ token авахгүй.
5. **Webhook route нь нээлттэй** — `proxy.ts`-ийн matcher-аас `/api/` -г хасна (§5-д хасагдсан), мөн `requireUser()` дуудахгүй. Аюулгүй байдал нь зөвхөн checksum дээр тогтоно.
6. **Локал хөгжүүлэлт** — Bonum манай callback руу хандах ёстой тул `cloudflared tunnel` / `ngrok` -ээр нээж, тэр URL-ыг `callback`-д өгнө. `localhost` ажиллахгүй.

**Онцгойлон анхаарах цэг.** `GET /bonum-gateway/ecommerce/invoices/{invoiceId}` -г баримтад «testing only» гэж тэмдэглэсэн. Тиймээс төлбөрийн үнэн эх сурвалж нь **webhook** бөгөөс өөр биш. Webhook ирээгүй тохиолдолд (сүлжээ тасарсан, deploy явж байсан) захиалга мөнхөд `pending_payment` -д үлдэж болзошгүй тул:
- Хэрэглэгч рүү буцах хуудсан дээр «төлбөр шалгаж байна» төлөв харуулна,
- Cron-оор 30 минутаас удсан `pending_payment` -уудыг тэмдэглэж админд мэдэгдэнэ,
- Бодит орчинд статус шалгах эндпойнт ашиглаж болох эсэхийг **Bonum-ийн дэмжлэгээс тодруулна** (support@bonum.mn / 7200-5000).

**Adapter хэвээр үлдэнэ.** `src/lib/payments/provider.ts` дэх `PaymentProvider` interface-ийг хадгална, `bonum.ts` нь түүний хэрэгжүүлэлт. `manual.ts` (банкны гар шилжүүлэг) -ыг зэрэг үлдээнэ — merchant данс нээгдэх хүртэл болон Bonum унасан үед нөөц зам болно.

```ts
// src/lib/payments/provider.ts
export interface PaymentProvider {
  createInvoice(input: {
    amount: number
    currency: 'MNT'
    targetType: 'order' | 'booking'
    targetId: string
    paymentId: string        // → Bonum-ийн transactionId
    description: string
  }): Promise<{ providerRef: string; redirectUrl?: string; qr?: string; deeplinks?: Link[] }>

  verifyWebhook(rawBody: string, headers: Headers): { transactionId: string; status: 'paid' | 'failed' }
}
```

### 6.5 Admin dashboard

| Хуудас | Агуулга |
|---|---|
| Хяналтын самбар | Өнөөдрийн хичээлүүд + дүүргэлт %, 7 хоногийн орлого, шинэ захиалга, дуусч буй нөөц |
| Хуваарь | Календарь харагдац, хичээл нэмэх, **давтагдах цуврал** (Мя/Пү 19:00, 8 долоо хоног), цуцлах → бүртгүүлсэн бүхэнд и-мэйл |
| Бүртгэл | Хичээл тус бүрийн жагсаалт, ирц, гараар нэмэх/хасах |
| Захиалга | Статус солих, хүргэлтийн мэдээлэл, хэвлэх |
| Бараа | Variant, нөөц, зураг байршуулах (Storage) |
| Төлбөр | Гар шилжүүлэг баталгаажуулах, буцаалт |
| Хэрэглэгч | Хайлт, түүх, эрх олгох (зөвхөн `admin`) |
| Контент | Hero, тухай, галерей, FAQ — mn/en хоёулаа |
| Audit | Хэн юу өөрчилсөн |

Бүх admin Server Action `requireStaff()`-ээр эхэлнэ. Эрх олгох action нь `role='admin'` шаардана.

---

## 7. Хэл (mn / en)

- `[locale]` segment, `mn` нь default. Proxy нь locale-гүй хандалтыг `Accept-Language`-ийн дагуу `/mn` эсвэл `/en` рүү redirect хийнэ.
- Орчуулга: `src/lib/i18n/dictionaries/{mn,en}.json` — UI-ийн тогтмол текст.
- Динамик контент (бараа, хичээл, контент) нь DB-д `*_mn` / `*_en` баганатай. Англи талбар хоосон бол монголоор нь харуулна (fallback).
- Admin интерфейс зөвхөн монголоор — орчуулгын ажлыг хоёр дахин нэмэхгүй.

---

## 8. Vercel + орчин

**Орчны хувьсагчид**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY        # server-only
RESEND_API_KEY
BONUM_API_BASE_URL               # testapi.bonum.mn | apis.bonum.mn
BONUM_APP_SECRET                 # server-only
BONUM_TERMINAL_ID
BONUM_MERCHANT_CHECKSUM_KEY      # webhook HMAC-SHA256
NEXT_PUBLIC_SITE_URL
```

- **Хоёр Supabase проект**: `twerk-dev`, `twerk-prod`. Preview deploy нь dev рүү заана.
- Migration-ууд `supabase/migrations/` дотор SQL файлаар — UI дээр гараар өөрчлөхгүй. `supabase db push` ашиглана.
- **Vercel Cron** (`vercel.json`): хичээлийн сануулга (өдөрт 1), дуусаагүй `pending_payment` захиалга цэвэрлэх.
- Домэйн + и-мэйл: Resend-д домэйн баталгаажуулна (SPF/DKIM), эс бөгөөс и-мэйл спам руу орно.
- Storage bucket: `public/products`, `public/gallery` (нийтийн уншилт), `private/*` шаардлагатай бол.

---

## 9. Ажлын үе шатууд

| Шат | Агуулга | Үр дүн |
|---|---|---|
| **0** | Supabase проект, пакетууд, `proxy.ts`, supabase client-ууд, DAL, layout/header/footer, дизайн token | Скелет ажиллана |
| **1** | Бүх migration + RLS + seed өгөгдөл | DB бэлэн |
| **2** | Auth: signup/login/OAuth/reset, `/account` профайл | Хэрэглэгч нэвтэрнэ |
| **3** | Танилцуулга сайт (mn/en), контент DB-ээс, SEO | Нийтэд харуулж болно ✅ |
| **4** | Хуваарь + `book_session` RPC + миний хичээлүүд + и-мэйл | Бүртгэл ажиллана |
| **5** | Дэлгүүр: каталог, сагс, checkout, захиалга | Худалдаа ажиллана |
| **6** | Admin dashboard бүрэн | Хүлээлгэн өгөх боломжтой |
| **7** | Төлбөрийн gateway, cron, waitlist, аналитик, ачааллын тест | Бүрэн бүтээгдэхүүн |

Шат 3 дуусахад сайтыг олон нийтэд нээж болно — бүртгэлийг түр Instagram DM-ээр авч байгаад Шат 4-ийг залгана.

---

## 10. Эрсдэл ба шийдэл

| Эрсдэл | Шийдэл |
|---|---|
| Сүүлийн суудлын давхар бүртгэл | `book_session` функц + `for update` + unique index (§6.2) |
| Хэрэглэгч өөрийгөө admin болгох | `profiles.role` дээр trigger, RLS-ээр засахыг хориглоно |
| Server Action-ыг шууд POST-оор дуудах | Action бүрийн эхэнд `requireUser()`/`requireStaff()` |
| Webhook давхар ирж нөөц 2 дахин хасах | `transactionId` unique + idempotent боловсруулалт |
| Bonum-ийн checksum таарахгүй | `req.json()` биш `req.text()` -ээр түүхий body уншина |
| Webhook огт ирэхгүй үлдэх | Cron-оор удаан `pending_payment` -ыг илрүүлж админд мэдэгдэнэ |
| Client-ээс ирсэн үнээр захиалга үүсгэх | Checkout дээр үнийг DB-ээс дахин тооцоолно |
| Цагийн бүсийн алдаа (UTC vs UB) | DB бүхэлдээ `timestamptz`, харуулахдаа л хөрвүүлнэ |
| Хуучин `middleware.ts` жишээ хуулах | Next 16-д `proxy.ts` — §2-г үз |
| Багш/ажилтан алдаа гаргах | `audit_log` + цуцлалт бүрд и-мэйл |

---

## 11. Төлөвлөгөөнөөс гажсан зүйлс (хэрэгжүүлэх явцад)

| Төлөвлөсөн | Хийсэн | Шалтгаан |
|---|---|---|
| `carts` / `cart_items` хүснэгт | Сагс нь **httpOnly cookie** дотор | Зочны сагсыг RLS-ээр хамгаалах боломжгүй. Checkout нэвтрэлт шаарддаг ба үнэ/нөөцийг тэр үед DB-ээс дахин тооцоолдог тул cookie дэх өгөгдөлд итгэх шаардлагагүй. Хоёр хүснэгт, нэгтгэх логик хасагдсан. |
| Багтаамжийг `count(*)` -ээр шалгах | `class_sessions.booked_count` денормалчилсан багана + trigger | `bookings` дээр RLS байгаа тул нэвтрээгүй зочин бусдын бүртгэлийг тоолж чадахгүй. Тоог trigger хөтөлснөөр сул суудал нийтэд харагдана. |
| PostgREST-ийн үүрлэсэн `select` (join) | Лавлах хүснэгтүүдийг тусад нь татаж JS дээр нэгтгэх | Хичээлийн төрөл, багш, байршил маш жижиг. `Relationships` төрлийг гараар тодорхойлохоос зайлсхийж, урьдчилан таамаглах боломжтой код болсон. |
| Төлбөрийн gateway | `pending_payment` + админ гараар баталгаажуулна | Захиалагчийн шийдвэрээр хойш тавьсан. Adapter (`src/lib/payments/`) болон mock хэвээр байгаа. |
| И-мэйл, cron, waitlist UI | Хийгээгүй | Дараагийн үе шатанд. Хүснэгт, бүтэц нь бэлэн. |

**Тусад нь тэмдэглэх нэг зүйл.** `src/lib/supabase/database.types.ts` доторх бүх
төрөл `type` (`interface` БИШ) байх ёстой. Supabase-ийн `GenericTable` нь
`Record<string, unknown>` шаарддаг бөгөөд TypeScript зөвхөн type alias-д далд
индекс гарын үсэг өгдөг. `interface` болговол схем чимээгүйхэн таарахаа больж,
бүх query `never` төрөлтэй болно.

---

## 12. Дараагийн алхам

1. Supabase проект үүсгэж migration + seed ажиллуулах, түлхүүрүүдээ `.env.local`-д тавих ([README](../README.md))
2. Өөрийгөө `admin` болгоод `/admin` дээрээс жинхэнэ хуваарь, багш, бараагаа оруулах
3. Брэндийн лого, зураг, багш нарын бодит мэдээллийг `media` bucket руу байршуулах
4. Vercel дээр байршуулж домэйн холбох
5. Бэлэн болмогц Bonum merchant данс нээлгэж `bonum.ts` -ыг бичих (§06.4)
