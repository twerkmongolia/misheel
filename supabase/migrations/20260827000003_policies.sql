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
