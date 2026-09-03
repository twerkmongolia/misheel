-- Twerk Mongolia — бүрэн суулгац
-- Supabase → SQL Editor дотор ЭНЭ ФАЙЛЫГ БҮТНЭЭР нь хуулж Run дарна.
-- Дараалал чухал: схем → функц → RLS → жишээ өгөгдөл.


-- ═══════════════════════════════════════════════════════════════════
-- supabase/migrations/20260827000001_schema.sql
-- ═══════════════════════════════════════════════════════════════════

-- Twerk Mongolia — үндсэн бүтэц
-- Supabase SQL editor дээр эсвэл `supabase db push` -ээр ажиллуулна.

create extension if not exists "pgcrypto";

-- ── Тоочсон төрлүүд ────────────────────────────────────────────────────────
create type user_role       as enum ('customer', 'instructor', 'staff', 'admin');
create type class_level     as enum ('beginner', 'intermediate', 'advanced');
create type session_status  as enum ('scheduled', 'cancelled', 'completed');
create type booking_status  as enum ('pending', 'confirmed', 'cancelled', 'attended', 'no_show');
create type order_status    as enum ('pending_payment', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded');
create type payment_status  as enum ('pending', 'paid', 'failed', 'refunded');
create type payment_target  as enum ('order', 'booking');

-- ── Хэрэглэгч ──────────────────────────────────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  avatar_url  text,
  role        user_role not null default 'customer',
  locale      text not null default 'mn',
  created_at  timestamptz not null default now()
);

