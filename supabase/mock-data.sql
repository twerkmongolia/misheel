-- ═══════════════════════════════════════════════════════════════════════════
-- Twerk Mongolia — ЗАГВАР ХАРАХ ТҮР ӨГӨГДӨЛ (зурагтайгаа хамт)
--
-- Зорилго: хуудас БҮРИЙГ дүүрэн өгөгдөлтэй нь харах. Хоосон хэсэг зохиомжийг
-- харуулахгүй — хэвтээ зам нэг хайрцагтай бол зам биш, шатласан хөрөг
-- хоёрхон байвал шат биш.
--
-- Юу орох вэ:
--   2  байршил          4  багш           7  хичээлийн төрөл
--   9  хуваарийн цаг    4  бараа         10  барааны хувилбар
--   4  барааны зураг    5  түгээмэл асуулт
--
-- Админы хяналтын самбарт:
--   6  хэрэглэгч       12  хичээлийн бүртгэл  5  хүлээлгийн жагсаалт
--  16  захиалга        21  захиалгын мөр
--
-- ЗУРАГ нь энэ файлд ШУУД орсон. Урьд нь хийсвэр орлуулагч заагаад, дараа нь
-- тусдаа скриптээр дарж бичдэг байв — хоёр алхам, хоёр файл. Одоо нэг.
--
-- Зургууд public/media/mock/ дотор БЭЛЭН байгаа: жинхэнэ гэрэл зургаас
-- зүсэгдсэн. Файл байхгүй байсан ч эвдэрсэн зураг ГАРАХГҮЙ — сервер замыг
-- шалгаад, олдохгүй бол монохром орлуулагч зурна.
--
-- ⚠️ Энэ бол ТҮР өгөгдөл. Харж дуусаад mock-data-cleanup.sql -ийг
--    ажиллуулж бүрэн устгана.
--
-- Бүх мөрийн id нь dddddddd- гэж эхэлнэ. Цэвэрлэгээ яг үүгээр л олно —
-- жинхэнэ өгөгдөлд хуруу хүрэхгүй.
--
-- ⚠️ Түр хэрэглэгчид нь `auth.users` дотор ЖИНХЭНЭ бүртгэл болж үүснэ —
--    захиалга, хичээлийн бүртгэл нь хэрэглэгч рүү заадаг тул өөр арга алга.
--    Нууц үггүй тул нэвтэрч болохгүй, имэйл нь @example.com.
--
-- Энд БАЙХГҮЙ хоёр зүйл, шалтгааны хамт:
--   · галерей   — `public/media/gallery/` доторх жинхэнэ зургуудаас уншдаг.
--                 Мөр нэмбэл тэдгээрийг ДАРЖ бичих тул хөндөөгүй.
--   · site_content — түлхүүрээр (`hero`, `about`, …) ялгагддаг тул түр
--                 мөр нь жинхэнэ контенттой мөргөлдөнө. seed.sql -д бий.
--
-- Дахин ажиллуулахад аюулгүй (on conflict do nothing).
--
-- Ажиллуулах: Supabase Dashboard -> SQL Editor -> буулгаад Run.
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
 '/media/mock/instructor-1.jpg', 'saraa.dance', 1, true),
('dddddddd-0002-4000-8000-000000000002', 'mock-nomin', 'Номин',
 'Choreography болон ахисан түвшний хичээл заадаг. Олон улсын тэмцээний шагналт.',
 'Teaches choreography and advanced classes. International competition medalist.',
 '/media/mock/instructor-2.jpg', 'nomin.moves', 2, true),
('dddddddd-0002-4000-8000-000000000003', 'mock-tsetseg', 'Цэцэг',
 'Stretching болон биеийн бэлтгэлийн хичээл. Дасгал зүтгэлтний мэргэжилтэн.',
 'Stretching and conditioning classes. Certified fitness trainer.',
 '/media/mock/instructor-3.jpg', 'tsetseg.flex', 3, true),
('dddddddd-0002-4000-8000-000000000004', 'mock-anu', 'Ану',
 'Heels болон dancehall. Тайзны хөдөлгөөн, илэрхийлэлд төвлөрдөг.',
 'Heels and dancehall. Focused on stage movement and expression.',
 '/media/mock/instructor-4.jpg', 'anu.heels', 4, true)
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
 'beginner', 60, '/media/mock/class-twerk-basics.jpg', 35000, 1, true),
('dddddddd-0003-4000-8000-000000000002', 'mock-choreography', 'Choreography', 'Choreography',
 'Дуу бүрд бүтэн бүжиг сурна. Үндсэн хөдөлгөөнүүдийг мэддэг хүнд тохиромжтой.',
 'Learn a full routine to a track. Suited to those who know the basics.',
 'intermediate', 75, '/media/mock/class-choreography.jpg', 40000, 2, true),
('dddddddd-0003-4000-8000-000000000003', 'mock-advanced-flow', 'Ахисан түвшин', 'Advanced Flow',
 'Хурд, техник, тайз дээрх илэрхийлэл. Дор хаяж 6 сар бүжиглэсэн байх шаардлагатай.',
 'Speed, technique and stage presence. Requires at least six months of practice.',
 'advanced', 90, '/media/mock/class-advanced.jpg', 45000, 3, true),
('dddddddd-0003-4000-8000-000000000004', 'mock-stretch', 'Stretch & Conditioning', 'Stretch & Conditioning',
 'Уян хатан байдал, тэсвэр. Бүжгийн хичээлийг нөхөх дасгалууд.',
 'Flexibility and stamina. A complement to the dance classes.',
 'beginner', 60, '/media/mock/class-stretch.jpg', 30000, 4, true),
