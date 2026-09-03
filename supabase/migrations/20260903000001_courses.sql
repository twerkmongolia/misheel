-- Twerk Mongolia — КУРС (танхим + онлайн)
--
-- ── Яагаад шинэ биет вэ ─────────────────────────────────────────────────────
-- `class_sessions` + `bookings` нь НЭГ УДААГИЙН хичээлийг зохицуулна: хүн
-- Мягмар гаригийн 19:00-ын цагт суудал захиална. Курс бол өөр зүйл — «4
-- долоо хоногийн шинэчлэгчдийн анги» гэсэн БҮТЭН хөтөлбөрт нэг удаа
-- элсэж, нэг удаа төлнө. Хоёрыг нэг хүснэгтэд шахах гэвэл `class_sessions`
-- нь «нэг цаг» ба «хөтөлбөр» хоёрыг зэрэг илэрхийлэх ёстой болж, багтаамж,
-- үнэ, ирц гурвуулаа хоёр утгатай болно.
--
-- ── Танхим ба онлайн НЭГ хүснэгтэд ─────────────────────────────────────────
-- Талбаруудын 80% нь ижил (нэр, тайлбар, үнэ, багш, зураг, элсэлтийн
-- хугацаа). Ялгаа нь хоёрхон: танхимд БАЙРШИЛ ба СУУДЛЫН ТОО, онлайнд
-- TELEGRAM холбоос. Хоёр хүснэгт болговол админд хоёр хуудас, нийтийн
-- сайтад хоёр жагсаалт, кодод хоёр `getCourses()` үүснэ — бүгд ижилхэн.
--
-- ── Төлбөр ─────────────────────────────────────────────────────────────────
-- Курс нь ӨӨРИЙН төлбөрийн систем үүсгэхгүй. `enroll_course()` нь одоо
-- байгаа `orders` мөр үүсгэдэг тул захиалгын жагсаалт, төлбөрийн түүх,
-- `payments` provider (mock → Bonum) бүгд өөрчлөлтгүйгээр ажиллана.
-- Захиалга `paid` болмогц элсэлт нь ТРИГГЕРЭЭР идэвхжинэ — хэн тэмдэглэсэн
-- (ажилтан гараар, эсвэл ирээдүйд webhook) нь хамаагүй.

-- ⚠️ Энэ файл нь ДАХИН ажиллуулахад аюулгүй. Шалтгаан нь практик: төслийг
-- Supabase-ийн SQL Editor дотор ГАРААР буулгаж ажиллуулдаг (§ setup-all.sql).
-- Хэрэв дунд нь тасарвал (сүлжээ, timeout, бичих эрх) хэсэг объект үүсчихсэн
-- байх ба хоёр дахь оролдлого `create type` дээр унана. Тэр үед юу үүссэн,
-- юу үүсээгүйг гараар мөрдөх нь схемийг эвдэх хамгийн богино зам.

-- `create type ... if not exists` гэж БАЙХГҮЙ тул онцгой байдлыг барина.
do $$ begin
  create type course_mode as enum ('studio', 'online');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type enrollment_status as enum ('pending_payment', 'active', 'cancelled', 'completed');
exception when duplicate_object then null;
end $$;

create table if not exists courses (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  mode         course_mode not null default 'studio',

  name_mn      text not null,
  name_en      text not null default '',
  -- Нэг мөрийн товч — жагсаалтын карт дээр. Урт тайлбар нь зөвхөн дэлгэрэнгүйд.
  summary_mn   text not null default '',
  summary_en   text not null default '',
  desc_mn      text not null default '',
  desc_en      text not null default '',

  level        class_level not null default 'beginner',
  instructor_id uuid references instructors (id) on delete set null,
  cover_url    text,
  price        int not null default 0 check (price >= 0),
  lesson_count int not null default 0 check (lesson_count >= 0),

  -- ── Зөвхөн танхим ────────────────────────────────────────────────────────
  location_id  uuid references locations (id) on delete set null,
  starts_on    date,
  ends_on      date,
  -- Хуваарь нь ЧӨЛӨӨТ ТЕКСТ («Мяг, Пү 19:00»). Бүтэцлэсэн давталт нь
  -- `class_sessions` -ийн ажил; курсын хуудсанд хүн уншихад л хэрэгтэй.
  schedule_mn  text not null default '',
  schedule_en  text not null default '',
  -- null = хязгааргүй. Онлайн анги суудал тоолохгүй.
  capacity     int check (capacity is null or capacity > 0),
  enrolled_count int not null default 0 check (enrolled_count >= 0),

  -- ── Элсэлтийн цонх ───────────────────────────────────────────────────────
  -- Хоёулаа null = үргэлж нээлттэй. Ингэснээр онлайн анги «мөнхийн
  -- бүтээгдэхүүн» болж, танхимын анги нь хугацаатай элсэлттэй болно.
  enroll_opens_at  timestamptz,
  enroll_closes_at timestamptz,

  sort_order   int not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),

  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create index if not exists courses_mode_idx on courses (mode, sort_order);

