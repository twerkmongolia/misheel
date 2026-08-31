-- ═══════════════════════════════════════════════════════════════════════════
-- Twerk Mongolia — НҮҮР ХУУДАСНЫ ЗАГВАР ХАРАХ ТҮР ӨГӨГДӨЛ
--
-- Зорилго: нүүрний бүлэг БҮРИЙГ дүүрэн өгөгдөлтэй нь харах. Хоосон бүлэг
-- зохиомжийг харуулахгүй — хэвтээ зам нэг хайрцагтай бол зам биш, шатласан
-- хөрөг хоёрхон байвал шат биш.
--
-- ⚠️ Энэ бол ТҮР өгөгдөл. Харж дуусаад `mock-home-cleanup.sql` -ийг
--    ажиллуулж бүрэн устгана.
--
-- Бүх мөрийн id нь `dddddddd-` -ээр эхэлнэ. Цэвэрлэгээ яг үүгээр л олно
-- — жинхэнэ өгөгдөлд хуруу хүрэхгүй.
--
-- Дахин ажиллуулахад аюулгүй (`on conflict do nothing`).
--
-- Ажиллуулах: Supabase Dashboard → SQL Editor → буулгаад Run.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Байршил ────────────────────────────────────────────────────────────────
-- Хуваарийн мөр бүрд «багш · заал» гэж гарна. Хоёр заал байх нь мөрүүд
-- хоорондоо ялгаатай болохыг харуулна.

insert into locations (id, name, address_mn, address_en, default_capacity, is_active) values
('dddddddd-0001-4000-8000-000000000001', '[MOCK] Үндсэн заал',
 'СБД, 1-р хороо, Их сургуулийн гудамж 12, 3 давхар',
 'Sukhbaatar district, Ikh Surguuliin gudamj 12, 3rd floor', 16, true),
('dddddddd-0001-4000-8000-000000000002', '[MOCK] Жижиг заал',
 'СБД, 1-р хороо, Их сургуулийн гудамж 12, 2 давхар',
 'Sukhbaatar district, Ikh Surguuliin gudamj 12, 2nd floor', 8, true)
on conflict do nothing;

-- ── Багш нар ───────────────────────────────────────────────────────────────
-- Нүүрэнд ЭХНИЙ ГУРАВ нь шатласан хөрөг болж гарна (2 дахь нь 10, 3 дахь нь
-- 20 нэгжээр доошилно). Дөрөв дэх нь «Бүгд →» холбоос утгатай болгоно.
--
-- 4 дэх нь ЗУРАГГҮЙ — шинэ монохром орлуулагч ямар харагдахыг зэрэгцүүлж
-- харах боломж. `sort_order` бага байх тул жинхэнэ багш нарын өмнө гарна.

insert into instructors (id, slug, name, bio_mn, bio_en, photo_url, instagram, sort_order, is_active) values
('dddddddd-0002-4000-8000-000000000001', 'mock-saraa', 'Сараа',
 'Twerk Mongolia-гийн үүсгэн байгуулагч. 8 жилийн туршлагатай, анхан шатны хичээлүүдийг хөтөлдөг.',
 'Founder of Twerk Mongolia. Eight years of experience, leads the beginner classes.',
 '/media/studio-1.svg', 'saraa.dance', 1, true),
('dddddddd-0002-4000-8000-000000000002', 'mock-nomin', 'Номин',
 'Choreography болон ахисан түвшний хичээл заадаг. Олон улсын тэмцээний шагналт.',
 'Teaches choreography and advanced classes. International competition medalist.',
 '/media/studio-2.svg', 'nomin.moves', 2, true),
('dddddddd-0002-4000-8000-000000000003', 'mock-tsetseg', 'Цэцэг',
 'Stretching болон биеийн бэлтгэлийн хичээл. Дасгал зүтгэлтний мэргэжилтэн.',
 'Stretching and conditioning classes. Certified fitness trainer.',
 '/media/studio-3.svg', 'tsetseg.flex', 3, true),