('dddddddd-0003-4000-8000-000000000005', 'mock-heels', 'Heels', 'Heels',
 'Өндөр өсгийтэй бүжиг. Тэнцвэр, алхаа, өөртөө итгэх итгэл.',
 'Dancing in heels. Balance, walk and confidence.',
 'intermediate', 75, '/media/mock/class-heels.jpg', 42000, 5, true),
('dddddddd-0003-4000-8000-000000000006', 'mock-dancehall', 'Dancehall', 'Dancehall',
 'Ямайкийн уламжлалт хөдөлгөөнүүд. Хэмнэл сайтай, хөгжилтэй хичээл.',
 'Traditional Jamaican movement. Rhythm-heavy and a lot of fun.',
 'beginner', 60, '/media/mock/class-dancehall.jpg', 35000, 6, true),
('dddddddd-0003-4000-8000-000000000007', 'mock-technique', 'Twerk техник', 'Twerk Technique',
 'Ганц хөдөлгөөнийг задалж, цэвэрлэх. Ахисан түвшний бэлтгэл.',
 'Breaking a single move down and cleaning it up. Advanced conditioning.',
 'advanced', 90, '/media/mock/class-technique.jpg', 50000, 7, true)
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
-- Сүүлийн ГУРАВ нь ӨНӨӨДӨР. Тэдгээр нь зочны хуудсанд бус, админы хяналтын
-- самбарт хэрэгтэй: «Өнөөдрийн хичээл», «Өнөөдрийн дүүргэлт» гэсэн хоёр тоо
-- болон доорх хүснэгт нь зөвхөн ӨНӨӨДРИЙН мөрөөр амьдардаг. Маргаашийн
-- хичээл тэнд харагдахгүй тул самбар хоосон үлддэг байв.
--
--   7 · өнөөдөр 12:30 →  5/8   (доорх 5 бүртгэлээр тоологдоно)
--   8 · өнөөдөр 19:00 → 12/16
--   9 · өнөөдөр 20:15 → 14/14  дүүрэн — хүлээлгийн жагсаалттай
--
-- Дүүргэлт = 31/38 = 82%.
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
 16, 9, 35000, 'scheduled'),

-- 7 · ӨНӨӨДӨР 12:30 — жижиг заал, доорх бүртгэлүүд суудлыг нь дүүргэнэ
('dddddddd-0004-4000-8000-000000000007',
 'dddddddd-0003-4000-8000-000000000004', 'dddddddd-0002-4000-8000-000000000003',
 'dddddddd-0001-4000-8000-000000000002',
 (date_trunc('day', now() at time zone 'Asia/Ulaanbaatar') + interval '12 hours 30 minutes') at time zone 'Asia/Ulaanbaatar',
 (date_trunc('day', now() at time zone 'Asia/Ulaanbaatar') + interval '13 hours 30 minutes') at time zone 'Asia/Ulaanbaatar',
 8, 5, 30000, 'scheduled'),

-- 8 · ӨНӨӨДӨР 19:00 — үндсэн заал, сул суудалтай
('dddddddd-0004-4000-8000-000000000008',
 'dddddddd-0003-4000-8000-000000000001', 'dddddddd-0002-4000-8000-000000000001',
 'dddddddd-0001-4000-8000-000000000001',
 (date_trunc('day', now() at time zone 'Asia/Ulaanbaatar') + interval '19 hours') at time zone 'Asia/Ulaanbaatar',
 (date_trunc('day', now() at time zone 'Asia/Ulaanbaatar') + interval '20 hours') at time zone 'Asia/Ulaanbaatar',
 16, 12, 35000, 'scheduled'),

-- 9 · ӨНӨӨДӨР 20:15 — ДҮҮРЭН
('dddddddd-0004-4000-8000-000000000009',
 'dddddddd-0003-4000-8000-000000000002', 'dddddddd-0002-4000-8000-000000000002',
 'dddddddd-0001-4000-8000-000000000001',
 (date_trunc('day', now() at time zone 'Asia/Ulaanbaatar') + interval '20 hours 15 minutes') at time zone 'Asia/Ulaanbaatar',
 (date_trunc('day', now() at time zone 'Asia/Ulaanbaatar') + interval '21 hours 30 minutes') at time zone 'Asia/Ulaanbaatar',
 14, 14, 40000, 'scheduled')
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

-- Дөрвүүлээ зурагтай. Орлуулагч ямар харагдахыг үзэх бол мөрийг нь
-- устгаад дахин ажиллуул — код хөндөх шаардлагагүй.
insert into product_images (id, product_id, url, alt, sort_order) values
('dddddddd-0006-4000-8000-000000000001', 'dddddddd-0005-4000-8000-000000000001', '/media/mock/product-crop-top.jpg', 'Crop top', 1),
('dddddddd-0006-4000-8000-000000000002', 'dddddddd-0005-4000-8000-000000000002', '/media/mock/product-joggers.jpg', 'Joggers', 1),
('dddddddd-0006-4000-8000-000000000003', 'dddddddd-0005-4000-8000-000000000003', '/media/mock/product-knee-pads.jpg', 'Өвдөгний хамгаалалт', 1),
('dddddddd-0006-4000-8000-000000000004', 'dddddddd-0005-4000-8000-000000000004', '/media/mock/product-tote.jpg', 'Tote цүнх', 1)
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
('dddddddd-0007-4000-8000-000000000007', 'dddddddd-0005-4000-8000-000000000004', 'MOCK-TOTE-ONE', 'Стандарт', 'Цагаан', 25000, 30, true),