-- ── Танилцуулга контент ────────────────────────────────────────────────────
create table site_content (
  key        text primary key,
  value_mn   jsonb not null default '{}'::jsonb,
  value_en   jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table instructors (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles (id) on delete set null,
  slug       text not null unique,
  name       text not null,
  bio_mn     text not null default '',
  bio_en     text not null default '',
  photo_url  text,
  instagram  text,
  sort_order int not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table locations (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  address_mn       text not null default '',
  address_en       text not null default '',
  map_url          text,
  default_capacity int not null default 12,
  is_active        boolean not null default true
);

create table gallery_items (
  id         uuid primary key default gen_random_uuid(),
  url        text not null,
  alt_mn     text not null default '',
  alt_en     text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table faq_items (
  id          uuid primary key default gen_random_uuid(),
  question_mn text not null,
  question_en text not null default '',
  answer_mn   text not null,
  answer_en   text not null default '',
  sort_order  int not null default 0,
  is_active   boolean not null default true
);

-- ── Хичээл ба хуваарь ──────────────────────────────────────────────────────
create table class_types (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name_mn      text not null,
  name_en      text not null default '',
  desc_mn      text not null default '',
  desc_en      text not null default '',
  level        class_level not null default 'beginner',
  duration_min int not null default 60,
  cover_url    text,
  base_price   int not null default 0,          -- ₮, бүхэл тоо
  sort_order   int not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table class_sessions (
  id            uuid primary key default gen_random_uuid(),
  class_type_id uuid not null references class_types (id) on delete restrict,
  instructor_id uuid references instructors (id) on delete set null,
  location_id   uuid references locations (id) on delete set null,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  capacity      int not null default 12 check (capacity > 0),
  -- Тухайн цагт эзэлсэн суудлын тоо. bookings дээрх trigger хөтөлнө.
  -- Анонимаар ч харагдах ёстой тул денормалчилсан (bookings нь RLS-тэй).
  booked_count  int not null default 0 check (booked_count >= 0),
  price         int not null default 0,
  status        session_status not null default 'scheduled',
  note          text,
  series_id     uuid,
  created_at    timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index class_sessions_starts_at_idx on class_sessions (starts_at);
create index class_sessions_series_idx    on class_sessions (series_id);

create table bookings (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references class_sessions (id) on delete cascade,
  user_id      uuid not null references profiles (id) on delete cascade,
  status       booking_status not null default 'pending',
  price_paid   int not null default 0,
  note         text,
  cancelled_at timestamptz,
  created_at   timestamptz not null default now()
);

-- Нэг хүн нэг цагт нэг л удаа. Цуцалсны дараа дахин бүртгүүлж болно.
create unique index bookings_one_per_session
  on bookings (session_id, user_id)
  where status in ('pending', 'confirmed', 'attended');

create index bookings_user_idx    on bookings (user_id);
create index bookings_session_idx on bookings (session_id);

create table waitlist (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references class_sessions (id) on delete cascade,
  user_id    uuid not null references profiles (id) on delete cascade,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (session_id, user_id)
);

-- ── Дэлгүүр ────────────────────────────────────────────────────────────────
create table products (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name_mn    text not null,
  name_en    text not null default '',
  desc_mn    text not null default '',
  desc_en    text not null default '',
  category   text not null default 'merch',
  base_price int not null default 0,
  sort_order int not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table product_variants (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  sku        text not null unique,
  size       text,
  color      text,
  price      int not null default 0,
  stock_qty  int not null default 0 check (stock_qty >= 0),
  is_active  boolean not null default true
);

create index product_variants_product_idx on product_variants (product_id);

create table product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  url        text not null,
  alt        text not null default '',
  sort_order int not null default 0
);

create index product_images_product_idx on product_images (product_id);

create sequence order_no_seq start 1000;

create table orders (
  id            uuid primary key default gen_random_uuid(),
  order_no      text not null unique default ('TM-' || nextval('order_no_seq')),
  user_id       uuid not null references profiles (id) on delete restrict,
  status        order_status not null default 'pending_payment',
  subtotal      int not null default 0,
  shipping_fee  int not null default 0,
  total         int not null default 0,
  ship_name     text not null,
  ship_phone    text not null,
  ship_district text not null default '',
  ship_khoroo   text not null default '',
  ship_address  text not null default '',
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index orders_user_idx   on orders (user_id);
create index orders_status_idx on orders (status);

create table order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references orders (id) on delete cascade,
  variant_id       uuid references product_variants (id) on delete set null,
  -- Бараа устсан ч захиалгын түүх бүрэн уншигдана
  name_snapshot    text not null,
  variant_snapshot text not null default '',
  unit_price       int not null,
  qty              int not null check (qty > 0)
);

create index order_items_order_idx on order_items (order_id);

-- ── Төлбөр (одоохондоо гараар баталгаажуулна) ──────────────────────────────
create table payments (
  id            uuid primary key default gen_random_uuid(),
  provider      text not null default 'manual',
  provider_ref  text,
  amount        int not null,
  currency      text not null default 'MNT',
  status        payment_status not null default 'pending',
  target_type   payment_target not null,
  target_id     uuid not null,
  raw           jsonb,
  paid_at       timestamptz,
  created_at    timestamptz not null default now()
);

create unique index payments_provider_ref_idx
  on payments (provider, provider_ref)
  where provider_ref is not null;

create index payments_target_idx on payments (target_type, target_id);

-- ── Бусад ──────────────────────────────────────────────────────────────────
create table contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text not null default '',
  email      text not null default '',
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create table audit_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references profiles (id) on delete set null,
  action     text not null,
  entity     text not null,
  entity_id  uuid,
  diff       jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_created_idx on audit_log (created_at desc);

-- ── Storage ────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- ═══════════════════════════════════════════════════════════════════
-- supabase/migrations/20260827000002_functions.sql
-- ═══════════════════════════════════════════════════════════════════

-- Twerk Mongolia — функц ба trigger
-- Бизнесийн эмзэг логик (суудлын багтаамж, нөөц) энд байрлана.
-- Эдгээрийг JS тал дээр давхардуулж бичихийг ХОРИГЛОНО.

-- ── Тусламжийн функцууд ────────────────────────────────────────────────────
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('staff', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── Бүртгүүлмэгц профайл үүсгэх ────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, phone, locale)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'locale', ''), 'mn')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Эрх өөрчлөхөөс сэргийлэх ───────────────────────────────────────────────
-- Хэрэглэгч өөрийн мөрөө засаж чадна. Гэхдээ role-оо ӨӨРӨӨ өөрчилж болохгүй —
-- эс бөгөөс хэн ч өөрийгөө admin болгоно.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Эрх өөрчлөх боломжгүй' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ── Суудлын тоог тогтмол зөв байлгах ───────────────────────────────────────
create or replace function public.sync_session_booked_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session uuid := coalesce(new.session_id, old.session_id);
begin
  update class_sessions s
  set booked_count = (
    select count(*) from bookings b
    where b.session_id = v_session
      and b.status in ('pending', 'confirmed', 'attended')
  )
  where s.id = v_session;
  return null;
end;
$$;

drop trigger if exists bookings_sync_count on public.bookings;
create trigger bookings_sync_count
  after insert or update or delete on public.bookings
  for each row execute function public.sync_session_booked_count();

-- ── Хичээлд бүртгүүлэх ─────────────────────────────────────────────────────
-- Хоёр хүн сүүлийн суудлыг зэрэг дарвал `for update` нэгийг нь хүлээлгэнэ.
create or replace function public.book_session(p_session_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session class_sessions;
  v_booking_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Нэвтэрсэн байх шаардлагатай' using errcode = '42501';
  end if;

  select * into v_session
  from class_sessions
  where id = p_session_id
  for update;                                   -- ← мөрийг түгжинэ

  if not found or v_session.status <> 'scheduled' then
    raise exception 'SESSION_NOT_AVAILABLE';
  end if;

  if v_session.starts_at <= now() then
    raise exception 'SESSION_STARTED';
  end if;

  if v_session.booked_count >= v_session.capacity then
    raise exception 'SESSION_FULL';
  end if;

  if exists (
    select 1 from bookings
    where session_id = p_session_id
      and user_id = auth.uid()
      and status in ('pending', 'confirmed', 'attended')
  ) then
    raise exception 'ALREADY_BOOKED';
  end if;

  insert into bookings (session_id, user_id, status, price_paid)
  values (p_session_id, auth.uid(), 'confirmed', v_session.price)
  returning id into v_booking_id;

  delete from waitlist where session_id = p_session_id and user_id = auth.uid();

  return v_booking_id;
end;
$$;

-- ── Бүртгэл цуцлах ─────────────────────────────────────────────────────────
create or replace function public.cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking bookings;
  v_starts_at timestamptz;
  v_cutoff_hours int;
begin
  select * into v_booking from bookings where id = p_booking_id for update;

  if not found then
    raise exception 'BOOKING_NOT_FOUND';
  end if;

  if v_booking.user_id <> auth.uid() and not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if v_booking.status in ('cancelled', 'attended', 'no_show') then
    raise exception 'BOOKING_NOT_CANCELLABLE';
  end if;

  select starts_at into v_starts_at from class_sessions where id = v_booking.session_id;

  v_cutoff_hours := coalesce(
    (select (value_mn ->> 'cancel_cutoff_hours')::int from site_content where key = 'booking'),
    6
  );

  -- Ажилтан хэзээ ч цуцалж чадна; хэрэглэгч зөвхөн хугацаанаас өмнө.
  if not public.is_staff() and v_starts_at - make_interval(hours => v_cutoff_hours) < now() then
    raise exception 'CANCEL_TOO_LATE';
  end if;

  update bookings
  set status = 'cancelled', cancelled_at = now()
  where id = p_booking_id;
end;
$$;

-- ── Захиалга үүсгэх ────────────────────────────────────────────────────────
-- Үнэ, нөөцийг ЗӨВХӨН энд тооцоолно. Client-ээс ирсэн дүнд итгэхгүй.
create or replace function public.place_order(
  p_items    jsonb,     -- [{ "variant_id": "...", "qty": 2 }, ...]
  p_name     text,
  p_phone    text,
  p_district text,
  p_khoroo   text,
  p_address  text,
  p_note     text default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_order_no text;
  v_item jsonb;
  v_variant product_variants;
  v_product products;
  v_qty int;
  v_subtotal int := 0;
  v_shipping int;
begin
  if auth.uid() is null then
    raise exception 'Нэвтэрсэн байх шаардлагатай' using errcode = '42501';
  end if;

  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'CART_EMPTY';
  end if;

  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_phone), '') = '' then
    raise exception 'SHIPPING_REQUIRED';
  end if;

  v_shipping := coalesce(
    (select (value_mn ->> 'shipping_fee')::int from site_content where key = 'shop'),
    5000
  );

  insert into orders (user_id, ship_name, ship_phone, ship_district, ship_khoroo, ship_address, note)
  values (auth.uid(), trim(p_name), trim(p_phone), coalesce(p_district, ''),
          coalesce(p_khoroo, ''), coalesce(p_address, ''), nullif(trim(coalesce(p_note, '')), ''))
  returning id, order_no into v_order_id, v_order_no;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item ->> 'qty')::int;

    if v_qty is null or v_qty <= 0 then
      raise exception 'INVALID_QTY';
    end if;

    select * into v_variant
    from product_variants
    where id = (v_item ->> 'variant_id')::uuid
    for update;                                 -- ← нөөцийг түгжинэ

    if not found or not v_variant.is_active then
      raise exception 'VARIANT_UNAVAILABLE';
    end if;

    if v_variant.stock_qty < v_qty then
      raise exception 'OUT_OF_STOCK:%', v_variant.sku;
    end if;

    select * into v_product from products where id = v_variant.product_id;

    if not found or not v_product.is_active then
      raise exception 'VARIANT_UNAVAILABLE';
    end if;

    update product_variants
    set stock_qty = stock_qty - v_qty
    where id = v_variant.id;

    insert into order_items (order_id, variant_id, name_snapshot, variant_snapshot, unit_price, qty)
    values (
      v_order_id,
      v_variant.id,
      v_product.name_mn,
      trim(both ' / ' from concat_ws(' / ', v_variant.size, v_variant.color)),
      v_variant.price,
      v_qty
    );

    v_subtotal := v_subtotal + v_variant.price * v_qty;
  end loop;

  update orders
  set subtotal = v_subtotal,
      shipping_fee = v_shipping,
      total = v_subtotal + v_shipping,
      updated_at = now()
  where id = v_order_id;

  insert into payments (amount, target_type, target_id)
  values (v_subtotal + v_shipping, 'order', v_order_id);

  return v_order_no;
end;
$$;

-- ── Захиалга цуцлах (нөөц буцаана) ─────────────────────────────────────────
create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order orders;
  v_item order_items;
begin
  select * into v_order from orders where id = p_order_id for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.user_id <> auth.uid() and not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  -- Хэрэглэгч зөвхөн төлбөр хүлээж буй захиалгаа цуцална
  if not public.is_staff() and v_order.status <> 'pending_payment' then
    raise exception 'ORDER_NOT_CANCELLABLE';
  end if;

  if v_order.status in ('cancelled', 'refunded') then
    return;                                     -- аль хэдийн цуцлагдсан
  end if;

  for v_item in select * from order_items where order_id = p_order_id
  loop
    if v_item.variant_id is not null then
      update product_variants
      set stock_qty = stock_qty + v_item.qty
      where id = v_item.variant_id;
    end if;
  end loop;

  update orders set status = 'cancelled', updated_at = now() where id = p_order_id;
  update payments set status = 'failed'
   where target_type = 'order' and target_id = p_order_id and status = 'pending';
end;
$$;

-- ── Захиалгын төлөв солих (ажилтан) ────────────────────────────────────────
create or replace function public.set_order_status(p_order_id uuid, p_status order_status)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if p_status = 'cancelled' then
    perform public.cancel_order(p_order_id);
    return;
  end if;

  update orders set status = p_status, updated_at = now() where id = p_order_id;

  if p_status = 'paid' then
    update payments
    set status = 'paid', paid_at = now()
    where target_type = 'order' and target_id = p_order_id and status = 'pending';
  end if;

  insert into audit_log (actor_id, action, entity, entity_id, diff)
  values (auth.uid(), 'order.status', 'orders', p_order_id, jsonb_build_object('status', p_status));
end;
$$;

-- ── Давтагдах хуваарь үүсгэх (ажилтан) ─────────────────────────────────────
create or replace function public.create_session_series(
  p_class_type_id uuid,
  p_instructor_id uuid,
  p_location_id   uuid,
  p_first_start   timestamptz,
  p_duration_min  int,
  p_capacity      int,
  p_price         int,
  p_weeks         int
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_series uuid := gen_random_uuid();
  v_i int;
  v_start timestamptz;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if p_weeks < 1 or p_weeks > 52 then
    raise exception 'INVALID_WEEKS';
  end if;

  for v_i in 0 .. p_weeks - 1 loop
    v_start := p_first_start + make_interval(weeks => v_i);
    insert into class_sessions (
      class_type_id, instructor_id, location_id, starts_at, ends_at,
      capacity, price, series_id
    )
    values (
      p_class_type_id, p_instructor_id, p_location_id, v_start,
      v_start + make_interval(mins => p_duration_min),
      p_capacity, p_price, v_series
    );
  end loop;

  return v_series;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- supabase/migrations/20260827000003_policies.sql
-- ═══════════════════════════════════════════════════════════════════

-- Twerk Mongolia — Row Level Security
-- Хамгийн сүүлийн бэхлэлт: код дээр алдаа гарсан ч өгөгдөл алдагдахгүй.
-- `security definer` функцууд (book_session, place_order г.м.) RLS-ийг тойрдог
-- тул бүх бичилт тэдгээрээр дамжина.

alter table profiles         enable row level security;
alter table site_content     enable row level security;
alter table instructors      enable row level security;
alter table locations        enable row level security;
alter table gallery_items    enable row level security;
alter table faq_items        enable row level security;
alter table class_types      enable row level security;
alter table class_sessions   enable row level security;
alter table bookings         enable row level security;
alter table waitlist         enable row level security;
alter table products         enable row level security;
alter table product_variants enable row level security;
alter table product_images   enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;
alter table payments         enable row level security;
alter table contact_messages enable row level security;
alter table audit_log        enable row level security;

-- ── Профайл ────────────────────────────────────────────────────────────────
create policy profiles_select_self on profiles
  for select using (id = auth.uid() or public.is_staff());

create policy profiles_update_self on profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
-- role багана нь `profiles_guard_role` trigger-ээр хамгаалагдсан

-- ── Нийтэд нээлттэй каталог ────────────────────────────────────────────────
-- Уншихад нэвтрэх шаардлагагүй; бичих эрх зөвхөн ажилтанд.
create policy site_content_read on site_content for select using (true);
create policy site_content_write on site_content for all
  using (public.is_staff()) with check (public.is_staff());

create policy instructors_read on instructors for select using (is_active or public.is_staff());
create policy instructors_write on instructors for all
  using (public.is_staff()) with check (public.is_staff());

create policy locations_read on locations for select using (is_active or public.is_staff());
create policy locations_write on locations for all
  using (public.is_staff()) with check (public.is_staff());

create policy gallery_read on gallery_items for select using (true);
create policy gallery_write on gallery_items for all
  using (public.is_staff()) with check (public.is_staff());

create policy faq_read on faq_items for select using (is_active or public.is_staff());
create policy faq_write on faq_items for all
  using (public.is_staff()) with check (public.is_staff());

create policy class_types_read on class_types for select using (is_active or public.is_staff());
create policy class_types_write on class_types for all
  using (public.is_staff()) with check (public.is_staff());

-- Цуцлагдсан хичээл ч харагдана — хэрэглэгч шалтгааныг мэдэх ёстой
create policy class_sessions_read on class_sessions for select using (true);
create policy class_sessions_write on class_sessions for all
  using (public.is_staff()) with check (public.is_staff());

create policy products_read on products for select using (is_active or public.is_staff());
create policy products_write on products for all
  using (public.is_staff()) with check (public.is_staff());

create policy variants_read on product_variants for select using (is_active or public.is_staff());
create policy variants_write on product_variants for all
  using (public.is_staff()) with check (public.is_staff());

create policy images_read on product_images for select using (true);
create policy images_write on product_images for all
  using (public.is_staff()) with check (public.is_staff());

-- ── Хувийн өгөгдөл ─────────────────────────────────────────────────────────
create policy bookings_read_own on bookings
  for select using (user_id = auth.uid() or public.is_staff());

create policy bookings_staff_write on bookings for all
  using (public.is_staff()) with check (public.is_staff());

create policy waitlist_own on waitlist
  for all using (user_id = auth.uid() or public.is_staff())
  with check (user_id = auth.uid() or public.is_staff());

create policy orders_read_own on orders
  for select using (user_id = auth.uid() or public.is_staff());

create policy orders_staff_write on orders for all
  using (public.is_staff()) with check (public.is_staff());

create policy order_items_read_own on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_staff())
    )
  );