('dddddddd-0002-4000-8000-000000000004', 'mock-anu', 'Ану',
 'Heels болон dancehall. Тайзны хөдөлгөөн, илэрхийлэлд төвлөрдөг.',
 'Heels and dancehall. Focused on stage movement and expression.',
 null, 'anu.heels', 4, true)
on conflict do nothing;

-- ── Хичээлийн төрөл ────────────────────────────────────────────────────────
-- ДОЛОО. Хоёр шалтгаанаар:
--   · гүйдэг тууз — 3-4 нэрээр давталт нь нүдэнд шууд илэрч, хэмнэл алдагдана
--   · хэвтээ зам  — дэлгэц дүүрснээс цааш үргэлжилж байж л «гүйлгэ» гэж дуудна
--
-- Түвшин гурвуулаа орсон: зам дээрх шошго (ЭХЛЭГЧ / ДУНД / АХИСАН) гурван
-- урттай байхад зохиомж яаж тэсэхийг харна.
--
-- Сүүлийн хоёр нь ЗУРАГГҮЙ — зурагтай хайрцгийн хажууд монохром орлуулагч
-- ямар унших вэ гэдгийг нэг эгнээнд харьцуулна.

insert into class_types (id, slug, name_mn, name_en, desc_mn, desc_en, level, duration_min, cover_url, base_price, sort_order, is_active) values
('dddddddd-0003-4000-8000-000000000001', 'mock-twerk-basics', 'Twerk үндэс', 'Twerk Basics',
 'Огт туршлагагүй хүнд зориулсан. Үндсэн хөдөлгөөн, хэмнэл, биеийн байрлалыг эхнээс нь заана.',
 'For complete beginners. Core movements, rhythm and body positioning from scratch.',
 'beginner', 60, '/media/studio-4.svg', 35000, 1, true),
('dddddddd-0003-4000-8000-000000000002', 'mock-choreography', 'Choreography', 'Choreography',
 'Дуу бүрд бүтэн бүжиг сурна. Үндсэн хөдөлгөөнүүдийг мэддэг хүнд тохиромжтой.',
 'Learn a full routine to a track. Suited to those who know the basics.',
 'intermediate', 75, '/media/studio-5.svg', 40000, 2, true),
('dddddddd-0003-4000-8000-000000000003', 'mock-advanced-flow', 'Ахисан түвшин', 'Advanced Flow',
 'Хурд, техник, тайз дээрх илэрхийлэл. Дор хаяж 6 сар бүжиглэсэн байх шаардлагатай.',
 'Speed, technique and stage presence. Requires at least six months of practice.',
 'advanced', 90, '/media/studio-6.svg', 45000, 3, true),
('dddddddd-0003-4000-8000-000000000004', 'mock-stretch', 'Stretch & Conditioning', 'Stretch & Conditioning',
 'Уян хатан байдал, тэсвэр. Бүжгийн хичээлийг нөхөх дасгалууд.',
 'Flexibility and stamina. A complement to the dance classes.',
 'beginner', 60, '/media/studio-1.svg', 30000, 4, true),
('dddddddd-0003-4000-8000-000000000005', 'mock-heels', 'Heels', 'Heels',
 'Өндөр өсгийтэй бүжиг. Тэнцвэр, алхаа, өөртөө итгэх итгэл.',
 'Dancing in heels. Balance, walk and confidence.',
 'intermediate', 75, '/media/studio-2.svg', 42000, 5, true),
('dddddddd-0003-4000-8000-000000000006', 'mock-dancehall', 'Dancehall', 'Dancehall',
 'Ямайкийн уламжлалт хөдөлгөөнүүд. Хэмнэл сайтай, хөгжилтэй хичээл.',
 'Traditional Jamaican movement. Rhythm-heavy and a lot of fun.',
 'beginner', 60, null, 35000, 6, true),