-- ── Онлайн ангийн НУУЦ хэсэг ───────────────────────────────────────────────
-- Telegram холбоос нь `courses` дээр БАЙХГҮЙ. Шалтгаан: `courses` -ийн
-- уншилтын бодлого нийтэд нээлттэй бөгөөд RLS нь МӨРийг хамгаалдаг,
-- БАГАНАг биш. Холбоос тэнд байвал төлөөгүй хүн ч API-аар шууд уншина.
--
-- Тусдаа хүснэгт болгосноор нууц нь бүтцийн хувьд тусгаарлагдана: энэ
-- хүснэгтийн мөрийг зөвхөн ИДЭВХТЭЙ элсэгч ба ажилтан уншина.
create table if not exists course_access (
  course_id    uuid primary key references courses (id) on delete cascade,
  telegram_url text not null default '',
  note_mn      text not null default '',
  note_en      text not null default '',
  updated_at   timestamptz not null default now()
);

create table if not exists course_enrollments (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references courses (id) on delete restrict,
  user_id    uuid not null references profiles (id) on delete cascade,
  -- Төлбөрийн зам. Гараар элсүүлсэн (бэлнээр төлсөн) тохиолдолд null.
  order_id   uuid references orders (id) on delete set null,
  status     enrollment_status not null default 'pending_payment',
  price_paid int not null default 0,
  note       text,
  created_at   timestamptz not null default now(),
  activated_at timestamptz,
  cancelled_at timestamptz
);

create index if not exists course_enrollments_course_idx on course_enrollments (course_id);
create index if not exists course_enrollments_user_idx   on course_enrollments (user_id);
create index if not exists course_enrollments_order_idx  on course_enrollments (order_id);

-- Нэг хүн нэг курст нэг л удаа. Цуцлагдсаныг тооцохгүй — цуцалсан хүн
-- дахин элсэх эрхтэй.
create unique index if not exists course_enrollments_one_live
  on course_enrollments (course_id, user_id)
  where status in ('pending_payment', 'active', 'completed');

-- Захиалгын мөр курс заана. `variant_id` -тэй ХОЁУЛАА null байж болохгүй ч
-- шалгалтыг энд тавихгүй: түүхэн мөрүүд `name_snapshot` -оороо уншигдана.
alter table order_items
  add column if not exists course_id uuid references courses (id) on delete set null;

-- ═══════════════════════════════════════════════════════════════════════════
-- ФУНКЦУУД
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Элсэгчийн тоог тоолуурт барих ──────────────────────────────────────────
-- `bookings_sync_count` -тэй ижил хэв: тоолуурыг гараар нэмэгдүүлэхгүй,
-- жинхэнэ мөрүүдээс ДАХИН тоолно. Ингэснээр цуцлалт, гараар засвар,
-- удирдлагын устгалт бүгд өөрөө тусна.
create or replace function public.sync_course_enrolled_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_course uuid := coalesce(new.course_id, old.course_id);
begin
  update courses c
  set enrolled_count = (
    select count(*) from course_enrollments e
    where e.course_id = v_course
      and e.status in ('pending_payment', 'active', 'completed')
  )
  where c.id = v_course;
  return null;
end;
$$;

drop trigger if exists course_enrollments_sync_count on public.course_enrollments;
create trigger course_enrollments_sync_count
  after insert or update or delete on public.course_enrollments
  for each row execute function public.sync_course_enrolled_count();

-- ── Захиалгын төлөв → элсэлтийн төлөв ──────────────────────────────────────
-- Элсэлтийг идэвхжүүлэх ЦОРЫН ГАНЦ цэг. `set_order_status()` дотор бичвэл
-- ирээдүйн төлбөрийн webhook нь захиалгыг шууд `paid` болгоход элсэлт
-- нээгдэхгүй үлдэнэ. Триггер нь ХЭН тэмдэглэснээс үл хамааран ажиллана.
create or replace function public.sync_enrollment_from_order()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status in ('paid', 'preparing', 'shipped', 'delivered') then
    update course_enrollments
    set status = 'active', activated_at = coalesce(activated_at, now())
    where order_id = new.id and status = 'pending_payment';

  elsif new.status in ('cancelled', 'refunded') then
    update course_enrollments
    set status = 'cancelled', cancelled_at = now()
    where order_id = new.id and status in ('pending_payment', 'active');
  end if;

  return new;
