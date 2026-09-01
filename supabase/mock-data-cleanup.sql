-- ═══════════════════════════════════════════════════════════════════════════
-- Twerk Mongolia — ТҮР ӨГӨГДЛИЙГ УСТГАХ
--
-- `mock-data.sql` -ээр оруулсан БҮХ мөрийг устгана. Өөр юу ч хөндөхгүй:
-- бүх нөхцөл нь `id::text like 'dddddddd-%'` — түр өгөгдөл ганцаараа энэ
-- хэлбэрийн id -тай.
--
-- Дарааллыг ГАДААД ТҮЛХҮҮР тогтоож байгаа тул мөрүүдийг сольж болохгүй:
--
--   class_sessions → class_types  (on delete restrict — эхлээд цаг нь арилна)
--   product_*      → products     (cascade — гэхдээ ил бичив: юу устахыг
--                                  таамаглахаас илүү харсан нь дээр)
--   bookings       → class_sessions (cascade — доорх тайлбарыг уншина уу)
--
-- ⚠️ Хэрэв та түр хичээлүүд рүү ТУРШИЖ бүртгүүлсэн бол тэр бүртгэлүүд
--    хамт устна (`bookings.session_id ... on delete cascade`). Түр өгөгдөлд
--    хийсэн туршилтын бүртгэл тул яг ийм байх ёстой.
--
-- Ажиллуулах: Supabase Dashboard → SQL Editor → буулгаад Run.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- 1 · Хуваарь. class_types руу `restrict` -ээр холбогдсон тул ХАМГИЙН ТҮРҮҮНД.
--     Эдгээрийн bookings болон waitlist нь cascade -аар дагаж арилна.
delete from class_sessions where id::text like 'dddddddd-%';

-- 2 · Дэлгүүр. Зураг, сонголт нь products -оос cascade -аар арилах ч
--     ил бичсэн нь тоологдож буй мөрийг харуулна.
delete from product_variants where id::text like 'dddddddd-%';
delete from product_images   where id::text like 'dddddddd-%';
delete from products         where id::text like 'dddddddd-%';

-- 3 · Лавлах хүснэгтүүд. Хуваарь арилсан тул одоо чөлөөтэй.
delete from class_types  where id::text like 'dddddddd-%';
delete from instructors  where id::text like 'dddddddd-%';
delete from locations    where id::text like 'dddddddd-%';

commit;

-- ── Шалгах ─────────────────────────────────────────────────────────────────
-- Долоон мөр буцаж, «мөр» багана бүхэлдээ 0 байх ёстой. Аль нэг нь 0-ээс
-- их бол тэр хүснэгтэд гараар нэмсэн, id нь `dddddddd-` -ээр эхэлдэг мөр
-- үлдсэн гэсэн үг.

select 'locations'        as "хүснэгт", count(*) as "мөр" from locations        where id::text like 'dddddddd-%'
union all select 'instructors',      count(*) from instructors      where id::text like 'dddddddd-%'
union all select 'class_types',      count(*) from class_types      where id::text like 'dddddddd-%'
union all select 'class_sessions',   count(*) from class_sessions   where id::text like 'dddddddd-%'
union all select 'products',         count(*) from products         where id::text like 'dddddddd-%'
union all select 'product_images',   count(*) from product_images   where id::text like 'dddddddd-%'
union all select 'product_variants', count(*) from product_variants where id::text like 'dddddddd-%';