-- Сүүлийн гурав нь НӨӨЦ ДУУСЧ БУЙ. Хяналтын самбарын «Дуусаж буй нөөц»
-- самбар 3-аас цөөн ширхэгтэйг нь жагсаадаг бөгөөд тэг нь улаан («Дууссан»),
-- үлдэгдэлтэй нь шар шошготой гардаг. Дөрвөн мөр (0 · 1 · 2 · 3) байж л
-- хоёр шошго зэрэгцэн харагдана.
('dddddddd-0007-4000-8000-000000000008', 'dddddddd-0005-4000-8000-000000000001', 'MOCK-CROP-L-BLK', 'L', 'Хар', 65000, 0, true),
('dddddddd-0007-4000-8000-000000000009', 'dddddddd-0005-4000-8000-000000000002', 'MOCK-JOG-L-BLK', 'L', 'Хар', 89000, 1, true),
('dddddddd-0007-4000-8000-000000000010', 'dddddddd-0005-4000-8000-000000000003', 'MOCK-KNEE-BIG', 'Том', 'Хар', 47000, 2, true)
on conflict do nothing;

-- ── Түгээмэл асуулт ────────────────────────────────────────────────────────
-- seed.sql дэх асуултуудтай ДАВХАРДАХГҮЙ — өөр сэдвүүд сонгосон. Хоёуланг нь
-- ажиллуулсан ч жагсаалт нь давхар асуулттай болохгүй.
--
-- `sort_order` нь 50-аас эхэлнэ: жинхэнэ асуултууд (1-7) дээр нь үлдэж,
-- түр өгөгдөл нь доор нь эгнэнэ.

insert into faq_items (id, question_mn, question_en, answer_mn, answer_en, sort_order, is_active) values
('dddddddd-000d-4000-8000-000000000001',
 'Заалны ойролцоо машинаа тавьж болох уу?',
 'Is there parking near the studio?',
 'Байрны урд талд задгай зогсоол бий, оройн хичээлийн цагаар голдуу чөлөөтэй байдаг. Дүүрсэн тохиолдолд гудамжны эсрэг талын төлбөртэй зогсоол хамгийн ойрхон.',
 'There is an open car park in front of the building, usually free in the evenings. If it is full, the paid car park across the street is the closest option.', 50, true),
('dddddddd-000d-4000-8000-000000000002',
 'Хэдэн наснаас хичээлд явж болох вэ?',
 'What is the minimum age?',
 'Насанд хүрэгчдийн бүлэгт 16-аас дээш насны хүн бүртгүүлнэ. 16-18 насныханд эцэг эхийн зөвшөөрөл шаардана — анхны хичээл дээрээ авчирна.',
 'Our adult groups take students from 16. Between 16 and 18 we ask for a parent’s consent — bring it to your first class.', 51, true),
('dddddddd-000d-4000-8000-000000000003',
 'Бэлгийн эрхийн бичиг байдаг уу?',
 'Do you sell gift cards?',
 'Тийм. Дурын дүнгээр эсвэл тодорхой хичээлийн багцаар авах боломжтой. Бидэн рүү Instagram-аар бичихэд нэрлэсэн код илгээнэ, эрхийн бичиг 6 сар хүчинтэй.',
 'Yes — for any amount, or as a class package. Message us on Instagram and we will send a named code; gift cards are valid for six months.', 52, true),
('dddddddd-000d-4000-8000-000000000004',
 'Бүлгээрээ захиалж болох уу?',
 'Can I book the studio for a group?',
 'Төрсөн өдөр, багийн арга хэмжээнд зориулж бүтэн заалыг цагаар түрээслэх боломжтой. 8-аас дээш хүнтэй бүлэгт багш дагалдана — үнийг хүний тоогоор тооцно.',
 'You can hire the whole studio by the hour for birthdays and team events. Groups of eight or more come with an instructor — the price is per person.', 53, true),
('dddddddd-000d-4000-8000-000000000005',
 'Хичээл дээр зураг, бичлэг хийдэг үү?',
 'Do you film during class?',
 'Хичээлийн төгсгөлд заримдаа бичлэг хийдэг ч ЗӨВХӨН зөвшөөрсөн хүмүүс кадрт үлдэнэ. Хэрэв та орохыг хүсэхгүй бол багшид хэлэхэд хангалттай — асуулт нэмж гарахгүй.',
 'We sometimes film at the end of a class, but only people who agreed stay in the frame. Tell the instructor if you would rather not be filmed — no further questions asked.', 54, true)
on conflict do nothing;

