-- ═══════════════════════════════════════════════════════════════════════════
-- Twerk Mongolia — ТАНХИМЫН АНГИЙН ТҮР ӨГӨГДӨЛ (админы самбарт)
--
-- Зорилго: админы «Захиалга», «Анги», «Сурагчид», орлогын графикуудыг
-- танхимын ангийн ДҮҮРЭН өгөгдөлтэй нь харах. `mock-data.sql` нь дэлгүүр,
-- хуваарийн цагийг дүүргэдэг ч анги (`courses`) руу элссэн нэг ч захиалга
-- оруулдаггүй — тиймээс «Төлөгдсөн» шүүлт хоосон, ангийн суудлын тоо 0.
--
-- Юу орох вэ:
--   4  танхимын анги     8  сурагч        20 захиалга (+ мөр, төлбөр, элсэлт)
--      · 15 төлөгдсөн  · 4 төлбөр хүлээж буй  · 1 цуцлагдсан  · 1 эхэлсэн анги
--      Дөрвөн багш тус бүр нэг анги: Мишээл, Nomiko, Daarii, Itgel.
--
-- ⚠️ АНГИУД ИДЭВХГҮЙ (`is_active = false`). Сайт АМЬД байгаа: идэвхтэй түр
--    анги нийтийн каталогт гарч, жинхэнэ хүн бодит мөнгөөр элсэх болно.
--    `enroll_course()` нь идэвхгүй ангийг `COURSE_UNAVAILABLE`-ээр татгалздаг
--    тул хэн ч төлж чадахгүй; админд харин бүрэн харагдана (бүдэг саарал).
--    Нийтийн хуудсыг харах гэж идэвхжүүлбэл — харж дуусаад БУЦААЖ унтраа.
--
-- Бие даасан: `mock-data.sql`-ийг урьдчилж ажиллуулах шаардлагагүй. Багш,
-- заал нь БАЙГАА жинхэнэ мөрүүд рүү заана (Мишээл, Nomiko, Daarii, Itgel;
-- Үндсэн, Жижиг заал) — устгахад тэдэнд хуруу хүрэхгүй.
--
-- Бүх id нь `dddddddd-001x-` — `mock-data-cleanup.sql` нь `dddddddd-`-ээр
-- эхэлсэн БҮХ мөрийг устгадаг тул энэ файлын өгөгдөл ч хамт арилна.
-- Захиалгын дугаар `TM-91xx` — жинхэнэ (`TM-10xx`), mock-data (`TM-90xx`)
-- хоёртой давхцахгүй.
--
-- Төлөв нь ШУУД эцсийн хэлбэрээрээ орно (захиалга `paid`, элсэлт `active`).
-- `orders_sync_enrollment` триггер зөвхөн UPDATE дээр ажилладаг тул давхар
-- шилжилт болохгүй; суудлын тоог `course_enrollments_sync_count` өөрөө
-- шинэчилнэ.
--
-- Дахин ажиллуулахад аюулгүй (on conflict do nothing): өмнөх хувилбарыг
-- ажиллуулсан бол дахин Run хийхэд зөвхөн шинэ мөрүүд (Itgel-ийн анги) нэмэгдэнэ.
-- Ажиллуулах: Supabase Dashboard → SQL Editor → буулгаад Run.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── Сурагчид ───────────────────────────────────────────────────────────────
-- `mock-data.sql`-тэй ижил арга (тэндхийн тайлбарыг үз): нууц үггүй, имэйл
-- нь @example.com, токены баганууд NULL биш ХООСОН мөр.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000', v.id::uuid, 'authenticated', 'authenticated',
  v.email, '', now() - (v.days || ' days')::interval,
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', v.name, 'phone', v.phone, 'locale', 'mn'),
  now() - (v.days || ' days')::interval,
  now() - (v.days || ' days')::interval,
  '', '', '', ''