create policy order_items_staff_write on order_items for all
  using (public.is_staff()) with check (public.is_staff());

create policy payments_read_own on payments
  for select using (
    public.is_staff()
    or (
      target_type = 'order'
      and exists (select 1 from orders o where o.id = payments.target_id and o.user_id = auth.uid())
    )
    or (
      target_type = 'booking'
      and exists (select 1 from bookings b where b.id = payments.target_id and b.user_id = auth.uid())
    )
  );

create policy payments_staff_write on payments for all
  using (public.is_staff()) with check (public.is_staff());

-- ── Холбоо барих ба аудит ──────────────────────────────────────────────────
-- Хэн ч бичиж болно (холбоо барих форм), зөвхөн ажилтан уншина.
create policy contact_insert_any on contact_messages for insert with check (true);
create policy contact_staff_read on contact_messages for select using (public.is_staff());
create policy contact_staff_write on contact_messages for update
  using (public.is_staff()) with check (public.is_staff());

create policy audit_staff_read on audit_log for select using (public.is_staff());

-- ── Storage ────────────────────────────────────────────────────────────────
create policy media_public_read on storage.objects
  for select using (bucket_id = 'media');

create policy media_staff_write on storage.objects
  for insert with check (bucket_id = 'media' and public.is_staff());

create policy media_staff_update on storage.objects
  for update using (bucket_id = 'media' and public.is_staff());

