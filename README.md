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
supabase/migrations/20260827000001_schema.sql            -- хүснэгтүүд
supabase/migrations/20260827000002_functions.sql         -- функц, trigger
supabase/migrations/20260827000003_policies.sql          -- RLS
supabase/migrations/20260903000001_courses.sql           -- курс (танхим + онлайн)
supabase/migrations/20260914000001_instructor_profile.sql -- багш нарын танилцуулга
supabase/migrations/20260914000002_online_courses.sql    -- онлайн хоёр анги
supabase/seed.sql                                        -- жишээ өгөгдөл (заавал биш)
```

Багш, онлайн ангийн хоёр файл нь `seed.sql` -ээс ӨМНӨ ажиллана: жишээ хуваарь
багшийг дугаараар нь заадаг тул хүмүүс эхлээд үүссэн байх ёстой. Багш ба
онлайн анги нь ЖИШЭЭ өгөгдөл БИШ — бодит хүмүүс, бодит Telegram бүлгүүд.

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

`NEXT_PUBLIC_SITE_URL` нь зөвхөн НӨӨЦ утга. И-мэйлийн буцах хаягийг код нь
хүсэлтийн толгойноос уншдаг (§ `lib/site-url.ts`) — ингэснээр localhost,
preview, production гурвуулаа өөрөө зөв болно. Өмнө нь энэ хувьсагч дээр
шууд найддаг байсан ба Vercel дээр тавихаа мартвал, эсвэл localhost хэвээр
үлдвэл нууц үг сэргээх и-мэйл БУРУУ хаяг руу заадаг байв.

### 3. И-мэйл баталгаажуулалт

Supabase → **Authentication** → **Sign In / Providers** → **Email** дотор
**Confirm email** -ийг УНТРААНА.

Асаалттай үед бүртгүүлсэн хүн шууд нэвтрэхгүй: и-мэйл рүүгээ очиж холбоос
дарж байж л бүртгэл идэвхжинэ. Заал дээр утсаараа бүртгүүлж байгаа хүнд тэр
нь гурван нэмэлт алхам — и-мэйл аппаа нээх, spam хавтас хайх, буцаж ирэх — ба
олонхи нь тэндээ л замхардаг.

Кодод өөрчлөх юм алга. `signup()` нь хоёуланг нь мэднэ: Supabase session шууд
буцаавал хэрэглэгчийг «Миний булан» руу оруулна, буцаахгүй бол «и-мэйлээ
шалгана уу» гэсэн мэдэгдэл гаргана (§ `actions/auth.ts`). Тохиргоог хожим
буцааж асаасан ч апп зөв ажиллана.

### 4. Буцах хаягууд (Redirect URLs) — ЭНИЙГ АЛГАСВАЛ НЭВТРЭЛТ АЖИЛЛАХГҮЙ

Supabase → **Authentication** → **URL Configuration**:

| Талбар | Утга |
| --- | --- |
| **Site URL** | `https://www.twerkmongolia.com` |
| **Redirect URLs** | `https://www.twerkmongolia.com/**`<br>`https://twerkmongolia.com/**`<br>`http://localhost:3000/**`<br>`http://localhost:3002/**` |

Preview deployment ашигладаг бол Vercel-ийн хэв маягаа бас нэмнэ
(`https://*-<баг>.vercel.app/**`).

**Яагаад `/**` вэ.** Бидний буцах хаяг нь асуултын мөр АВЧ явдаг —
`/auth/callback?next=/mn/reset-password&locale=mn`. Supabase нь ХАЯГИЙГ
БҮХЭЛД нь тулгадаг тул `…/auth/callback` гэж яг таг бичвэл асуулттай
хувилбар нь таарахгүй.

> ⚠️ **Энэ жагсаалт хоосон байхад юу болох вэ.** Supabase алдаа буцаадаггүй —
> буцах хаягийг чимээгүйхэн ХАЯЖ, **Site URL** -ээр орлуулна. Үр дүнд нь:
>
> · **Google-ээр нэвтрэх** — хүн Google дээр бүх алхмыг зөв дуусгана. Дараа
>   нь `/auth/callback` руу БИШ нүүр хуудас руу буцна. Тэнд кодыг session
>   болгох код байхгүй тул хүн НЭВТРЭЭГҮЙ хэвээр нүүр хуудсан дээр зогсоно.
>
> · **Нууц үг сэргээх** — и-мэйл дэх холбоос нь нууц үгийн маягт руу биш
>   нүүр хуудас руу аваачна. Хүн шинэ нууц үгээ хэзээ ч тавьж чадахгүй.
>
> Хоёулаа «яагаад ч юм болохгүй байна» гэж харагдана: сервер эрүүл, код
> зөв, лог цэвэр. Тиймээс энэ бол нэвтрэлт эвдэрсэн үед ХАМГИЙН ТҮРҮҮНД
> шалгах зүйл.