from (values
  ('dddddddd-0010-4000-8000-000000000001', 'mock.studio1@example.com', 'Энхжин Б.',   '9910 4521', 45),
  ('dddddddd-0010-4000-8000-000000000002', 'mock.studio2@example.com', 'Тэмүүжин Г.', '9922 7810', 38),
  ('dddddddd-0010-4000-8000-000000000003', 'mock.studio3@example.com', 'Ануужин С.',  '8805 3367', 33),
  ('dddddddd-0010-4000-8000-000000000004', 'mock.studio4@example.com', 'Солонго Д.',  '9530 1184', 30),
  ('dddddddd-0010-4000-8000-000000000005', 'mock.studio5@example.com', 'Уянга Т.',    '8818 9042', 40),
  ('dddddddd-0010-4000-8000-000000000006', 'mock.studio6@example.com', 'Гэрэл Н.',    '9907 5536', 36),
  ('dddddddd-0010-4000-8000-000000000007', 'mock.studio7@example.com', 'Мөнхзул О.',  '9944 2219', 34),
  ('dddddddd-0010-4000-8000-000000000008', 'mock.studio8@example.com', 'Сарнай Э.',   '8890 6673', 42)
) as v(id, email, name, phone, days)
on conflict (id) do nothing;

insert into profiles (id, full_name, phone, locale, created_at)
select u.id, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'phone', 'mn', u.created_at
from auth.users u
where u.id::text like 'dddddddd-0010-%'
on conflict (id) do update
  set full_name = excluded.full_name,
      phone     = excluded.phone,
      created_at = excluded.created_at;

-- ── Ангиуд ─────────────────────────────────────────────────────────────────
-- Огноо нь ажиллуулсан өдрөөс хамаарна. Гурав дахь анги нь АЛЬ ХЭДИЙН
-- ЭХЭЛСЭН — «эхэлсэн, элсэлт хаалттай» төлөв ямар харагдахыг харуулна.

insert into courses (
  id, slug, mode, name_mn, name_en, summary_mn, summary_en, level,
  instructor_id, location_id, cover_url, price, lesson_count,
  starts_on, ends_on, schedule_mn, schedule_en, capacity, sort_order, is_active
) values
('dddddddd-0011-4000-8000-000000000001', 'mock-twerk-basics', 'studio',
 '[MOCK] Твэрк үндэс · шинэ элсэлт', '[MOCK] Twerk Basics · new intake',
 'Анхлан суралцагчдад: хэмнэл, үндсэн хөдөлгөөнөөс бүтэн бүжиг хүртэл.',
 'For beginners: from rhythm and core moves to a whole routine.',
 'beginner',
 'd3457f0e-e201-45d0-a8a4-a20c9af77289',   -- Мишээл
 '11111111-1111-4111-8111-111111111111',   -- Үндсэн заал
 '/media/mock/class-twerk-basics.jpg', 240000, 8,
 current_date + 7, current_date + 35,
 'Мягмар, Пүрэв · 19:00–20:15', 'Tuesdays and Thursdays · 19:00–20:15',
 12, 90, false),
('dddddddd-0011-4000-8000-000000000002', 'mock-heels-choreo', 'studio',
 '[MOCK] Heels хореограф · дунд шат', '[MOCK] Heels Choreography · intermediate',
 'Өсгийтэй гутлаар: тэнцвэр, шилжилт, бүтэн хореограф.',
 'In heels: balance, transitions and a full routine.',
 'intermediate',
 '22222222-2222-4222-8222-222222222222',   -- Nomiko
 '11111111-1111-4111-8111-222222222222',   -- Жижиг заал
 '/media/mock/class-heels.jpg', 280000, 8,
 current_date + 14, current_date + 42,
 'Даваа, Лхагва · 20:00–21:15', 'Mondays and Wednesdays · 20:00–21:15',
 8, 91, false),
('dddddddd-0011-4000-8000-000000000003', 'mock-twerk-advanced', 'studio',
 '[MOCK] Ахисан твэрк', '[MOCK] Advanced Twerk',
 'Хурдан хэмнэл, урт хослол, тайзны бүжиг.',
 'Fast tempo, long combinations, stage routines.',
 'advanced',
 '22222222-2222-4222-8222-333333333333',   -- Daarii
 '11111111-1111-4111-8111-111111111111',   -- Үндсэн заал
 '/media/mock/class-advanced.jpg', 320000, 10,
 current_date - 10, current_date + 25,
 'Бямба · 14:00–16:00', 'Saturdays · 14:00–16:00',
 10, 92, false),