('dddddddd-0003-4000-8000-000000000007', 'mock-technique', 'Twerk техник', 'Twerk Technique',
 'Ганц хөдөлгөөнийг задалж, цэвэрлэх. Ахисан түвшний бэлтгэл.',
 'Breaking a single move down and cleaning it up. Advanced conditioning.',
 'advanced', 90, null, 50000, 7, true)
on conflict do nothing;

-- ── Хуваарь ────────────────────────────────────────────────────────────────
-- Нүүр ЗУРГААН хичээл асууж, ТАВЫГ нь мөр болгож харуулна. Зургаа дахь нь
-- «Бүх хуваарь →» дарахад цааш үргэлжилж байгааг батална.
--
-- Суудлын төлөв ЗОРИУДААР өөр өөр — мөрийн баруун талын шошго нь монохром
-- системд хэлбэрээр (дүүрсэн / хүрээтэй / тасархай) ялгардаг. Гурвуулаа
-- нэг дэлгэцэнд харагдаж байж л систем ажиллаж байгаа эсэх нь мэдэгдэнэ:
--
--   1 · 14/16 захиалагдсан → «2 суудал үлдсэн»  · хүрээтэй (анхаар)
--   2 · 14/14 захиалагдсан → «Дүүрэн»            · хүрээтэй
--   3 ·  4/16 захиалагдсан → «12 суудал үлдсэн» · бүдэг (энгийн)
--   4 ·  7/8  захиалагдсан → «1 суудал үлдсэн»  · хүрээтэй
--   5 ·  2/12 захиалагдсан → «10 суудал үлдсэн» · бүдэг
--   6 ·  9/16 захиалагдсан → «7 суудал үлдсэн»  · бүдэг
--
-- Цагийг Улаанбаатарын өнөөдрийн шөнө дундаас тоолно — хэзээ ажиллуулсан
-- ч мөрүүд ирээдүйд үлдэнэ (`getUpcomingSessions` нь `now()` -оос хойшхийг
-- л авдаг).

insert into class_sessions
  (id, class_type_id, instructor_id, location_id, starts_at, ends_at, capacity, booked_count, price, status)
values
-- 1 · маргааш 19:00 — бараг дүүрсэн
('dddddddd-0004-4000-8000-000000000001',
 'dddddddd-0003-4000-8000-000000000001', 'dddddddd-0002-4000-8000-000000000001',
 'dddddddd-0001-4000-8000-000000000001',
 (date_trunc('day', now() at time zone 'Asia/Ulaanbaatar') + interval '1 day 19 hours') at time zone 'Asia/Ulaanbaatar',
 (date_trunc('day', now() at time zone 'Asia/Ulaanbaatar') + interval '1 day 20 hours') at time zone 'Asia/Ulaanbaatar',
 16, 14, 35000, 'scheduled'),

-- 2 · маргааш 20:15 — ДҮҮРЭН (бүртгүүлэх товч гарахгүй)
('dddddddd-0004-4000-8000-000000000002',
 'dddddddd-0003-4000-8000-000000000002', 'dddddddd-0002-4000-8000-000000000002',
 'dddddddd-0001-4000-8000-000000000001',
 (date_trunc('day', now() at time zone 'Asia/Ulaanbaatar') + interval '1 day 20 hours 15 minutes') at time zone 'Asia/Ulaanbaatar',
 (date_trunc('day', now() at time zone 'Asia/Ulaanbaatar') + interval '1 day 21 hours 30 minutes') at time zone 'Asia/Ulaanbaatar',
 14, 14, 40000, 'scheduled'),