-- ═══════════════════════════════════════════════════════════════════════════
-- АДМИН ТАЛ
--
-- Дээрх мөрүүд нь ЗОЧНЫ хуудсуудыг дүүргэнэ. Хяналтын самбар огт өөр
-- өгөгдлөөр амьдардаг: хэрэглэгч, захиалга, бүртгэл. Тэдгээргүй бол /admin
-- нь тоо болгон нь тэг, самбар болгон нь «алга» гэсэн хоосон хуудас болно —
-- зохиомжийн тухай юу ч хэлж чадахгүй.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Хэрэглэгч ──────────────────────────────────────────────────────────────
-- `profiles.id` нь `auth.users` руу заадаг тул эхлээд БҮРТГЭЛ үүсгэнэ. Дараа
-- нь `on_auth_user_created` trigger профайлыг өөрөө үүсгэж, нэр, утсыг
-- `raw_user_meta_data` -аас уншина (§ migrations/…_functions.sql).
--
-- ⚠️ Токены баганууд ХООСОН МӨР байх ёстой, NULL биш. Хэрэглэгчид хуудас нь
--    имэйлийг Admin API-аар татдаг бөгөөд тэр API эдгээрийг мөр гэж уншина —
--    NULL байвал бүтэн хуудас алдаанд унана.
--
-- Нууц үг ТАВИАГҮЙ: эдгээрээр нэвтэрч болохгүй, зөвхөн жагсаалтад харагдана.
-- Имэйл нь @example.com — санамсаргүй хүн рүү захидал явахгүй.

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
  ('dddddddd-0008-4000-8000-000000000001', 'mock.ariunaa@example.com',  'Ариунаа Б.',       '9911 2233', 40),
  ('dddddddd-0008-4000-8000-000000000002', 'mock.bolormaa@example.com', 'Болормаа Д.',      '9955 4471', 26),
  ('dddddddd-0008-4000-8000-000000000003', 'mock.nomin@example.com',    'Номин-Эрдэнэ Т.',  '8802 1190', 18),
  ('dddddddd-0008-4000-8000-000000000004', 'mock.suvd@example.com',     'Сувд-Эрдэнэ Ж.',   '9509 3382', 11),
  ('dddddddd-0008-4000-8000-000000000005', 'mock.khulan@example.com',   'Хулан Г.',         '8811 6604', 5),
  ('dddddddd-0008-4000-8000-000000000006', 'mock.misheel@example.com',  'Мишээл О.',        '9922 0715', 2)
) as v(id, email, name, phone, days)
on conflict (id) do nothing;

-- Профайлыг ил бичнэ. Trigger аль хэдийн үүсгэсэн бол зөвхөн нэр, утас,
-- бүртгүүлсэн огноог нь тохируулна — `role` -д ХҮРЭХГҮЙ (эрх өөрчлөхийг
-- `profiles_guard_role` trigger хориглодог, бүгд «customer» хэвээр үлдэнэ).
-- Огноо нь өөр өөр байх нь Хэрэглэгчид хуудасны эрэмбийг (сүүлд
-- бүртгүүлсэн нь дээрээ) харуулна.

insert into profiles (id, full_name, phone, locale, created_at)
select v.id::uuid, v.name, v.phone, 'mn', now() - (v.days || ' days')::interval
from (values
  ('dddddddd-0008-4000-8000-000000000001', 'Ариунаа Б.',      '9911 2233', 40),
  ('dddddddd-0008-4000-8000-000000000002', 'Болормаа Д.',     '9955 4471', 26),
  ('dddddddd-0008-4000-8000-000000000003', 'Номин-Эрдэнэ Т.', '8802 1190', 18),
  ('dddddddd-0008-4000-8000-000000000004', 'Сувд-Эрдэнэ Ж.',  '9509 3382', 11),
  ('dddddddd-0008-4000-8000-000000000005', 'Хулан Г.',        '8811 6604', 5),
  ('dddddddd-0008-4000-8000-000000000006', 'Мишээл О.',       '9922 0715', 2)
) as v(id, name, phone, days)
on conflict (id) do update
  set full_name = excluded.full_name,
      phone     = excluded.phone,
      created_at = excluded.created_at;

-- ── Хичээлийн бүртгэл ──────────────────────────────────────────────────────
-- `booked_count` -ыг ГАРААР бичихгүй: `bookings_sync_count` trigger нь мөр
-- нэмэгдэх бүрд суудлын тоог bookings-оос ДАХИН ТООЛДОГ. Тиймээс бүртгэл
-- нэмсэн цаг бүрийн тоо нь энд бичсэн мөрийн тоотой ТААРАХ ёстой:
--
--   7 дахь цаг (өнөөдөр 12:30) → 5 идэвхтэй  (+1 цуцалсан нь тоологдохгүй)
--   3 дахь цаг (нөгөөдөр 18:00) → 4 идэвхтэй
--   5 дахь цаг (3 хоногийн дараа) → 2 идэвхтэй
--
-- Бусад цагийн тоог дээр гараар бичсэн — тэдгээрт бүртгэл НЭМЭХГҮЙ, эс
-- бөгөөс trigger тоог нь бүртгэлийн тоо болгож бууруулна.
--
-- Төлөв бүр өөр: цуцалсан мөр суудал эзлэхгүй, ирсэн мөр эзэлнэ.