create policy media_staff_delete on storage.objects
  for delete using (bucket_id = 'media' and public.is_staff());

-- ═══════════════════════════════════════════════════════════════════
-- supabase/seed.sql
-- ═══════════════════════════════════════════════════════════════════

-- Twerk Mongolia — жишээ өгөгдөл
-- Migration-уудын дараа ажиллуулна. Дахин ажиллуулахад аюулгүй (on conflict).

-- ── Сайтын контент ─────────────────────────────────────────────────────────
insert into site_content (key, value_mn, value_en) values
('hero', jsonb_build_object(
    'title', 'Twerk Mongolia',
    'subtitle', 'Бие сэтгэлээ чөлөөлөх бүжгийн студи',
    'body', 'Анхан шатнаас ахисан түвшин хүртэл — долоо хоног бүр Улаанбаатарт.',
    'cta', 'Хуваарь харах'),
  jsonb_build_object(
    'title', 'Twerk Mongolia',
    'subtitle', 'A dance studio for setting your body free',
    'body', 'From absolute beginner to advanced — every week in Ulaanbaatar.',
    'cta', 'See the schedule')),
('about', jsonb_build_object(
    'title', 'Бидний тухай',
    'body', 'Twerk Mongolia нь 2019 онд Улаанбаатарт үүсгэн байгуулагдсан. Бид бүжгийг гоо сайхны шалгуур биш, өөрийгөө илэрхийлэх хэрэгсэл гэж үздэг. Манай заалан бол шүүмжлэлгүй, дэмжлэгтэй орон зай.',
    'stat_students', '1200', 'stat_years', '7', 'stat_classes', '18'),
  jsonb_build_object(
    'title', 'About us',
    'body', 'Twerk Mongolia was founded in Ulaanbaatar in 2019. We treat dance as a tool for self-expression, not a beauty standard. Our studio is a judgement-free, supportive space.',
    'stat_students', '1200', 'stat_years', '7', 'stat_classes', '18')),