-- 3 · нөгөөдөр 18:00 — сул
('dddddddd-0004-4000-8000-000000000003',
 'dddddddd-0003-4000-8000-000000000005', 'dddddddd-0002-4000-8000-000000000004',
 'dddddddd-0001-4000-8000-000000000001',
 (date_trunc('day', now() at time zone 'Asia/Ulaanbaatar') + interval '2 days 18 hours') at time zone 'Asia/Ulaanbaatar',
 (date_trunc('day', now() at time zone 'Asia/Ulaanbaatar') + interval '2 days 19 hours 15 minutes') at time zone 'Asia/Ulaanbaatar',
 16, 4, 42000, 'scheduled'),

-- 4 · нөгөөдөр 19:30 — ганц суудал, жижиг заал
('dddddddd-0004-4000-8000-000000000004',
 'dddddddd-0003-4000-8000-000000000004', 'dddddddd-0002-4000-8000-000000000003',
 'dddddddd-0001-4000-8000-000000000002',
 (date_trunc('day', now() at time zone 'Asia/Ulaanbaatar') + interval '2 days 19 hours 30 minutes') at time zone 'Asia/Ulaanbaatar',
 (date_trunc('day', now() at time zone 'Asia/Ulaanbaatar') + interval '2 days 20 hours 30 minutes') at time zone 'Asia/Ulaanbaatar',
 8, 7, 30000, 'scheduled'),

-- 5 · 3 хоногийн дараа 20:00 — ахисан түвшин, 90 мин
('dddddddd-0004-4000-8000-000000000005',
 'dddddddd-0003-4000-8000-000000000003', 'dddddddd-0002-4000-8000-000000000002',
 'dddddddd-0001-4000-8000-000000000001',
 (date_trunc('day', now() at time zone 'Asia/Ulaanbaatar') + interval '3 days 20 hours') at time zone 'Asia/Ulaanbaatar',
 (date_trunc('day', now() at time zone 'Asia/Ulaanbaatar') + interval '3 days 21 hours 30 minutes') at time zone 'Asia/Ulaanbaatar',
 12, 2, 45000, 'scheduled'),

-- 6 · 4 хоногийн дараа 12:00 — өдрийн хичээл, нүүрэнд гарахгүй
('dddddddd-0004-4000-8000-000000000006',
 'dddddddd-0003-4000-8000-000000000006', 'dddddddd-0002-4000-8000-000000000001',
 'dddddddd-0001-4000-8000-000000000001',
 (date_trunc('day', now() at time zone 'Asia/Ulaanbaatar') + interval '4 days 12 hours') at time zone 'Asia/Ulaanbaatar',
 (date_trunc('day', now() at time zone 'Asia/Ulaanbaatar') + interval '4 days 13 hours') at time zone 'Asia/Ulaanbaatar',
 16, 9, 35000, 'scheduled')
on conflict do nothing;

-- ── Дэлгүүр ────────────────────────────────────────────────────────────────
-- Нүүрэнд ДӨРӨВ гарна — хоёр баганад хоёр мөр. Нэр урт, богино хосолсон:
-- нэр ба үнэ нэг мөрөнд baseline-даа эгнэдэг эсэхийг шалгана.

insert into products (id, slug, name_mn, name_en, desc_mn, desc_en, category, base_price, sort_order, is_active) values
('dddddddd-0005-4000-8000-000000000001', 'mock-crop-top', 'Crop top', 'Crop top',
 'Бүжгийн дасгалд зориулсан амьсгалдаг даавуутай crop top.',
 'Breathable crop top made for dance practice.', 'хувцас', 65000, 1, true),
('dddddddd-0005-4000-8000-000000000002', 'mock-joggers', 'Joggers өмд', 'Joggers',
 'Уян хатан, хөдөлгөөнд саад болохгүй сунадаг өмд.',
 'Stretchy joggers that never get in the way of a move.', 'хувцас', 89000, 2, true),
('dddddddd-0005-4000-8000-000000000003', 'mock-knee-pads', 'Өвдөгний хамгаалалт', 'Knee pads',
 'Шалан дээрх хөдөлгөөнд заавал хэрэгтэй зузаан дэвсгэртэй.',
 'Thick padding — essential for floor work.', 'хэрэгсэл', 45000, 3, true),