insert into bookings (id, session_id, user_id, status, price_paid, created_at) values
-- Өнөөдөр 12:30 · 5 идэвхтэй + 1 цуцалсан
('dddddddd-000b-4000-8000-000000000001', 'dddddddd-0004-4000-8000-000000000007', 'dddddddd-0008-4000-8000-000000000001', 'confirmed', 30000, now() - interval '6 days'),
('dddddddd-000b-4000-8000-000000000002', 'dddddddd-0004-4000-8000-000000000007', 'dddddddd-0008-4000-8000-000000000002', 'confirmed', 30000, now() - interval '5 days'),
('dddddddd-000b-4000-8000-000000000003', 'dddddddd-0004-4000-8000-000000000007', 'dddddddd-0008-4000-8000-000000000003', 'confirmed', 30000, now() - interval '4 days'),
('dddddddd-000b-4000-8000-000000000004', 'dddddddd-0004-4000-8000-000000000007', 'dddddddd-0008-4000-8000-000000000004', 'attended',  30000, now() - interval '3 days'),
('dddddddd-000b-4000-8000-000000000005', 'dddddddd-0004-4000-8000-000000000007', 'dddddddd-0008-4000-8000-000000000005', 'pending',        0, now() - interval '2 days'),
('dddddddd-000b-4000-8000-000000000006', 'dddddddd-0004-4000-8000-000000000007', 'dddddddd-0008-4000-8000-000000000006', 'cancelled', 30000, now() - interval '7 days'),
-- Нөгөөдөр 18:00 · 4 идэвхтэй
('dddddddd-000b-4000-8000-000000000007', 'dddddddd-0004-4000-8000-000000000003', 'dddddddd-0008-4000-8000-000000000001', 'confirmed', 42000, now() - interval '3 days'),
('dddddddd-000b-4000-8000-000000000008', 'dddddddd-0004-4000-8000-000000000003', 'dddddddd-0008-4000-8000-000000000002', 'confirmed', 42000, now() - interval '2 days'),
('dddddddd-000b-4000-8000-000000000009', 'dddddddd-0004-4000-8000-000000000003', 'dddddddd-0008-4000-8000-000000000003', 'confirmed', 42000, now() - interval '2 days'),
('dddddddd-000b-4000-8000-000000000010', 'dddddddd-0004-4000-8000-000000000003', 'dddddddd-0008-4000-8000-000000000006', 'pending',        0, now() - interval '1 day'),
-- 3 хоногийн дараа 20:00 · 2 идэвхтэй
('dddddddd-000b-4000-8000-000000000011', 'dddddddd-0004-4000-8000-000000000005', 'dddddddd-0008-4000-8000-000000000004', 'confirmed', 45000, now() - interval '1 day'),
('dddddddd-000b-4000-8000-000000000012', 'dddddddd-0004-4000-8000-000000000005', 'dddddddd-0008-4000-8000-000000000005', 'confirmed', 45000, now() - interval '4 hours')
on conflict do nothing;

-- ── Хүлээлгийн жагсаалт ────────────────────────────────────────────────────
-- Зөвхөн ДҮҮРСЭН цагт утгатай. Админы хуваарь хуудсанд мөрийн хажууд
-- «N хүлээж байна» гэж гарна — суудал цуцлагдвал хэнд залгахаа ажилтан
-- тэндээс мэднэ. Хүлээж буй хүн тэр цагтаа бүртгэлгүй байх ёстой.

insert into waitlist (id, session_id, user_id, created_at) values
-- Маргааш 20:15 · дүүрэн (14/14)
('dddddddd-000c-4000-8000-000000000001', 'dddddddd-0004-4000-8000-000000000002', 'dddddddd-0008-4000-8000-000000000003', now() - interval '2 days'),
('dddddddd-000c-4000-8000-000000000002', 'dddddddd-0004-4000-8000-000000000002', 'dddddddd-0008-4000-8000-000000000005', now() - interval '1 day'),
('dddddddd-000c-4000-8000-000000000003', 'dddddddd-0004-4000-8000-000000000002', 'dddddddd-0008-4000-8000-000000000006', now() - interval '6 hours'),
-- Өнөөдөр 20:15 · дүүрэн (14/14)
('dddddddd-000c-4000-8000-000000000004', 'dddddddd-0004-4000-8000-000000000009', 'dddddddd-0008-4000-8000-000000000001', now() - interval '3 days'),
('dddddddd-000c-4000-8000-000000000005', 'dddddddd-0004-4000-8000-000000000009', 'dddddddd-0008-4000-8000-000000000002', now() - interval '2 days')
on conflict do nothing;

-- ── Захиалга · энэ долоо хоног ─────────────────────────────────────────────
-- Хяналтын самбарын «7 хоногийн орлого» нь ЭНЭ ДОЛОО ХОНОГИЙН (Даваа 00:00,
-- Улаанбаатарын цагаар) захиалгуудыг нэмдэг — зөвхөн төлөгдсөнөөс хойшхи
-- төлвүүдийг (paid · preparing · shipped · delivered).
--
-- Цагийг `greatest(now() - N цаг, долоо хоногийн эхлэл)` гэж тооцно. Ямар ч
-- өдөр ажиллуулсан мөрүүд ЭНЭ долоо хоногт багтана: Даваа гарагт ажиллуулбал
-- бүгд долоо хоногийн эхлэл рүү шахагдана, ирээдүй рүү гарахгүй.
--
-- Хүргэлт 5000₮ — seed.sql дэх `shop.shipping_fee` -тэй тааруулсан.

insert into orders (
  id, order_no, user_id, status, subtotal, shipping_fee, total,
  ship_name, ship_phone, ship_district, ship_khoroo, ship_address, created_at, updated_at
)
select
  v.id::uuid, v.order_no, v.user_id::uuid, v.status::order_status,
  v.subtotal, 5000, v.subtotal + 5000,
  v.name, v.phone, v.district, v.khoroo, v.address,
  greatest(now() - (v.hours || ' hours')::interval, a.week_now),
  greatest(now() - (v.hours || ' hours')::interval, a.week_now)
