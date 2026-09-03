# Twerk Mongolia

Улаанбаатар дахь бүжгийн студийн вэб платформ: танилцуулга сайт, хичээлийн
хуваарь ба бүртгэл, онлайн дэлгүүр, админ удирдлага.

**Next.js 16 · React 19 · Tailwind v4 · Supabase (Postgres + Auth + Storage) · Vercel**

Дэлгэрэнгүй архитектур: [docs/PLAN.md](docs/PLAN.md)

---

## Хурдан эхлүүлэх

### 1. Supabase проект

[supabase.com](https://supabase.com) дээр проект үүсгэнэ. Дараа нь **SQL Editor**
дотор дараах файлуудыг ЭНЭ ДАРААЛЛААР ажиллуулна:

```
supabase/migrations/20260827000001_schema.sql     -- хүснэгтүүд
supabase/migrations/20260827000002_functions.sql  -- функц, trigger
supabase/migrations/20260827000003_policies.sql   -- RLS
supabase/seed.sql                                 -- жишээ өгөгдөл (заавал биш)
```

`supabase` CLI суулгасан бол:

```bash
supabase link --project-ref <project-ref>
supabase db push
psql "$DATABASE_URL" -f supabase/seed.sql
```

### 2. Орчны хувьсагч

`.env.local` дотор Supabase → Settings → API хэсгээс:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # server-only, хэзээ ч NEXT_PUBLIC_ болгохгүй
NEXT_PUBLIC_SITE_URL=http://localhost:3000

TELEGRAM_CHANNEL_URL=https://t.me/+xxxx   # онлайн ангийн суваг, server-only
```

`TELEGRAM_CHANNEL_URL` — онлайн ангид элсэлтээ баталгаажуулсан хүнд харагдах
«Telegram нээх» товчны хаяг. Энэ ганц мөрийг бичихэд онлайн ангиуд шууд
ажиллана; өгөгдлийн сан хөндөх шаардлагагүй. Анги тус бүр өөрийн сувагтай
байх бол админ → **Хандалт** хэсэгт тухайн ангийнхыг бичнэ — мөрийн утга нь
энэ хувьсагчийг дарна.

> Холбоосыг зөвхөн `status = 'active'` элсэлттэй хүнд буцаана
> (§ `lib/data.ts` `getCourseTelegramUrl`). `NEXT_PUBLIC_` угтвар ЗОРИУДААР
> байхгүй: угтвартай бол Next нь утгыг клиентийн багцад оруулах тул
> элсээгүй хүн ч эх кодоос уншина.

### 3. Ажиллуулах

```bash
npm install
npm run dev      # http://localhost:3000
```

### 4. Өөрийгөө админ болгох

Сайтаар бүртгүүлээд Supabase SQL Editor дээр:

```sql
alter table profiles disable trigger profiles_guard_role;

update profiles set role = 'admin' where id = (
  select id from auth.users where email = 'таны@имэйл.mn'
);

alter table profiles enable trigger profiles_guard_role;
```

Дараа нь `/admin` нээгдэнэ.

> **Триггерийг заавал унтраана.** `guard_profile_role` нь `is_admin()` -ээр
> шалгадаг бөгөөд тэр нь `auth.uid()` уншина. SQL Editor болон `service_role`
> түлхүүрээр хандахад `auth.uid()` нь `null` — өөрөөр хэлбэл эхний админ
> үүсгэх гэсэн ямар ч оролдлого `42501 Эрх өөрчлөх боломжгүй` алдаагаар
> унана. Энэ бол «эхний админ хаанаас гарах вэ» гэсэн тахиа-өндөгний асуудал.
> Нэг админ бий болмогц дараагийнхыг нь админ өөрөө хэвийн олгоно.

---

## Бүтэц

```
src/
  proxy.ts                  session шинэчлэлт + хэлний redirect (Next 16-д middleware БИШ)
  app/
    [locale]/               mn | en
      (marketing)/          нүүр, тухай, хичээлүүд, анги/курс, багш, FAQ, холбоо барих
      (booking)/schedule/   хуваарь, суудал захиалга
      (shop)/               дэлгүүр, сагс, checkout, захиалга
      (account)/            профайл, миний хичээлүүд, миний захиалгууд
      (auth)/               нэвтрэх, бүртгүүлэх, нууц үг сэргээх
    admin/                  удирдлага (хэлгүй, зөвхөн монголоор)
    auth/callback/          OAuth / и-мэйл баталгаажуулалт
    api/payments/webhook/   төлбөрийн provider-ийн webhook
  actions/                  Server Action-ууд (эрхийн шалгалт бүрд нь эхэлдэг)
  lib/
    supabase/               server / client / admin client + схемийн төрлүүд
    auth/dal.ts             getUser, requireUser, requireStaff, requireAdmin
    data.ts                 уншилтын нэгдсэн цэг
    i18n/                   mn / en толь бичиг
    cart.ts                 cookie дэх сагс
    payments/               provider adapter (одоогоор mock)
supabase/migrations/        схем, функц, RLS
```

## Аюулгүй байдлын гурван давхарга

1. **`src/proxy.ts`** — session cookie шинэчлэх + урьдчилсан шүүлт. DB-д хандахгүй.
2. **`src/lib/auth/dal.ts`** — хуудас, Server Action бүрийн эхэнд `requireUser()` /
   `requireStaff()`. Server Action нь UI-гүйгээр шууд POST-оор дуудагдаж болдог.
3. **RLS + `security definer` функцууд** — Postgres өөрөө татгалзана.

Эмзэг логик JS дээр биш, DB дотор:

| Функц | Юуг баталгаажуулдаг |
|---|---|
| `book_session` | Суудлын багтаамж — мөрийг `for update`-ээр түгжинэ, давхар захиалга үүсэхгүй |
| `place_order` | Үнэ, нөөц — client-ийн илгээсэн дүнд итгэхгүй, нөөцийг атомаар хасна |
| `cancel_order` | Цуцлахад нөөцийг буцаана |
| `guard_profile_role` | Хэрэглэгч өөрийгөө admin болгохоос сэргийлнэ |
| `sync_session_booked_count` | Эзэлсэн суудлын тоог үргэлж зөв байлгана |

## Vercel дээр байршуулах

1. Repo-г Vercel-д холбоно.
2. Дээрх орчны хувьсагчдыг Production болон Preview-д тавина.
   `NEXT_PUBLIC_SITE_URL` -ыг бодит домэйнээр солино.
3. Supabase → Authentication → URL Configuration дотор
   `https://<домэйн>/auth/callback` -ыг Redirect URL болгож нэмнэ.
4. Google OAuth хэрэглэх бол Supabase → Authentication → Providers дээр асаана.

## Скриптүүд

```bash
npm run dev      # хөгжүүлэлт
npm run build    # production build
npm run lint     # eslint
npx tsc --noEmit # төрлийн шалгалт
```

## Одоогоор хийгдээгүй

- **Төлбөрийн gateway** — хойш тавьсан. Захиалга `pending_payment` төлөвт
  үүсээд админ гараар «Төлөгдсөн» болгоно. `src/lib/payments/` дотор Bonum-тай
  нийцтэй adapter болон mock provider бэлэн байгаа
  (`src/lib/payments/README.md`).
- **И-мэйл мэдэгдэл** (Resend) ба сануулгын cron.
- **Дараалал (waitlist)** — хүснэгт бэлэн, UI хийгдээгүй.
- **Зураг байршуулах UI** — `media` bucket болон RLS бэлэн; админ дээр одоогоор
  URL гараар оруулна.
# misheel