end;
$$;

drop trigger if exists orders_sync_enrollment on public.orders;
create trigger orders_sync_enrollment
  after update of status on public.orders
  for each row execute function public.sync_enrollment_from_order();

-- ── Элсэх ──────────────────────────────────────────────────────────────────
-- Хоёр хүн сүүлийн суудлыг зэрэг дарвал `for update` нэгийг нь хүлээлгэнэ —
-- `book_session()` -тэй яг ижил дүрэм.
--
-- Захиалга үүсгэнэ, ХҮРГЭЛТИЙН ТӨЛБӨРГҮЙ: курс бол хүргэдэг зүйл биш.
-- Нэр, утас нь захиалгад шаардлагатай (тэдгээр багана `not null`) бөгөөд
-- ажилтан залгаж баталгаажуулахад ч хэрэгтэй.
create or replace function public.enroll_course(
  p_course_id uuid,
  p_name      text,
  p_phone     text,
  p_note      text default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_course   courses;
  v_order_id uuid;
  v_order_no text;
begin
  if auth.uid() is null then
    raise exception 'Нэвтэрсэн байх шаардлагатай' using errcode = '42501';
  end if;

  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_phone), '') = '' then
    raise exception 'CONTACT_REQUIRED';
  end if;

  select * into v_course from courses where id = p_course_id for update;

  if not found or not v_course.is_active then
    raise exception 'COURSE_UNAVAILABLE';
  end if;

  if v_course.enroll_opens_at is not null and now() < v_course.enroll_opens_at then
    raise exception 'ENROLL_NOT_OPEN';
  end if;

  if v_course.enroll_closes_at is not null and now() > v_course.enroll_closes_at then
    raise exception 'ENROLL_CLOSED';
  end if;

  -- Танхимын анги эхэлсэн бол элсэлт хаагдана. Онлайн ангид эхлэх өдөр
  -- байхгүй тул энэ шалгалт өөрөө алгасагдана.
  --
  -- ⚠️ `current_date` БИШ: тэр нь серверийн бүсээр (UTC) тоолдог тул УБ-ын
  -- өглөөний 8 цаг хүртэл өчигдрийн огноо буцаана. Студи Улаанбаатарт
  -- байрладаг бөгөөд «өнөөдөр» гэдэг нь ажилтан, сурагч хоёрын өдөр.
  if v_course.starts_on is not null
     and v_course.starts_on < (now() at time zone 'Asia/Ulaanbaatar')::date then
    raise exception 'ENROLL_CLOSED';
  end if;

  if v_course.capacity is not null and v_course.enrolled_count >= v_course.capacity then
    raise exception 'COURSE_FULL';
  end if;

  if exists (
    select 1 from course_enrollments
    where course_id = p_course_id
      and user_id = auth.uid()
      and status in ('pending_payment', 'active', 'completed')
  ) then
    raise exception 'ALREADY_ENROLLED';
  end if;

  insert into orders (user_id, ship_name, ship_phone, subtotal, shipping_fee, total, note)
  values (auth.uid(), trim(p_name), trim(p_phone),
          v_course.price, 0, v_course.price, nullif(trim(coalesce(p_note, '')), ''))
  returning id, order_no into v_order_id, v_order_no;

  insert into order_items (order_id, course_id, name_snapshot, variant_snapshot, unit_price, qty)
  values (v_order_id, v_course.id, v_course.name_mn,
          case when v_course.mode = 'online' then 'Онлайн анги' else 'Танхимын анги' end,
          v_course.price, 1);

  insert into payments (amount, target_type, target_id)
  values (v_course.price, 'order', v_order_id);

  insert into course_enrollments (course_id, user_id, order_id, price_paid)
  values (v_course.id, auth.uid(), v_order_id, v_course.price);

  -- Үнэгүй анги бол төлбөр хүлээх утгагүй — шууд нээнэ.
  if v_course.price = 0 then
    update orders set status = 'paid', updated_at = now() where id = v_order_id;
  end if;

  return v_order_no;