-- Утас, Instagram, Facebook нь бодит. И-мэйл, хаягийг /admin/content дээрээс бөглөнө.
('contact', jsonb_build_object(
    'phone', '+976 9919 0857', 'email', '', 'address', '',
    'instagram', 'twerkmongolia',
    'facebook', 'https://www.facebook.com/share/1EVmEQMU4S/'),
  jsonb_build_object(
    'phone', '+976 9919 0857', 'email', '', 'address', '',
    'instagram', 'twerkmongolia',
    'facebook', 'https://www.facebook.com/share/1EVmEQMU4S/')),
('booking', jsonb_build_object('cancel_cutoff_hours', 6),
            jsonb_build_object('cancel_cutoff_hours', 6)),
('shop',    jsonb_build_object('shipping_fee', 5000, 'bank', 'Хаан банк · 5000 1234 5678 · Твөрк Монголиа ХХК'),
            jsonb_build_object('shipping_fee', 5000, 'bank', 'Khan Bank · 5000 1234 5678 · Twerk Mongolia LLC')),
-- Нүүр хуудасны бичлэгүүд. id талбарт бүтэн YouTube холбоос буулгасан ч болно.
('videos',  jsonb_build_object('id_1', 'u261YyMWm0g', 'title_1', '', 'id_2', 'ju-HSfPFFxE', 'title_2', ''),
            jsonb_build_object('id_1', 'u261YyMWm0g', 'title_1', '', 'id_2', 'ju-HSfPFFxE', 'title_2', ''))
on conflict (key) do nothing;

-- ── Байршил ────────────────────────────────────────────────────────────────
insert into locations (id, name, address_mn, address_en, default_capacity) values
('11111111-1111-4111-8111-111111111111', 'Үндсэн заал',
 'СБД, 1-р хороо, Их сургуулийн гудамж 12, 3 давхар',
 'Sukhbaatar district, Ikh Surguuliin gudamj 12, 3rd floor', 16),
('11111111-1111-4111-8111-222222222222', 'Жижиг заал',
 'СБД, 1-р хороо, Их сургуулийн гудамж 12, 2 давхар',
 'Sukhbaatar district, Ikh Surguuliin gudamj 12, 2nd floor', 8)
on conflict (id) do nothing;

-- ── Багш нар ───────────────────────────────────────────────────────────────
insert into instructors (id, slug, name, bio_mn, bio_en, photo_url, instagram, sort_order) values
('22222222-2222-4222-8222-111111111111', 'saraa', 'Сараа',
 'Twerk Mongolia-гийн үүсгэн байгуулагч. 8 жилийн туршлагатай, анхан шатны хичээлүүдийг хөтөлдөг.',
 'Founder of Twerk Mongolia. Eight years of experience, leads the beginner classes.',
 '/media/studio-1.svg', 'saraa.dance', 1),
('22222222-2222-4222-8222-222222222222', 'nomin', 'Номин',
 'Choreography болон ахисан түвшний хичээл заадаг. Олон улсын тэмцээний шагналт.',
 'Teaches choreography and advanced classes. International competition medalist.',
 '/media/studio-2.svg', 'nomin.moves', 2),
('22222222-2222-4222-8222-333333333333', 'tsetseg', 'Цэцэг',
 'Stretching болон биеийн бэлтгэлийн хичээл. Дасгал зүтгэлтний мэргэжилтэн.',
 'Stretching and conditioning classes. Certified fitness trainer.',
 '/media/studio-3.svg', 'tsetseg.flex', 3)
on conflict (id) do nothing;

-- ── Хичээлийн төрөл ────────────────────────────────────────────────────────
insert into class_types (id, slug, name_mn, name_en, desc_mn, desc_en, level, duration_min, cover_url, base_price, sort_order) values
('33333333-3333-4333-8333-111111111111', 'twerk-basics', 'Twerk үндэс', 'Twerk Basics',
 'Огт туршлагагүй хүнд зориулсан. Үндсэн хөдөлгөөн, хэмнэл, биеийн байрлалыг эхнээс нь заана.',
 'For complete beginners. Core movements, rhythm and body positioning from scratch.',
 'beginner', 60, '/media/studio-4.svg', 35000, 1),
('33333333-3333-4333-8333-222222222222', 'choreography', 'Choreography', 'Choreography',
 'Дуу бүрд бүтэн бүжиг сурна. Үндсэн хөдөлгөөнүүдийг мэддэг хүнд тохиромжтой.',
 'Learn a full routine to a track. Suited to those who know the basics.',
 'intermediate', 75, '/media/studio-5.svg', 40000, 2),
('33333333-3333-4333-8333-333333333333', 'advanced-flow', 'Ахисан түвшин', 'Advanced Flow',
 'Хурд, техник, тайз дээрх илэрхийлэл. Дор хаяж 6 сар бүжиглэсэн байх шаардлагатай.',
 'Speed, technique and stage presence. Requires at least six months of practice.',
 'advanced', 90, '/media/studio-6.svg', 45000, 3),
('33333333-3333-4333-8333-444444444444', 'stretch', 'Stretch & Conditioning', 'Stretch & Conditioning',
 'Уян хатан байдал, тэсвэр. Бүжгийн хичээлийг нөхөх дасгалууд.',
 'Flexibility and stamina. A complement to the dance classes.',
 'beginner', 60, '/media/studio-1.svg', 30000, 4)
on conflict (id) do nothing;

-- ── Хуваарь: ирэх 3 долоо хоног ────────────────────────────────────────────
-- Мя/Пү/Бя гэсэн 3 өдөрт, өдөрт 2-3 хичээл.
insert into class_sessions (class_type_id, instructor_id, location_id, starts_at, ends_at, capacity, price)
select
  s.class_type_id,
  s.instructor_id,
  s.location_id,
  slot_start,
  slot_start + make_interval(mins => s.duration),
  s.capacity,
  s.price