**Шалгах арга.** Жагсаалтад юу байгааг дашбоардаас гадна ГАДНААС нь
батлах боломжтой. Дараах хоёр алхам и-мэйл ИЛГЭЭХГҮЙ:

```bash
# 1. Нэг удаагийн токен авна (захидал явуулахгүй)
TH=$(curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/admin/generate_link" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"recovery","email":"<бүртгэлтэй@хаяг>"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['hashed_token'])")

# 2. Холбоосыг ХҮН ШИГ дарж, хаашаа буухыг нь хардаг
curl -s -o /dev/null -D - \
  "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/verify?token=$TH&type=recovery\
&redirect_to=https%3A%2F%2Fwww.twerkmongolia.com%2Fauth%2Fcallback" | grep -i '^location:'
```

`location:` нь чиний өгсөн хаягаар эхэлж байвал жагсаалт зөв. Site URL
(`https://www.twerkmongolia.com`) болж хувирсан бол тэр хаяг жагсаалтад АЛГА.

> ⚠️ `generate_link` -ийн `options.redirect_to` -г ЭНЭ ШАЛГАЛТАД БҮҮ
> ашигла: тэр талбарыг уг цэг үл хэрэгсэж, буцаах холбоосдоо ҮРГЭЛЖ Site
> URL бичдэг. Тиймээс зөв тохируулсан жагсаалтыг ч «хоосон» мэт харуулна.
> Жинхэнэ шалгалт нь дээрх `/verify` алхам.

### 5. И-мэйл хүргэлт

Supabase-ийн СУУРИЛУУЛСАН и-мэйл үйлчилгээ нь зөвхөн туршилтад
зориулагдсан: цагт хэдхэн захидал, бөгөөд ихэвчлэн зөвхөн төслийн
гишүүдийн хаяг руу л хүргэнэ. Өөрөөр хэлбэл жинхэнэ үйлчлүүлэгч «Нууц үгээ
мартсан» дарахад захидал нь ХҮРЭХГҮЙ.

Тиймээс Supabase → **Authentication** → **Emails** → **SMTP Settings**
дотор өөрийн SMTP (Resend, SendGrid, Postmark г.м.) -ээ холбоно.

**Нэмэлт (сонголттой): и-мэйлийн холбоосыг ӨӨР ТӨХӨӨРӨМЖ дээр ажиллуулах.**
Анхдагч загвар нь PKCE ашигладаг бөгөөд тэр нь хүсэлт илгээсэн ХӨТӨЧ дээр
үлдсэн нууц түлхүүр шаарддаг. Компьютер дээрээ хүсэлт илгээгээд и-мэйлээ
УТСАНДАА нээсэн хүнд тэр түлхүүр байхгүй тул холбоос унана. **Reset
Password** загварын холбоосыг дараах байдлаар солиход энэ хамаарал алга
болно (§ `app/auth/callback/route.ts` нь хоёуланг нь дэмждэг):

```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/mn/reset-password
```

**Invite загварт энэ нь СОНГОЛТ БИШ, ЗААВАЛ.** Админ → **Хандалт** дээрээс
ажилтан урихад (§ `actions/access.ts`) Supabase нь **Invite user** загварыг
илгээнэ. Анхдагч холбоос нь токеныг хаягийн `#fragment` дотор буцаадаг
бөгөөд СЕРВЕР fragment-ийг харж чаддаггүй (хөтөч түүнийг хүсэлтэд
илгээдэггүй) — өөрөөр хэлбэл урьсан хүн нууц үгээ ХЭЗЭЭ Ч тавьж чадахгүй.
`token_hash` руу шилжүүлбэл сервер талдаа боловсруулагдана:

```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=invite&next=/mn/reset-password
```

И-мэйл баталгаажуулалтыг (§3) хожим асаах бол **Confirm signup** загварт ч
мөн адил (`type=signup`).

### 6. Ажиллуулах

```bash
npm install
npm run dev      # http://localhost:3000
```

### 7. Өөрийгөө админ болгох

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
3. Supabase → Authentication → URL Configuration дотор **Site URL** ба
   **Redirect URLs** -ыг бодит домэйнээр тавина (§ «Хурдан эхлүүлэх» §4).
   Энэ алхмыг алгасвал Google-ээр нэвтрэх ба нууц үг сэргээх ХОЁУЛАА
   чимээгүйхэн ажиллахаа болино.
4. Google OAuth хэрэглэх бол Supabase → Authentication → Providers дээр асаана.
   Google Cloud Console талд зөвшөөрөгдсөн буцах хаяг нь ВЕБ САЙТ БИШ
   Supabase байна: `https://<проект>.supabase.co/auth/v1/callback`.
5. И-мэйл хүргэлтийн SMTP -ээ холбоно (§ «Хурдан эхлүүлэх» §5).

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