end;
$$;

-- ── Элсэлт цуцлах ──────────────────────────────────────────────────────────
-- Хэрэглэгч зөвхөн ТӨЛӨӨГҮЙ элсэлтээ цуцална. Төлсний дараах буцаалт нь
-- мөнгөний асуудал тул ажилтны шийдвэр (§ удирдлага).
create or replace function public.cancel_enrollment(p_enrollment_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_enrollment course_enrollments;
begin
  select * into v_enrollment
  from course_enrollments where id = p_enrollment_id for update;

  if not found then
    raise exception 'ENROLLMENT_NOT_FOUND';
  end if;

  if v_enrollment.user_id <> auth.uid() and not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if not public.is_staff() and v_enrollment.status <> 'pending_payment' then
    raise exception 'ENROLLMENT_NOT_CANCELLABLE';
  end if;

  if v_enrollment.status = 'cancelled' then
    return;
  end if;

  update course_enrollments
  set status = 'cancelled', cancelled_at = now()
  where id = p_enrollment_id;

  -- Захиалга нь ЗӨВХӨН энэ курсынх тул хамт цуцлагдана. `cancel_order` нь
  -- төлбөрийн мөрийг ч хаана.
  if v_enrollment.order_id is not null then
    perform public.cancel_order(v_enrollment.order_id);
  end if;
end;
$$;

-- ── Элсэлтийн төлөв солих (ажилтан) ────────────────────────────────────────
create or replace function public.set_enrollment_status(
  p_enrollment_id uuid,
  p_status        enrollment_status
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  update course_enrollments
  set status = p_status,
      activated_at = case when p_status = 'active' then coalesce(activated_at, now()) else activated_at end,
      cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end
  where id = p_enrollment_id;

  insert into audit_log (actor_id, action, entity, entity_id, diff)
  values (auth.uid(), 'enrollment.status', 'course_enrollments', p_enrollment_id,
          jsonb_build_object('status', p_status));
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════════════════

alter table courses            enable row level security;
alter table course_access      enable row level security;
alter table course_enrollments enable row level security;

-- Каталог — нийтэд нээлттэй.
drop policy if exists courses_read on courses;
create policy courses_read on courses
  for select using (is_active or public.is_staff());
drop policy if exists courses_write on courses;
create policy courses_write on courses for all
  using (public.is_staff()) with check (public.is_staff());

-- ⚠️ Telegram холбоос. Энэ бодлого бол уг боломжийн БҮХ хамгаалалт:
-- төлөөгүй хүн мөрийг олж чадвал холбоосыг авна гэсэн үг. Тиймээс шалгалт
-- нь «ИДЭВХТЭЙ элсэлт байна уу» гэсэн ганц асуулт — `pending_payment`
-- ХАНГАЛТГҮЙ (захиалга үүсгээд төлөхгүй байхад л хангалттай болчихно).
drop policy if exists course_access_read on course_access;
create policy course_access_read on course_access
  for select using (
    public.is_staff()
    or exists (
      select 1 from course_enrollments e
      where e.course_id = course_access.course_id
        and e.user_id = auth.uid()
        and e.status in ('active', 'completed')
    )
  );
drop policy if exists course_access_write on course_access;
create policy course_access_write on course_access for all
  using (public.is_staff()) with check (public.is_staff());

-- Элсэлт — өөрийнхөө мөрийг харна. БИЧИХ бодлого зөвхөн ажилтанд:
-- хэрэглэгчийн бүх бичилт `enroll_course()` / `cancel_enrollment()`
-- (security definer) дотор багтаамж, давхардлын шалгалттайгаар явна.
drop policy if exists course_enrollments_read on course_enrollments;
create policy course_enrollments_read on course_enrollments
  for select using (user_id = auth.uid() or public.is_staff());
drop policy if exists course_enrollments_write on course_enrollments;
create policy course_enrollments_write on course_enrollments for all
  using (public.is_staff()) with check (public.is_staff());

-- ── Схемийн кэш ────────────────────────────────────────────────────────────
-- Supabase-ийн API давхарга (PostgREST) нь схемээ КЭШЛЭДЭГ. DDL дээр ихэвчлэн
-- өөрөө сэргээдэг ч гараар ажиллуулсан үед хоцорч, апп нь
-- «Could not find the table 'public.courses' in the schema cache» гэж унана.
-- Хүснэгт нь оршин байгаа атлаа API нь мэдэхгүй байгаа хэрэг.
notify pgrst, 'reload schema';
