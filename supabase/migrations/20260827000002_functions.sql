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