from (
  select date_trunc('week', now() at time zone 'Asia/Ulaanbaatar')
           at time zone 'Asia/Ulaanbaatar' as week_now
) a,
(values
  -- Орлогод тоологдох дөрвөн төлөв. Төлбөр хүлээж буй захиалга нь
  -- дараагийн блокт — тэдгээрийг долоо хоногт шахах шаардлагагүй.
  ('dddddddd-0009-4000-8000-000000000001', 'TM-9001', 'dddddddd-0008-4000-8000-000000000001', 'delivered',  130000, 'Ариунаа Б.',      '9911 2233', 'СБД',  '4-р хороо',  'Их сургуулийн гудамж 12, 45 тоот', 120),
  ('dddddddd-0009-4000-8000-000000000002', 'TM-9002', 'dddddddd-0008-4000-8000-000000000002', 'shipped',     89000, 'Болормаа Д.',     '9955 4471', 'ХУД',  '11-р хороо', 'Зайсангийн гудамж 3, 12 тоот',     96),
  ('dddddddd-0009-4000-8000-000000000003', 'TM-9003', 'dddddddd-0008-4000-8000-000000000003', 'preparing',   68000, 'Номин-Эрдэнэ Т.', '8802 1190', 'БЗД',  '5-р хороо',  'Сансарын 4-р байр, 28 тоот',       72),
  ('dddddddd-0009-4000-8000-000000000004', 'TM-9004', 'dddddddd-0008-4000-8000-000000000004', 'paid',        70000, 'Сувд-Эрдэнэ Ж.',  '9509 3382', 'ЧД',   '1-р хороо',  'Бага тойруу 15, 7 тоот',           30),
  ('dddddddd-0009-4000-8000-000000000005', 'TM-9005', 'dddddddd-0008-4000-8000-000000000005', 'paid',       134000, 'Хулан Г.',        '8811 6604', 'СХД',  '20-р хороо', 'Толгойтын 5-р хороолол, 3 тоот',   20)
) as v(id, order_no, user_id, status, subtotal, name, phone, district, khoroo, address, hours)
on conflict do nothing;

-- ── Захиалга · төлбөр хүлээж буй ───────────────────────────────────────────
-- Эдгээрийг долоо хоногийн эхлэл рүү ШАХАХГҮЙ. Шалтгаан: самбарын «Шинэ
-- захиалга» жагсаалт огноогоор бус ТӨЛВӨӨР шүүж, хамгийн удаан хүлээсэн
-- таваас эхэлж харуулдаг. Мөр бүрийн хажууд хэдэн хоног хүлээснийг бичих
-- бөгөөд 2-оос дээш хоног болсныг нь ШАР өнгөөр тодруулна.
--
-- Долоо хоногийн эхлэл рүү шахвал Даваа гарагт бүгд «өнөөдөр» болж, тэр шар
-- шошго хэзээ ч гарахгүй. Төлбөр хүлээж буй захиалга орлогод тоологддоггүй
-- тул долоо хоногийн хилээс гарсан нь ямар ч тоог гажуудуулахгүй.

insert into orders (
  id, order_no, user_id, status, subtotal, shipping_fee, total,
  ship_name, ship_phone, ship_district, ship_khoroo, ship_address, created_at, updated_at
)
select
  v.id::uuid, v.order_no, v.user_id::uuid, 'pending_payment'::order_status,
  v.subtotal, 5000, v.subtotal + 5000,
  v.name, v.phone, v.district, v.khoroo, v.address,
  now() - (v.hours || ' hours')::interval,
  now() - (v.hours || ' hours')::interval
from (values
  ('dddddddd-0009-4000-8000-000000000012', 'TM-9006', 'dddddddd-0008-4000-8000-000000000006',  65000, 'Мишээл О.',       '9922 0715', 'СБД', '8-р хороо',  'Оюутны гудамж 22, 51 тоот',        5),
  ('dddddddd-0009-4000-8000-000000000013', 'TM-9007', 'dddddddd-0008-4000-8000-000000000001',  89000, 'Ариунаа Б.',      '9911 2233', 'СБД', '4-р хороо',  'Их сургуулийн гудамж 12, 45 тоот', 26),
  ('dddddddd-0009-4000-8000-000000000014', 'TM-9008', 'dddddddd-0008-4000-8000-000000000003',  70000, 'Номин-Эрдэнэ Т.', '8802 1190', 'БЗД', '5-р хороо',  'Сансарын 4-р байр, 28 тоот',       50),
  ('dddddddd-0009-4000-8000-000000000015', 'TM-9009', 'dddddddd-0008-4000-8000-000000000004', 178000, 'Сувд-Эрдэнэ Ж.',  '9509 3382', 'ЧД',  '1-р хороо',  'Бага тойруу 15, 7 тоот',           74),
  ('dddddddd-0009-4000-8000-000000000016', 'TM-9010', 'dddddddd-0008-4000-8000-000000000005',  25000, 'Хулан Г.',        '8811 6604', 'СХД', '20-р хороо', 'Толгойтын 5-р хороолол, 3 тоот',    3)
) as v(id, order_no, user_id, subtotal, name, phone, district, khoroo, address, hours)
on conflict do nothing;

-- ── Захиалга · өмнөх долоо хоног ───────────────────────────────────────────
-- Самбар дээрх «Өмнөх 7 хоногоос +N%» гэсэн харьцуулалт ЗӨВХӨН эдгээр
-- мөрөөс гарна. Байхгүй бол «Өмнөх долоо хоног хоосон» гэж бичигдэнэ —
-- тоо ганцаараа сайн уу, муу юу гэдгээ хэлж чадахгүй.
--
--   энэ долоо хоног  516,000₮
--   өмнөх долоо хоног 443,000₮   →  +16%
--
-- Цуцлагдсан, буцаагдсан хоёр нь орлогод ОРОХГҮЙ: Захиалга хуудасны бүх
-- долоон шүүлтүүр дүүрэн байхын тулд энд байна.

