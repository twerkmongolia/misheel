-- ═══════════════════════════════════════════════════════════════════════════
-- Twerk Mongolia — ТҮР ӨГӨГДЛИЙГ УСТГАХ
--
-- `mock-data.sql` -ээр оруулсан БҮХ мөрийг устгана. Өөр юу ч хөндөхгүй:
-- бүх нөхцөл нь `id::text like 'dddddddd-%'` — түр өгөгдөл ганцаараа энэ
-- хэлбэрийн id -тай.
--
-- Дарааллыг ГАДААД ТҮЛХҮҮР тогтоож байгаа тул мөрүүдийг сольж болохгүй:
--
--   order_items    → orders         (cascade — гэхдээ ил бичив)
--   orders         → profiles       (on delete restrict — захиалга эхлээд
--                                    арилаагүй бол хэрэглэгч устахгүй)
--   class_sessions → class_types    (on delete restrict — эхлээд цаг нь арилна)
--   product_*      → products       (cascade — юу устахыг таамаглахаас илүү
--                                    харсан нь дээр)
--   bookings       → class_sessions (cascade — доорх тайлбарыг уншина уу)
--   profiles       → auth.users     (cascade — бүртгэл устахад профайл дагана)
--
-- ⚠️ Хэрэв та түр хичээлүүд рүү ТУРШИЖ бүртгүүлсэн бол тэр бүртгэлүүд
--    хамт устна (`bookings.session_id ... on delete cascade`). Түр өгөгдөлд
--    хийсэн туршилтын бүртгэл тул яг ийм байх ёстой.
--
-- ⚠️ Түр ХЭРЭГЛЭГЧИД нь `auth.users` дотор жинхэнэ бүртгэл болж үүссэн.
--    Хамгийн сүүлд тэднийг устгана — жинхэнэ хэрэглэгчдийн id нь
--    `dddddddd-` -ээр эхэлдэггүй тул хуруу хүрэхгүй.
--
-- Ажиллуулах: Supabase Dashboard → SQL Editor → буулгаад Run.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- 1 · Дэлгүүрийн захиалга. `orders` нь `profiles` руу `restrict` -ээр
--     холбогдсон тул хэрэглэгчээс ӨМНӨ арилах ёстой.
delete from order_items where id::text like 'dddddddd-%';
delete from orders      where id::text like 'dddddddd-%';

-- 2 · Хичээлийн бүртгэл ба хүлээлгийн жагсаалт. Хуваарь устахад cascade -аар
--     дагах ч ил бичсэн нь тоологдож буй мөрийг харуулна.
delete from waitlist where id::text like 'dddddddd-%';
delete from bookings where id::text like 'dddddddd-%';

-- 3 · Хуваарь. class_types руу `restrict` -ээр холбогдсон тул лавлахаас ӨМНӨ.
delete from class_sessions where id::text like 'dddddddd-%';

-- 4 · Дэлгүүр. Зураг, сонголт нь products -оос cascade -аар арилах ч
--     ил бичсэн нь тоологдож буй мөрийг харуулна.
delete from product_variants where id::text like 'dddddddd-%';
delete from product_images   where id::text like 'dddddddd-%';
delete from products         where id::text like 'dddddddd-%';

-- 5 · Лавлах хүснэгтүүд. Хуваарь арилсан тул одоо чөлөөтэй.
delete from class_types  where id::text like 'dddddddd-%';
delete from instructors  where id::text like 'dddddddd-%';
delete from locations    where id::text like 'dddddddd-%';
delete from faq_items    where id::text like 'dddddddd-%';

-- 6 · Түр хэрэглэгчид. `profiles` нь `auth.users` -ээс cascade -аар дагаж
--     устах тул нэг мөр хангалттай.
delete from auth.users where id::text like 'dddddddd-%';

commit;

-- ── Шалгах ─────────────────────────────────────────────────────────────────
-- Арван гурван мөр буцаж, «мөр» багана бүхэлдээ 0 байх ёстой. Аль нэг нь
-- 0-ээс их бол тэр хүснэгтэд гараар нэмсэн, id нь `dddddddd-` -ээр эхэлдэг
-- мөр үлдсэн гэсэн үг.

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