('dddddddd-0011-4000-8000-000000000004', 'mock-cardio-twerk', 'studio',
 '[MOCK] Cardio Twerk', '[MOCK] Cardio Twerk',
 'Хөлс гаргасан, хөгжилтэй цаг: твэрк хөдөлгөөнөөр бүтэн биеийн дасгал.',
 'A sweaty, fun hour: a full-body workout built from twerk moves.',
 'beginner',
 '22222222-2222-4222-8222-444444444444',   -- Itgel
 '11111111-1111-4111-8111-222222222222',   -- Жижиг заал
 '/media/mock/class-dancehall.jpg', 200000, 8,
 current_date + 10, current_date + 38,
 'Пүрэв, Бямба · 18:00–19:00', 'Thursdays and Saturdays · 18:00–19:00',
 10, 93, false)
on conflict (id) do nothing;

-- ── Захиалга, мөр, төлбөр, элсэлт ──────────────────────────────────────────
-- Нэг жагсаалтаас дөрвөн хүснэгт дүүрнэ — `enroll_course()` яг ингэж нэг
-- захиалгад нэг мөр, нэг төлбөр, нэг элсэлт үүсгэдэг. `hours` нь захиалга
-- үүссэнээс хэдэн цаг өнгөрснийг заана: орлогын графикт энэ долоо хоног,
-- өмнөх долоо хоног, сарын өмнө гэж тархана. 2-оос дээш хоног төлбөр хүлээж
-- буй захиалга самбарт ШАР өнгөөр тодрох ёстой (TM-9107).

create temp table _mock_studio (
  n int, course text, user_id text, state text, hours int
) on commit drop;

insert into _mock_studio values
  -- Твэрк үндэс (12 суудал): 5 төлсөн, 2 хүлээж буй, 1 цуцалсан
  ( 1, 'dddddddd-0011-4000-8000-000000000001', 'dddddddd-0010-4000-8000-000000000001', 'paid',       6),
  ( 2, 'dddddddd-0011-4000-8000-000000000001', 'dddddddd-0010-4000-8000-000000000002', 'paid',      30),
  ( 3, 'dddddddd-0011-4000-8000-000000000001', 'dddddddd-0010-4000-8000-000000000003', 'paid',      54),
  ( 4, 'dddddddd-0011-4000-8000-000000000001', 'dddddddd-0010-4000-8000-000000000004', 'paid',     100),
  ( 5, 'dddddddd-0011-4000-8000-000000000001', 'dddddddd-0010-4000-8000-000000000005', 'paid',     150),
  ( 6, 'dddddddd-0011-4000-8000-000000000001', 'dddddddd-0010-4000-8000-000000000006', 'pending',   20),
  ( 7, 'dddddddd-0011-4000-8000-000000000001', 'dddddddd-0010-4000-8000-000000000007', 'pending',   70),
  ( 8, 'dddddddd-0011-4000-8000-000000000001', 'dddddddd-0010-4000-8000-000000000008', 'cancelled', 200),
  -- Heels (8 суудал): 3 төлсөн, 1 хүлээж буй
  ( 9, 'dddddddd-0011-4000-8000-000000000002', 'dddddddd-0010-4000-8000-000000000001', 'paid',      12),
  (10, 'dddddddd-0011-4000-8000-000000000002', 'dddddddd-0010-4000-8000-000000000002', 'paid',      80),
  (11, 'dddddddd-0011-4000-8000-000000000002', 'dddddddd-0010-4000-8000-000000000003', 'paid',     170),
  (12, 'dddddddd-0011-4000-8000-000000000002', 'dddddddd-0010-4000-8000-000000000004', 'pending',   40),
  -- Ахисан (10 суудал, эхэлсэн): эхлэхээс өмнө төлсөн 4
  (13, 'dddddddd-0011-4000-8000-000000000003', 'dddddddd-0010-4000-8000-000000000005', 'paid',     500),
  (14, 'dddddddd-0011-4000-8000-000000000003', 'dddddddd-0010-4000-8000-000000000006', 'paid',     600),
  (15, 'dddddddd-0011-4000-8000-000000000003', 'dddddddd-0010-4000-8000-000000000007', 'paid',     700),
  (16, 'dddddddd-0011-4000-8000-000000000003', 'dddddddd-0010-4000-8000-000000000008', 'paid',     800),
  -- Cardio Twerk · Itgel (10 суудал): 3 төлсөн, 1 хүлээж буй
  (17, 'dddddddd-0011-4000-8000-000000000004', 'dddddddd-0010-4000-8000-000000000006', 'paid',      18),
  (18, 'dddddddd-0011-4000-8000-000000000004', 'dddddddd-0010-4000-8000-000000000007', 'paid',      60),
  (19, 'dddddddd-0011-4000-8000-000000000004', 'dddddddd-0010-4000-8000-000000000008', 'paid',     120),
  (20, 'dddddddd-0011-4000-8000-000000000004', 'dddddddd-0010-4000-8000-000000000001', 'pending',   30);

