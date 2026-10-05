-- ═══════════════════════════════════════════════════════════════════════════
-- Twerk Mongolia — ХУДАЛДАН АВАГЧДЫН ТҮР ӨГӨГДӨЛ (админы самбарт)
--
-- Зорилго: «Худалдан авагч» хуудсыг (`/admin/buyers`) дүүрэн өгөгдөлтэй нь
-- харах: хэн юу авсан, хэд төлсөн, хаашаа хүргэх.
--
-- Юу орох вэ:   10 барааны захиалга, 16 мөр — 6 худалдан авагч
--   · хүргэгдсэн 3 · илгээсэн 1 · бэлтгэж буй 1 · төлөгдсөн 2
--   · төлбөр хүлээж буй 2 · цуцлагдсан 1
--
-- ⚠️ НИЙТЭД ХАРАГДАХ БАРАА ҮҮСГЭХГҮЙ. `mock-data.sql` нь [MOCK] барааг
--    ИДЭВХТЭЙ, нөөцтэйгөөр оруулдаг — сайт АМЬД байхад жинхэнэ хүн тэднийг
--    бодит мөнгөөр авч болно. Энд захиалгын мөр нь `variant_id = null`:
--    барааны нэр, хувилбар нь `name_snapshot`, `variant_snapshot`-д
--    хадгалагддаг (захиалгын агшинд ч ингэж хуулагддаг) тул бараа хүснэгтэд
--    юу ч нэмэх шаардлагагүй, дэлгүүрт юу ч гарахгүй.
--
-- Худалдан авагчид нь `mock-studio.sql`-ийн түр сурагчид (`dddddddd-0010-…`)
-- — тэр файлыг ЭХЛЭЭД ажиллуулна. Ажиллуулаагүй бол мөрүүд зүгээр л
-- алгасагдана (профайлтай inner join).
--
-- Бүх id нь `dddddddd-001[6-8]-` — `mock-data-cleanup.sql` устгана.
-- Захиалгын дугаар `TM-92xx`.
--
-- Дахин ажиллуулахад аюулгүй (on conflict do nothing).
-- Ажиллуулах: Supabase Dashboard → SQL Editor → буулгаад Run.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create temp table _mock_buy_orders (
  n int, user_id text, state text, hours int,
  district text, khoroo text, address text
) on commit drop;

insert into _mock_buy_orders values
  ( 1, 'dddddddd-0010-4000-8000-000000000001', 'delivered',       400, 'СБД', '1-р хороо',  'Их сургуулийн гудамж 8, 21 тоот'),
  ( 2, 'dddddddd-0010-4000-8000-000000000001', 'paid',             10, 'СБД', '1-р хороо',  'Их сургуулийн гудамж 8, 21 тоот'),
  ( 3, 'dddddddd-0010-4000-8000-000000000002', 'delivered',       300, 'ХУД', '11-р хороо', 'Зайсангийн гудамж 3, 12 тоот'),
  ( 4, 'dddddddd-0010-4000-8000-000000000002', 'shipped',          50, 'ХУД', '11-р хороо', 'Зайсангийн гудамж 3, 12 тоот'),
  ( 5, 'dddddddd-0010-4000-8000-000000000003', 'preparing',        28, 'БЗД', '5-р хороо',  'Сансарын 4-р байр, 28 тоот'),
  ( 6, 'dddddddd-0010-4000-8000-000000000004', 'delivered',       600, 'ЧД',  '1-р хороо',  'Бага тойруу 15, 7 тоот'),
  ( 7, 'dddddddd-0010-4000-8000-000000000004', 'paid',              5, 'ЧД',  '1-р хороо',  'Бага тойруу 15, 7 тоот'),
  ( 8, 'dddddddd-0010-4000-8000-000000000005', 'pending_payment',  20, 'СХД', '20-р хороо', 'Толгойтын 5-р хороолол, 3 тоот'),
  ( 9, 'dddddddd-0010-4000-8000-000000000006', 'pending_payment',  70, 'БГД', '6-р хороо',  '3-р хороолол, 14-р байр, 40 тоот'),
  (10, 'dddddddd-0010-4000-8000-000000000006', 'cancelled',       200, 'БГД', '6-р хороо',  '3-р хороолол, 14-р байр, 40 тоот');

create temp table _mock_buy_items (
  order_n int, line int, name text, variant text, price int, qty int
) on commit drop;