from (
  values
    ('33333333-3333-4333-8333-111111111111'::uuid, '22222222-2222-4222-8222-111111111111'::uuid,
     '11111111-1111-4111-8111-111111111111'::uuid, 2, 19, 60, 16, 35000),
    ('33333333-3333-4333-8333-222222222222'::uuid, '22222222-2222-4222-8222-222222222222'::uuid,
     '11111111-1111-4111-8111-111111111111'::uuid, 2, 20, 75, 14, 40000),
    ('33333333-3333-4333-8333-444444444444'::uuid, '22222222-2222-4222-8222-333333333333'::uuid,
     '11111111-1111-4111-8111-222222222222'::uuid, 4, 18, 60, 8, 30000),
    ('33333333-3333-4333-8333-111111111111'::uuid, '22222222-2222-4222-8222-111111111111'::uuid,
     '11111111-1111-4111-8111-111111111111'::uuid, 4, 19, 60, 16, 35000),
    ('33333333-3333-4333-8333-333333333333'::uuid, '22222222-2222-4222-8222-222222222222'::uuid,
     '11111111-1111-4111-8111-111111111111'::uuid, 4, 20, 90, 12, 45000),
    ('33333333-3333-4333-8333-222222222222'::uuid, '22222222-2222-4222-8222-222222222222'::uuid,
     '11111111-1111-4111-8111-111111111111'::uuid, 6, 12, 75, 14, 40000),
    ('33333333-3333-4333-8333-111111111111'::uuid, '22222222-2222-4222-8222-111111111111'::uuid,
     '11111111-1111-4111-8111-111111111111'::uuid, 6, 14, 60, 16, 35000)
  ) as s (class_type_id, instructor_id, location_id, dow, hour, duration, capacity, price)
cross join lateral (
  select (
    date_trunc('week', (now() at time zone 'Asia/Ulaanbaatar'))
      + make_interval(days => s.dow - 1, weeks => w.n, hours => s.hour)
  ) at time zone 'Asia/Ulaanbaatar' as slot_start
  from generate_series(0, 2) as w (n)
) slots
where slot_start > now()
  and not exists (
    select 1 from class_sessions cs
    where cs.class_type_id = s.class_type_id and cs.starts_at = slot_start
  );

-- ── Дэлгүүр ────────────────────────────────────────────────────────────────
insert into products (id, slug, name_mn, name_en, desc_mn, desc_en, category, base_price, sort_order) values
('44444444-4444-4444-8444-111111111111', 'crop-top', 'Crop top', 'Crop top',
 'Бүжгийн дасгалд зориулсан амьсгалдаг даавуутай crop top.',
 'Breathable crop top made for dance practice.', 'hувцас', 65000, 1),
('44444444-4444-4444-8444-222222222222', 'joggers', 'Joggers өмд', 'Joggers',
 'Уян хатан, хөдөлгөөнд саад болохгүй сунадаг өмд.',
 'Stretchy joggers that never get in the way of a move.', 'hувцас', 89000, 2),
('44444444-4444-4444-8444-333333333333', 'knee-pads', 'Өвдөгний хамгаалалт', 'Knee pads',
 'Шалан дээрх хөдөлгөөнд заавал хэрэгтэй зузаан дэвсгэртэй.',
 'Thick padding — essential for floor work.', 'хэрэгсэл', 45000, 3),
('44444444-4444-4444-8444-444444444444', 'tote-bag', 'Tote цүнх', 'Tote bag',
 'Twerk Mongolia лого бүхий даавуун цүнх.',
 'Canvas tote with the Twerk Mongolia logo.', 'merch', 25000, 4)
on conflict (id) do nothing;

insert into product_images (product_id, url, alt, sort_order) values
('44444444-4444-4444-8444-111111111111', '/media/studio-2.svg', 'Crop top', 1),
('44444444-4444-4444-8444-222222222222', '/media/studio-3.svg', 'Joggers', 1),
('44444444-4444-4444-8444-333333333333', '/media/studio-4.svg', 'Өвдөгний хамгаалалт', 1),
('44444444-4444-4444-8444-444444444444', '/media/studio-5.svg', 'Tote цүнх', 1)
on conflict do nothing;

insert into product_variants (product_id, sku, size, color, price, stock_qty) values
('44444444-4444-4444-8444-111111111111', 'CROP-S-BLK', 'S', 'Хар', 65000, 8),
('44444444-4444-4444-8444-111111111111', 'CROP-M-BLK', 'M', 'Хар', 65000, 12),
('44444444-4444-4444-8444-111111111111', 'CROP-L-BLK', 'L', 'Хар', 65000, 5),
('44444444-4444-4444-8444-111111111111', 'CROP-M-PNK', 'M', 'Ягаан', 68000, 3),
('44444444-4444-4444-8444-222222222222', 'JOG-S-BLK',  'S', 'Хар', 89000, 6),
('44444444-4444-4444-8444-222222222222', 'JOG-M-BLK',  'M', 'Хар', 89000, 9),
('44444444-4444-4444-8444-222222222222', 'JOG-L-BLK',  'L', 'Хар', 89000, 2),
('44444444-4444-4444-8444-333333333333', 'KNEE-ONE',   'Стандарт', 'Хар', 45000, 20),
('44444444-4444-4444-8444-444444444444', 'TOTE-ONE',   'Стандарт', 'Цагаан', 25000, 30)
on conflict (sku) do nothing;

-- ── Галерей ба FAQ ─────────────────────────────────────────────────────────
insert into gallery_items (url, alt_mn, alt_en, sort_order) values
('/media/studio-1.svg', 'Заалан дээрх хичээл', 'Class in the studio', 1),
('/media/studio-2.svg', 'Choreography хичээл', 'Choreography class', 2),
('/media/studio-3.svg', 'Stretch хичээл', 'Stretch class', 3),
('/media/studio-4.svg', 'Тоглолтын бэлтгэл', 'Show rehearsal', 4),
('/media/studio-5.svg', 'Сурагчид', 'Students', 5),
('/media/studio-6.svg', 'Үндсэн заал', 'Main studio', 6)
on conflict do nothing;

