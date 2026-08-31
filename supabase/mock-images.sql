-- ═══════════════════════════════════════════════════════════════════════════
-- Twerk Mongolia — ТҮР ӨГӨГДЛИЙН ЗУРГИЙГ БОДИТ ФАЙЛ РУУ ЧИГЛҮҮЛЭХ
--
-- `mock-home.sql` нь зургийг `/media/studio-*.svg` — хийсвэр орлуулагч руу
-- заасан. Энэ скрипт тэдгээрийг `/media/mock/...` руу шилжүүлнэ.
--
-- Дараа нь `public/media/mock/` хавтсанд ТЭР НЭРТЭЙ файлаа хийхэд хуудсан
-- дээр шууд гарна (§ public/media/mock/README.md).
--
-- Файл байхгүй бол эвдэрсэн зураг ГАРАХГҮЙ: `media.tsx` серверт замыг
-- шалгаж, байхгүй бол монохром орлуулагч зурна. Тиймээс энэ скриптийг
-- зургаа бэлдэхээс ӨМНӨ ажиллуулж болно.
--
-- Зөвхөн `dddddddd-` эхлэлтэй мөрүүдэд хүрнэ — жинхэнэ өгөгдөл хөндөгдөхгүй.
-- `mock-home-cleanup.sql` эдгээрийг мөр хэвээр нь устгана.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── Багш нар — босоо 4:5 ───────────────────────────────────────────────────
update instructors set photo_url = '/media/mock/instructor-1.jpg' where id = 'dddddddd-0002-4000-8000-000000000001';
update instructors set photo_url = '/media/mock/instructor-2.jpg' where id = 'dddddddd-0002-4000-8000-000000000002';
update instructors set photo_url = '/media/mock/instructor-3.jpg' where id = 'dddddddd-0002-4000-8000-000000000003';
update instructors set photo_url = '/media/mock/instructor-4.jpg' where id = 'dddddddd-0002-4000-8000-000000000004';

-- ── Хичээлийн төрөл — босоо 3:4 ────────────────────────────────────────────
update class_types set cover_url = '/media/mock/class-twerk-basics.jpg' where id = 'dddddddd-0003-4000-8000-000000000001';
update class_types set cover_url = '/media/mock/class-choreography.jpg' where id = 'dddddddd-0003-4000-8000-000000000002';
update class_types set cover_url = '/media/mock/class-advanced.jpg'     where id = 'dddddddd-0003-4000-8000-000000000003';
update class_types set cover_url = '/media/mock/class-stretch.jpg'      where id = 'dddddddd-0003-4000-8000-000000000004';
update class_types set cover_url = '/media/mock/class-heels.jpg'        where id = 'dddddddd-0003-4000-8000-000000000005';
update class_types set cover_url = '/media/mock/class-dancehall.jpg'    where id = 'dddddddd-0003-4000-8000-000000000006';
update class_types set cover_url = '/media/mock/class-technique.jpg'    where id = 'dddddddd-0003-4000-8000-000000000007';

-- ── Дэлгүүр — хэвтээ 5:4 ───────────────────────────────────────────────────
-- Барааны зураг тусдаа хүснэгтэд. `mock-home.sql` дөрөв дэх барааг зураггүй
-- үлдээсэн тул түүнд мөр НЭМНЭ, бусдынхыг нь шинэчилнэ.
update product_images set url = '/media/mock/product-crop-top.jpg'  where id = 'dddddddd-0006-4000-8000-000000000001';
update product_images set url = '/media/mock/product-joggers.jpg'   where id = 'dddddddd-0006-4000-8000-000000000002';
update product_images set url = '/media/mock/product-knee-pads.jpg' where id = 'dddddddd-0006-4000-8000-000000000003';

insert into product_images (id, product_id, url, alt, sort_order) values
('dddddddd-0006-4000-8000-000000000004', 'dddddddd-0005-4000-8000-000000000004',
 '/media/mock/product-tote.jpg', 'Tote цүнх', 1)
on conflict do nothing;

commit;

-- ── Шалгах ─────────────────────────────────────────────────────────────────
-- 15 мөр буцна. `зам` багана бүхэлдээ `/media/mock/` -ээр эхэлж байх ёстой.

select 'багш' as "төрөл", name as "нэр", photo_url as "зам"
  from instructors where id::text like 'dddddddd-%'
union all
select 'хичээл', name_mn, cover_url
  from class_types where id::text like 'dddddddd-%'
union all
select 'бараа', alt, url
  from product_images where id::text like 'dddddddd-%'
order by 1, 2;