('dddddddd-0005-4000-8000-000000000004', 'mock-tote-bag', 'Tote цүнх', 'Tote bag',
 'Twerk Mongolia лого бүхий даавуун цүнх.',
 'Canvas tote with the Twerk Mongolia logo.', 'merch', 25000, 4, true)
on conflict do nothing;

-- Сүүлийн бараа ЗУРАГГҮЙ — 5:4 харьцаатай монохром орлуулагчийг
-- зурагтай хайрцгуудын хажууд харна.
insert into product_images (id, product_id, url, alt, sort_order) values
('dddddddd-0006-4000-8000-000000000001', 'dddddddd-0005-4000-8000-000000000001', '/media/studio-2.svg', 'Crop top', 1),
('dddddddd-0006-4000-8000-000000000002', 'dddddddd-0005-4000-8000-000000000002', '/media/studio-3.svg', 'Joggers', 1),
('dddddddd-0006-4000-8000-000000000003', 'dddddddd-0005-4000-8000-000000000003', '/media/studio-4.svg', 'Өвдөгний хамгаалалт', 1)
on conflict do nothing;

-- Нүүрэнд харагдах үнэ нь `min(variant.price)` — сонголтууд өөр өөр үнэтэй
-- байх нь «эхлэн» гэсэн үнийн логикийг шалгана.
insert into product_variants (id, product_id, sku, size, color, price, stock_qty, is_active) values
('dddddddd-0007-4000-8000-000000000001', 'dddddddd-0005-4000-8000-000000000001', 'MOCK-CROP-S-BLK', 'S', 'Хар', 65000, 8, true),
('dddddddd-0007-4000-8000-000000000002', 'dddddddd-0005-4000-8000-000000000001', 'MOCK-CROP-M-BLK', 'M', 'Хар', 65000, 12, true),
('dddddddd-0007-4000-8000-000000000003', 'dddddddd-0005-4000-8000-000000000001', 'MOCK-CROP-M-PNK', 'M', 'Ягаан', 68000, 3, true),
('dddddddd-0007-4000-8000-000000000004', 'dddddddd-0005-4000-8000-000000000002', 'MOCK-JOG-S-BLK', 'S', 'Хар', 89000, 6, true),
('dddddddd-0007-4000-8000-000000000005', 'dddddddd-0005-4000-8000-000000000002', 'MOCK-JOG-M-BLK', 'M', 'Хар', 89000, 9, true),
('dddddddd-0007-4000-8000-000000000006', 'dddddddd-0005-4000-8000-000000000003', 'MOCK-KNEE-ONE', 'Стандарт', 'Хар', 45000, 20, true),
('dddddddd-0007-4000-8000-000000000007', 'dddddddd-0005-4000-8000-000000000004', 'MOCK-TOTE-ONE', 'Стандарт', 'Цагаан', 25000, 30, true)
on conflict do nothing;

-- ── Шалгах ─────────────────────────────────────────────────────────────────
-- Бүлэг бүрд хэдэн мөр орсныг тоолно. Хэвтээ зам 7, хуваарь 6, багш 4,
-- бараа 4 байвал нүүр бүрэн дүүрнэ.

select 'locations'        as "хүснэгт", count(*) as "мөр" from locations        where id::text like 'dddddddd-%'
union all select 'instructors',      count(*) from instructors      where id::text like 'dddddddd-%'
union all select 'class_types',      count(*) from class_types      where id::text like 'dddddddd-%'
union all select 'class_sessions',   count(*) from class_sessions   where id::text like 'dddddddd-%'
union all select 'products',         count(*) from products         where id::text like 'dddddddd-%'
union all select 'product_images',   count(*) from product_images   where id::text like 'dddddddd-%'
union all select 'product_variants', count(*) from product_variants where id::text like 'dddddddd-%';