insert into orders (
  id, order_no, user_id, status, subtotal, shipping_fee, total,
  ship_name, ship_phone, created_at, updated_at
)
select
  ('dddddddd-0012-4000-8000-' || lpad(m.n::text, 12, '0'))::uuid,
  'TM-91' || lpad(m.n::text, 2, '0'),
  m.user_id::uuid,
  (case m.state when 'paid' then 'paid' when 'pending' then 'pending_payment' else 'cancelled' end)::order_status,
  c.price, 0, c.price,
  p.full_name, p.phone,
  now() - (m.hours || ' hours')::interval,
  now() - (m.hours || ' hours')::interval
from _mock_studio m
join courses c on c.id = m.course::uuid
join profiles p on p.id = m.user_id::uuid
on conflict do nothing;

insert into order_items (id, order_id, course_id, name_snapshot, variant_snapshot, unit_price, qty)
select
  ('dddddddd-0013-4000-8000-' || lpad(m.n::text, 12, '0'))::uuid,
  ('dddddddd-0012-4000-8000-' || lpad(m.n::text, 12, '0'))::uuid,
  c.id, c.name_mn, 'Танхимын анги', c.price, 1
from _mock_studio m
join courses c on c.id = m.course::uuid
on conflict do nothing;

-- Төлсөн нь захиалгаас 4 минутын дараа «төлөгдсөн»; цуцалсных `failed`.
insert into payments (
  id, provider, provider_ref, amount, status, target_type, target_id, paid_at, created_at
)
select
  ('dddddddd-0014-4000-8000-' || lpad(m.n::text, 12, '0'))::uuid,
  'mock', 'MOCK-TM-91' || lpad(m.n::text, 2, '0'), c.price,
  (case m.state when 'paid' then 'paid' when 'pending' then 'pending' else 'failed' end)::payment_status,
  'order',
  ('dddddddd-0012-4000-8000-' || lpad(m.n::text, 12, '0'))::uuid,
  case when m.state = 'paid' then now() - (m.hours || ' hours')::interval + interval '4 minutes' end,
  now() - (m.hours || ' hours')::interval
from _mock_studio m
join courses c on c.id = m.course::uuid
on conflict do nothing;

insert into course_enrollments (
  id, course_id, user_id, order_id, status, price_paid, created_at, activated_at, cancelled_at
)
select
  ('dddddddd-0015-4000-8000-' || lpad(m.n::text, 12, '0'))::uuid,
  c.id, m.user_id::uuid,
  ('dddddddd-0012-4000-8000-' || lpad(m.n::text, 12, '0'))::uuid,
  (case m.state when 'paid' then 'active' when 'pending' then 'pending_payment' else 'cancelled' end)::enrollment_status,
  c.price,
  now() - (m.hours || ' hours')::interval,
  case when m.state = 'paid' then now() - (m.hours || ' hours')::interval + interval '4 minutes' end,
  case when m.state = 'cancelled' then now() - (m.hours || ' hours')::interval + interval '1 day' end
from _mock_studio m
join courses c on c.id = m.course::uuid
on conflict do nothing;

commit;

-- ── Шалгах ─────────────────────────────────────────────────────────────────
-- Дөрвөн мөр: «төлсөн» нь 5 · 3 · 4 · 3, «хүлээж буй» нь 2 · 1 · 0 · 1 байх ёстой.

select c.name_mn as "анги", c.capacity as "суудал",
       count(*) filter (where e.status = 'active')          as "төлсөн",
       count(*) filter (where e.status = 'pending_payment') as "хүлээж буй",
       count(*) filter (where e.status = 'cancelled')       as "цуцалсан",
       coalesce(sum(e.price_paid) filter (where e.status = 'active'), 0) as "орлого ₮"
from courses c
left join course_enrollments e on e.course_id = c.id
where c.id::text like 'dddddddd-0011-%'
group by c.name_mn, c.capacity, c.sort_order
order by c.sort_order;