insert into orders (
  id, order_no, user_id, status, subtotal, shipping_fee, total,
  ship_name, ship_phone, ship_district, ship_khoroo, ship_address, created_at, updated_at
)
select
  v.id::uuid, v.order_no, v.user_id::uuid, v.status::order_status,
  v.subtotal, 5000, v.subtotal + 5000,
  v.name, v.phone, v.district, v.khoroo, v.address,
  a.week_prev + v.since_start::interval,
  a.week_prev + v.since_start::interval
from (
  select (date_trunc('week', now() at time zone 'Asia/Ulaanbaatar') - interval '7 days')
           at time zone 'Asia/Ulaanbaatar' as week_prev
) a,
(values
  ('dddddddd-0009-4000-8000-000000000006', 'TM-8001', 'dddddddd-0008-4000-8000-000000000001', 'delivered',  90000, 'Ариунаа Б.',      '9911 2233', 'СБД', '4-р хороо',  'Их сургуулийн гудамж 12, 45 тоот', '1 day 10 hours'),
  ('dddddddd-0009-4000-8000-000000000007', 'TM-8002', 'dddddddd-0008-4000-8000-000000000003', 'delivered',  90000, 'Номин-Эрдэнэ Т.', '8802 1190', 'БЗД', '5-р хороо',  'Сансарын 4-р байр, 28 тоот',       '2 days 16 hours'),
  ('dddddddd-0009-4000-8000-000000000008', 'TM-8003', 'dddddddd-0008-4000-8000-000000000004', 'shipped',   154000, 'Сувд-Эрдэнэ Ж.',  '9509 3382', 'ЧД',  '1-р хороо',  'Бага тойруу 15, 7 тоот',           '3 days 9 hours'),
  ('dddddddd-0009-4000-8000-000000000009', 'TM-8004', 'dddddddd-0008-4000-8000-000000000005', 'paid',       89000, 'Хулан Г.',        '8811 6604', 'СХД', '20-р хороо', 'Толгойтын 5-р хороолол, 3 тоот',   '4 days 12 hours'),
  ('dddddddd-0009-4000-8000-000000000010', 'TM-8005', 'dddddddd-0008-4000-8000-000000000002', 'cancelled',  25000, 'Болормаа Д.',     '9955 4471', 'ХУД', '11-р хороо', 'Зайсангийн гудамж 3, 12 тоот',     '5 days 11 hours'),
  ('dddddddd-0009-4000-8000-000000000011', 'TM-8006', 'dddddddd-0008-4000-8000-000000000006', 'refunded',   68000, 'Мишээл О.',       '9922 0715', 'СБД', '8-р хороо',  'Оюутны гудамж 22, 51 тоот',        '6 days 14 hours')
) as v(id, order_no, user_id, status, subtotal, name, phone, district, khoroo, address, since_start)
on conflict do nothing;

-- ── Захиалгын мөр ──────────────────────────────────────────────────────────
-- Нэр нь ХУУЛБАР (`name_snapshot`): бараа устсан ч захиалгын түүх бүрэн
-- уншигдана. `unit_price` × `qty` -ийн нийлбэр нь дээрх `subtotal` -тай яг
-- тааруулсан — тааруулаагүй бол захиалга өөрөө өөртэйгөө зөрчилдөнө.