insert into _mock_buy_items values
  ( 1, 1, 'Crop top',            'M / Хар',      65000, 1),
  ( 1, 2, 'Өвдөгний хамгаалалт', 'Нэг хэмжээ',   45000, 1),
  ( 2, 1, 'Tote цүнх',           NULL,           25000, 2),
  ( 3, 1, 'Joggers өмд',         'S / Саарал',   89000, 1),
  ( 4, 1, 'Crop top',            'S / Ягаан',    65000, 1),
  ( 4, 2, 'Tote цүнх',           NULL,           25000, 1),
  ( 5, 1, 'Joggers өмд',         'M / Хар',      89000, 1),
  ( 5, 2, 'Өвдөгний хамгаалалт', 'Нэг хэмжээ',   45000, 1),
  ( 6, 1, 'Crop top',            'L / Цагаан',   65000, 2),
  ( 7, 1, 'Өвдөгний хамгаалалт', 'Нэг хэмжээ',   45000, 1),
  ( 8, 1, 'Joggers өмд',         'L / Хар',      89000, 1),
  ( 8, 2, 'Crop top',            'L / Хар',      65000, 1),
  ( 9, 1, 'Tote цүнх',           NULL,           25000, 1),
  ( 9, 2, 'Өвдөгний хамгаалалт', 'Нэг хэмжээ',   45000, 1),
  (10, 1, 'Joggers өмд',         'M / Саарал',   89000, 1),
  (10, 2, 'Crop top',            'M / Хар',      65000, 1);

-- Хүргэлт 5000₮ — seed.sql дэх `shop.shipping_fee`-тэй тааруулсан.
insert into orders (
  id, order_no, user_id, status, subtotal, shipping_fee, total,
  ship_name, ship_phone, ship_district, ship_khoroo, ship_address, created_at, updated_at
)
select
  ('dddddddd-0016-4000-8000-' || lpad(o.n::text, 12, '0'))::uuid,
  'TM-92' || lpad(o.n::text, 2, '0'),
  p.id,
  o.state::order_status,
  s.subtotal, 5000, s.subtotal + 5000,
  p.full_name, p.phone, o.district, o.khoroo, o.address,
  now() - (o.hours || ' hours')::interval,
  now() - (o.hours || ' hours')::interval
from _mock_buy_orders o
join profiles p on p.id = o.user_id::uuid
join (select order_n, sum(price * qty) as subtotal from _mock_buy_items group by order_n) s
  on s.order_n = o.n
on conflict do nothing;

insert into order_items (id, order_id, variant_id, name_snapshot, variant_snapshot, unit_price, qty)
select
  ('dddddddd-0017-4000-8000-' || lpad((i.order_n * 10 + i.line)::text, 12, '0'))::uuid,
  ('dddddddd-0016-4000-8000-' || lpad(i.order_n::text, 12, '0'))::uuid,
  null, i.name, i.variant, i.price, i.qty
from _mock_buy_items i
-- Захиалга нь (хэрэглэгчгүйн улмаас) алгасагдсан бол мөр нь ч алгасагдана.
join orders ord on ord.id = ('dddddddd-0016-4000-8000-' || lpad(i.order_n::text, 12, '0'))::uuid
on conflict do nothing;

insert into payments (
  id, provider, provider_ref, amount, status, target_type, target_id, paid_at, created_at
)
select
  ('dddddddd-0018-4000-8000-' || lpad(o.n::text, 12, '0'))::uuid,
  'mock', 'MOCK-TM-92' || lpad(o.n::text, 2, '0'), ord.total,
  (case
     when o.state = 'pending_payment' then 'pending'
     when o.state = 'cancelled' then 'failed'
     else 'paid'
   end)::payment_status,
  'order', ord.id,
  case when o.state not in ('pending_payment', 'cancelled')
       then now() - (o.hours || ' hours')::interval + interval '3 minutes' end,
  now() - (o.hours || ' hours')::interval
from _mock_buy_orders o
join orders ord on ord.id = ('dddddddd-0016-4000-8000-' || lpad(o.n::text, 12, '0'))::uuid
on conflict do nothing;

commit;

-- ── Шалгах ─────────────────────────────────────────────────────────────────
-- Зургаан мөр гарах ёстой — худалдан авагч бүр нэг.

select p.full_name as "худалдан авагч",
       count(*) filter (where o.status in ('paid','preparing','shipped','delivered')) as "төлсөн",
       count(*) filter (where o.status = 'pending_payment') as "хүлээж буй",
       coalesce(sum(o.total) filter (where o.status in ('paid','preparing','shipped','delivered')), 0) as "нийт ₮"
from orders o
join profiles p on p.id = o.user_id
where o.id::text like 'dddddddd-0016-%'
group by p.full_name
order by p.full_name;
