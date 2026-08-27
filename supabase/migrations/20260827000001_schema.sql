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