insert into faq_items (question_mn, question_en, answer_mn, answer_en, sort_order) values
('Огт бүжиглэж байгаагүй бол болох уу?',
 'Can I come with no dance experience?',
 'Мэдээж. «Twerk үндэс» хичээл яг эхлэгчдэд зориулагдсан бөгөөд сурагчдын дийлэнх нь тэндээс эхэлдэг. Багш хөдөлгөөн бүрийг жижиг хэсэг болгон задалж, удаан хэмнэлээр давтуулдаг тул урьдчилсан бэлтгэл огт шаардлагагүй.',
 'Absolutely. The Twerk Basics class is built for people starting from zero, and most of our students begin there. Every movement is broken into small pieces and repeated slowly, so no previous experience is needed.', 1),
('Хичээлд хэрхэн бүртгүүлэх вэ?',
 'How do I book a class?',
 'Хуваарь хуудаснаас өөрт тохирох өдөр, цагаа сонгоод «Бүртгүүлэх» товчийг дарахад суудал тань шууд баталгаажна. Бүртгүүлэхийн өмнө нэвтэрсэн байх шаардлагатай — ингэснээр бүх бүртгэлээ «Миний булан» дотроос хараад, шаардлагатай үед цуцлах боломжтой болно.',
 'Pick a day and time on the Schedule page and press Book — your seat is confirmed straight away. You need to be logged in first, which also lets you see every booking under My account and cancel it if your plans change.', 2),
('Аль түвшнээс эхлэх вэ?',
 'Which level should I start at?',
 'Гурван түвшин бий: анхан, дунд, ахисан. Өмнө нь бүжиглэж байгаагүй бол анхан шатнаас эхэл; үндсэн хөдөлгөөнүүдийг мэддэг болсон үед дунд шат тохирно. Ахисан түвшин нь дор хаяж зургаан сарын тогтмол дадлага шаарддаг тул яаралгүй ойртоорой.',
 'There are three levels: beginner, intermediate and advanced. Start at beginner if you have never danced; intermediate suits you once the basic movements feel familiar. Advanced asks for at least six months of steady practice, so there is no rush to get there.', 3),
('Нэг хичээл хэдэн минут үргэлжлэх вэ?',
 'How long is a class?',
 'Хичээлийн төрлөөс хамаарч 60-аас 90 минут. Яг хэдэн минут болохыг хуваарь дээрх цаг бүрийн хажууд, мөн хичээлийн дэлгэрэнгүй хуудаснаас харж болно. Эхлэхээс арав орчим минутын өмнө ирж, хувцсаа сольж, биеэ дулаацуулахыг зөвлөж байна.',
 'Between 60 and 90 minutes, depending on the class. The exact length is shown next to every slot on the schedule and on each class page. Arrive about ten minutes early to change and warm up.', 4),
('Юу өмсөж очих вэ?',
 'What should I wear?',
 'Хөдөлгөөнд саад болохгүй сунадаг өмд эсвэл лосин, тав тухтай пүүз. Өвдөг шалан дээр тулах хөдөлгөөн олон байдаг тул өвдөгний хамгаалалт нэг цагийг хамаагүй тав тухтай болгоно — манай дэлгүүрээс авах боломжтой.',
 'Stretchy trousers or leggings you can move in, and comfortable trainers. A lot of the work happens on your knees, so knee pads make the hour far more comfortable — you can pick up a pair from our shop.', 5),
('Хичээлээ цуцалж болох уу?',
 'Can I cancel a booking?',
 'Болно. Хичээл эхлэхээс 6 цагийн өмнө хүртэл «Миний булан» дотроос өөрөө цуцална. Түүнээс хойш систем цуцлахыг зөвшөөрөхгүй тул бидэн рүү шууд залгаарай — боломжтой бол суудлыг тань хүлээж байгаа өөр сурагчид шилжүүлнэ.',
 'Yes. You can cancel yourself from My account up to six hours before the class starts. After that the system locks it, so please call us instead — where we can, we pass your seat on to another student who is waiting.', 6),
('Төлбөрөө яаж хийх вэ?',
 'How do I pay?',
 'Одоогоор банкны шилжүүлгээр. Захиалга үүсгэсний дараа дансны дугаар, гүйлгээний утга дэлгэц дээр гарч ирэх бөгөөд төлбөр орсны дараа захиалга боловсруулагдана. Гүйлгээний утгыг яг бичсэнээр нь оруулах нь баталгаажилтыг хурдасгана.',
 'By bank transfer for now. Once you place an order the account number and the reference appear on screen, and we process the order as soon as the payment arrives. Copying the reference exactly speeds the confirmation up.', 7),
('Ганцаараа очиход эвгүй биш үү?',
 'Is it strange to come on my own?',
 'Сурагчдын олонх нь ганцаараа ирдэг. Эхний хичээл дээр хэн ч бие биенээ ажигладаггүй — бүгд толинд өөрийгөө хараад л завгүй байдаг. Хоёр гурван хичээлийн дараа заал танил болж, нэрсийг нь ч санаж эхэлнэ.',
 'Most people arrive alone. In your first class nobody is watching you — everyone is busy watching themselves in the mirror. After two or three classes the room stops feeling new and you start knowing names.', 8),
('Бие бялдрын бэлтгэл сайтай байх шаардлагатай юу?',
 'Do I need to be fit already?',
 'Үгүй. Хичээл бүр дулаацуулах дасгалаас эхэлж, ачааллаа аажмаар нэмдэг тул биеэ дасгах хугацаа өөрөө гарна. Хэрэв гэмтэл, мэс засал, эсвэл анхаарах шаардлагатай зүйл байвал хичээл эхлэхээс өмнө багшдаа хэлээрэй — хөдөлгөөнийг тань тохируулж өгнө.',
 'No. Every class opens with a warm-up and builds the load gradually, so your body has time to catch up. If you are carrying an injury or anything we should know about, tell the instructor before the class and they will adapt the movements for you.', 9),