insert into order_items (id, order_id, variant_id, name_snapshot, variant_snapshot, unit_price, qty) values
-- TM-9001 · 130,000
('dddddddd-000a-4000-8000-000000000001', 'dddddddd-0009-4000-8000-000000000001', 'dddddddd-0007-4000-8000-000000000002', 'Crop top', 'M · Хар', 65000, 2),
-- TM-9002 · 89,000
('dddddddd-000a-4000-8000-000000000002', 'dddddddd-0009-4000-8000-000000000002', 'dddddddd-0007-4000-8000-000000000005', 'Joggers өмд', 'M · Хар', 89000, 1),
-- TM-9003 · 68,000
('dddddddd-000a-4000-8000-000000000003', 'dddddddd-0009-4000-8000-000000000003', 'dddddddd-0007-4000-8000-000000000003', 'Crop top', 'M · Ягаан', 68000, 1),
-- TM-9004 · 45,000 + 25,000 = 70,000
('dddddddd-000a-4000-8000-000000000004', 'dddddddd-0009-4000-8000-000000000004', 'dddddddd-0007-4000-8000-000000000006', 'Өвдөгний хамгаалалт', 'Стандарт · Хар', 45000, 1),
('dddddddd-000a-4000-8000-000000000005', 'dddddddd-0009-4000-8000-000000000004', 'dddddddd-0007-4000-8000-000000000007', 'Tote цүнх', 'Стандарт · Цагаан', 25000, 1),
-- TM-9005 · 89,000 + 45,000 = 134,000
('dddddddd-000a-4000-8000-000000000006', 'dddddddd-0009-4000-8000-000000000005', 'dddddddd-0007-4000-8000-000000000004', 'Joggers өмд', 'S · Хар', 89000, 1),
('dddddddd-000a-4000-8000-000000000007', 'dddddddd-0009-4000-8000-000000000005', 'dddddddd-0007-4000-8000-000000000006', 'Өвдөгний хамгаалалт', 'Стандарт · Хар', 45000, 1),
-- TM-8001 · 65,000 + 25,000 = 90,000
('dddddddd-000a-4000-8000-000000000008', 'dddddddd-0009-4000-8000-000000000006', 'dddddddd-0007-4000-8000-000000000001', 'Crop top', 'S · Хар', 65000, 1),
('dddddddd-000a-4000-8000-000000000009', 'dddddddd-0009-4000-8000-000000000006', 'dddddddd-0007-4000-8000-000000000007', 'Tote цүнх', 'Стандарт · Цагаан', 25000, 1),
-- TM-8002 · 45,000 × 2 = 90,000
('dddddddd-000a-4000-8000-000000000010', 'dddddddd-0009-4000-8000-000000000007', 'dddddddd-0007-4000-8000-000000000006', 'Өвдөгний хамгаалалт', 'Стандарт · Хар', 45000, 2),
-- TM-8003 · 89,000 + 65,000 = 154,000
('dddddddd-000a-4000-8000-000000000011', 'dddddddd-0009-4000-8000-000000000008', 'dddddddd-0007-4000-8000-000000000005', 'Joggers өмд', 'M · Хар', 89000, 1),
('dddddddd-000a-4000-8000-000000000012', 'dddddddd-0009-4000-8000-000000000008', 'dddddddd-0007-4000-8000-000000000002', 'Crop top', 'M · Хар', 65000, 1),
-- TM-8004 · 89,000
('dddddddd-000a-4000-8000-000000000013', 'dddddddd-0009-4000-8000-000000000009', 'dddddddd-0007-4000-8000-000000000004', 'Joggers өмд', 'S · Хар', 89000, 1),
-- TM-8005 · 25,000 (цуцлагдсан)
('dddddddd-000a-4000-8000-000000000014', 'dddddddd-0009-4000-8000-000000000010', 'dddddddd-0007-4000-8000-000000000007', 'Tote цүнх', 'Стандарт · Цагаан', 25000, 1),
-- TM-8006 · 68,000 (буцаагдсан)
('dddddddd-000a-4000-8000-000000000015', 'dddddddd-0009-4000-8000-000000000011', 'dddddddd-0007-4000-8000-000000000003', 'Crop top', 'M · Ягаан', 68000, 1),
-- TM-9006 · 65,000
('dddddddd-000a-4000-8000-000000000016', 'dddddddd-0009-4000-8000-000000000012', 'dddddddd-0007-4000-8000-000000000002', 'Crop top', 'M · Хар', 65000, 1),
-- TM-9007 · 89,000
('dddddddd-000a-4000-8000-000000000017', 'dddddddd-0009-4000-8000-000000000013', 'dddddddd-0007-4000-8000-000000000005', 'Joggers өмд', 'M · Хар', 89000, 1),
-- TM-9008 · 45,000 + 25,000 = 70,000
('dddddddd-000a-4000-8000-000000000018', 'dddddddd-0009-4000-8000-000000000014', 'dddddddd-0007-4000-8000-000000000006', 'Өвдөгний хамгаалалт', 'Стандарт · Хар', 45000, 1),
('dddddddd-000a-4000-8000-000000000019', 'dddddddd-0009-4000-8000-000000000014', 'dddddddd-0007-4000-8000-000000000007', 'Tote цүнх', 'Стандарт · Цагаан', 25000, 1),
-- TM-9009 · 89,000 × 2 = 178,000
('dddddddd-000a-4000-8000-000000000020', 'dddddddd-0009-4000-8000-000000000015', 'dddddddd-0007-4000-8000-000000000004', 'Joggers өмд', 'S · Хар', 89000, 2),
-- TM-9010 · 25,000
('dddddddd-000a-4000-8000-000000000021', 'dddddddd-0009-4000-8000-000000000016', 'dddddddd-0007-4000-8000-000000000007', 'Tote цүнх', 'Стандарт · Цагаан', 25000, 1)
on conflict do nothing;

-- ── Шалгах ─────────────────────────────────────────────────────────────────
-- Бүлэг бүрд хэдэн мөр орсныг тоолно. Хэвтээ зам 7, хуваарь 9, багш 4,
-- бараа 4 байвал зочны хуудсууд бүрэн дүүрнэ. Сүүлийн зургаан мөр нь
-- админы талыг хэлнэ: 6 хэрэглэгч, 16 захиалга байвал хяналтын самбар
-- дээрх тоо бүр утгатай болно.

select 'locations'        as "хүснэгт", count(*) as "мөр" from locations        where id::text like 'dddddddd-%'
union all select 'instructors',      count(*) from instructors      where id::text like 'dddddddd-%'
union all select 'class_types',      count(*) from class_types      where id::text like 'dddddddd-%'
union all select 'class_sessions',   count(*) from class_sessions   where id::text like 'dddddddd-%'
union all select 'products',         count(*) from products         where id::text like 'dddddddd-%'
union all select 'product_images',   count(*) from product_images   where id::text like 'dddddddd-%'
union all select 'product_variants', count(*) from product_variants where id::text like 'dddddddd-%'
union all select 'faq_items',        count(*) from faq_items        where id::text like 'dddddddd-%'
union all select 'profiles',         count(*) from profiles         where id::text like 'dddddddd-%'
union all select 'bookings',         count(*) from bookings         where id::text like 'dddddddd-%'
union all select 'waitlist',         count(*) from waitlist         where id::text like 'dddddddd-%'
union all select 'orders',           count(*) from orders           where id::text like 'dddddddd-%'
union all select 'order_items',      count(*) from order_items      where id::text like 'dddddddd-%';