('Хуваарь хэр олон удаа шинэчлэгддэг вэ?',
 'How often is the schedule updated?',
 'Долоо хоног бүр. Хуваарь хуудсан дээр өмнөх, дараагийн долоо хоног руу чөлөөтэй шилжиж, өдөр бүрд хэдэн хичээл байгааг нэг харцаар харна. Тухайн хичээл дүүрсэн бол мөр дээрээ «Дүүрсэн» гэж бичигдэнэ.',
 'Every week. On the Schedule page you can move freely between the previous and the next week and see at a glance how many classes fall on each day. If a class is full, the row says so instead of offering a button.', 10),
('Дэлгүүрийн захиалга хэрхэн ирэх вэ?',
 'How does shop delivery work?',
 'Улаанбаатар хотод 5,000₮ -ийн хүргэлтийн төлбөртэй. Захиалга баталгаажсаны дараа бид тантай утсаар холбогдож, хүргэх өдөр, цагийг тохирно. Заалнаас өөрөө авахыг хүсвэл захиалгын тайлбартаа бичээд үлдээгээрэй.',
 'Delivery inside Ulaanbaatar costs ₮5,000. Once your order is confirmed we call you to agree a day and a time. If you would rather collect it at the studio, just say so in the order note.', 11),
('Тоглолт, арга хэмжээнд урьж болох уу?',
 'Can we book you for an event?',
 'Болно. Twerk Mongolia корпоратив арга хэмжээ, тоглолт, бичлэгт тогтмол оролцдог. Огноо, байршил, хэдэн бүжигчин хэрэгтэйгээ холбоо барих хуудсаар бичиж илгээгээрэй — ажлын өдрүүдэд 24 цагийн дотор хариулна.',
 'Yes. Twerk Mongolia performs regularly at corporate events, shows and shoots. Send us the date, the venue and how many dancers you need through the contact page and we will reply within 24 hours on weekdays.', 12)
on conflict do nothing;


-- ═══════════════════════════════════════════════════════════════════
-- supabase/migrations/20260903000001_courses.sql
-- ═══════════════════════════════════════════════════════════════════

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

-- ── Анги, курс ─────────────────────────────────────────────────────────────
-- Танхимын элсэлт нэг, онлайн анги нэг. `starts_on` нь ХАРЬЦАНГУЙ огноо:
-- тогтмол огноо бичвэл үрийн өгөгдөл хэдэн сарын дараа «аль хэдийн эхэлсэн»
-- болж, элсэлтийн урсгалыг туршиж үзэх боломжгүй болно.
insert into courses (
  id, slug, mode, name_mn, name_en, summary_mn, summary_en, desc_mn, desc_en,
  level, instructor_id, location_id, cover_url, price, lesson_count,
  starts_on, ends_on, schedule_mn, schedule_en, capacity, sort_order
) values
('55555555-5555-4555-8555-111111111111', 'twerk-4-week', 'studio',
 'Шинэчлэгчдийн 4 долоо хоног', 'Beginner 4-Week Course',
 'Огт бүжиглэж үзээгүй хүнд зориулсан бүтэн хөтөлбөр — эхний алхмаас бүтэн бүжиг хүртэл.',
 'A full programme for people who have never danced — from the first step to a whole routine.',
 'Дөрвөн долоо хоног, найман хичээл. Эхний долоо хоногт биеэ хэрхэн авч явах, хэмнэлээ олох; хоёрдугаарт үндсэн хөдөлгөөнүүд; гуравдугаарт тэдгээрийг холбох; дөрөвдүгээрт бүтэн бүжиг сурч, хүсвэл бичлэг хийнэ.

Хувцас, гутлын тухай: хөнгөн, суналттай өмд, хөл нүцгэн эсвэл гутлаа авчирч болно. Бусад бүхнийг заалнаас олно.',
 'Four weeks, eight classes. Week one is about carrying yourself and finding the rhythm; week two the core movements; week three linking them; week four a full routine, with an optional filmed take.

On clothes: light stretchy trousers, barefoot or bring your trainers. Everything else is at the studio.',
 'beginner',
 '22222222-2222-4222-8222-111111111111',
 '11111111-1111-4111-8111-111111111111',
 '/media/studio-4.svg', 240000, 8,
 (current_date + 14), (current_date + 42),
 'Мягмар, Пүрэв · 19:00–20:15', 'Tuesdays and Thursdays · 19:00–20:15',
 12, 1),
('55555555-5555-4555-8555-222222222222', 'online-basics', 'online',
 'Онлайн үндэс', 'Online Basics',
 'Гэрээсээ, өөрийн хэмнэлээр. Хичээлүүд Telegram бүлэгт байршина.',
 'From home, at your own pace. The lessons live in a Telegram group.',
 'Арван хичээл, тус бүр 15-25 минут. Бүгд бичлэгээр тул хэдэн ч удаа буцааж үзнэ.

Элссэн даруйдаа Telegram бүлгийн урилга нээгдэнэ. Тэндээс хичээл бүрийн бичлэг, дасгалын жагсаалт, асуулт хариултын хэсэг олдоно. Багш долоо хоног бүр асуултад хариулна.',
 'Ten lessons, 15-25 minutes each. Everything is recorded, so you can go back as often as you like.

The Telegram invite unlocks the moment you enrol. Inside you will find every lesson, the drill list and a questions thread. The instructor answers questions weekly.',
 'beginner',
 '22222222-2222-4222-8222-222222222222',
 null,
 '/media/studio-5.svg', 120000, 10,
 null, null,
 'Өөрийн хэмнэлээр', 'At your own pace',
 null, 2)
on conflict (id) do nothing;

-- Telegram холбоос ТУСДАА хүснэгтэд — төлбөрөө төлсөн элсэгч л уншина.
insert into course_access (course_id, telegram_url, note_mn, note_en) values
('55555555-5555-4555-8555-222222222222', 'https://t.me/+twerkmongolia_demo',
 'Бүлэгт орсны дараа өөрийгөө танилцуулаарай — багш танд эхлэх хичээлээ хэлж өгнө.',
 'Introduce yourself once you are in — the instructor will point you to the right first lesson.')
on conflict (course_id) do nothing;
