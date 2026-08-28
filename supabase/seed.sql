-- Twerk Mongolia — жишээ өгөгдөл
-- Migration-уудын дараа ажиллуулна. Дахин ажиллуулахад аюулгүй (on conflict).

-- ── Сайтын контент ─────────────────────────────────────────────────────────
insert into site_content (key, value_mn, value_en) values
('hero', jsonb_build_object(
    'title', 'Twerk Mongolia',
    'subtitle', 'Бие сэтгэлээ чөлөөлөх бүжгийн студи',
    'body', 'Анхан шатнаас ахисан түвшин хүртэл — долоо хоног бүр Улаанбаатарт.',
    'cta', 'Хуваарь харах'),
  jsonb_build_object(
    'title', 'Twerk Mongolia',
    'subtitle', 'A dance studio for setting your body free',
    'body', 'From absolute beginner to advanced — every week in Ulaanbaatar.',
    'cta', 'See the schedule')),
('about', jsonb_build_object(
    'title', 'Бидний тухай',
    'body', 'Twerk Mongolia нь 2019 онд Улаанбаатарт үүсгэн байгуулагдсан. Бид бүжгийг гоо сайхны шалгуур биш, өөрийгөө илэрхийлэх хэрэгсэл гэж үздэг. Манай заалан бол шүүмжлэлгүй, дэмжлэгтэй орон зай.',
    'stat_students', '1200', 'stat_years', '7', 'stat_classes', '18'),
  jsonb_build_object(
    'title', 'About us',
    'body', 'Twerk Mongolia was founded in Ulaanbaatar in 2019. We treat dance as a tool for self-expression, not a beauty standard. Our studio is a judgement-free, supportive space.',
    'stat_students', '1200', 'stat_years', '7', 'stat_classes', '18')),
-- Утас, Instagram, Facebook нь бодит. И-мэйл, хаягийг /admin/content дээрээс бөглөнө.
('contact', jsonb_build_object(
    'phone', '+976 9919 0857', 'email', '', 'address', '',
    'instagram', 'twerkmongolia',
    'facebook', 'https://www.facebook.com/share/1EVmEQMU4S/'),
  jsonb_build_object(
    'phone', '+976 9919 0857', 'email', '', 'address', '',
    'instagram', 'twerkmongolia',
    'facebook', 'https://www.facebook.com/share/1EVmEQMU4S/')),
('booking', jsonb_build_object('cancel_cutoff_hours', 6),
            jsonb_build_object('cancel_cutoff_hours', 6)),
('shop',    jsonb_build_object('shipping_fee', 5000, 'bank', 'Хаан банк · 5000 1234 5678 · Твөрк Монголиа ХХК'),
            jsonb_build_object('shipping_fee', 5000, 'bank', 'Khan Bank · 5000 1234 5678 · Twerk Mongolia LLC')),
-- Нүүр хуудасны бичлэгүүд. id талбарт бүтэн YouTube холбоос буулгасан ч болно.
('videos',  jsonb_build_object('id_1', 'u261YyMWm0g', 'title_1', '', 'id_2', 'ju-HSfPFFxE', 'title_2', '', 'id_3', 'U7GUiQBVIs0', 'title_3', ''),
            jsonb_build_object('id_1', 'u261YyMWm0g', 'title_1', '', 'id_2', 'ju-HSfPFFxE', 'title_2', '', 'id_3', 'U7GUiQBVIs0', 'title_3', ''))
on conflict (key) do nothing;

-- ── Байршил ────────────────────────────────────────────────────────────────
insert into locations (id, name, address_mn, address_en, default_capacity) values
('11111111-1111-4111-8111-111111111111', 'Үндсэн заал',
 'СБД, 1-р хороо, Их сургуулийн гудамж 12, 3 давхар',
 'Sukhbaatar district, Ikh Surguuliin gudamj 12, 3rd floor', 16),
('11111111-1111-4111-8111-222222222222', 'Жижиг заал',
 'СБД, 1-р хороо, Их сургуулийн гудамж 12, 2 давхар',
 'Sukhbaatar district, Ikh Surguuliin gudamj 12, 2nd floor', 8)
on conflict (id) do nothing;

-- ── Багш нар ───────────────────────────────────────────────────────────────
insert into instructors (id, slug, name, bio_mn, bio_en, photo_url, instagram, sort_order) values
('22222222-2222-4222-8222-111111111111', 'saraa', 'Сараа',
 'Twerk Mongolia-гийн үүсгэн байгуулагч. 8 жилийн туршлагатай, анхан шатны хичээлүүдийг хөтөлдөг.',
 'Founder of Twerk Mongolia. Eight years of experience, leads the beginner classes.',
 '/media/studio-1.svg', 'saraa.dance', 1),
('22222222-2222-4222-8222-222222222222', 'nomin', 'Номин',
 'Choreography болон ахисан түвшний хичээл заадаг. Олон улсын тэмцээний шагналт.',
 'Teaches choreography and advanced classes. International competition medalist.',
 '/media/studio-2.svg', 'nomin.moves', 2),
('22222222-2222-4222-8222-333333333333', 'tsetseg', 'Цэцэг',
 'Stretching болон биеийн бэлтгэлийн хичээл. Дасгал зүтгэлтний мэргэжилтэн.',
 'Stretching and conditioning classes. Certified fitness trainer.',
 '/media/studio-3.svg', 'tsetseg.flex', 3)
on conflict (id) do nothing;

-- ── Хичээлийн төрөл ────────────────────────────────────────────────────────
insert into class_types (id, slug, name_mn, name_en, desc_mn, desc_en, level, duration_min, cover_url, base_price, sort_order) values
('33333333-3333-4333-8333-111111111111', 'twerk-basics', 'Twerk үндэс', 'Twerk Basics',
 'Огт туршлагагүй хүнд зориулсан. Үндсэн хөдөлгөөн, хэмнэл, биеийн байрлалыг эхнээс нь заана.',
 'For complete beginners. Core movements, rhythm and body positioning from scratch.',
 'beginner', 60, '/media/studio-4.svg', 35000, 1),
('33333333-3333-4333-8333-222222222222', 'choreography', 'Choreography', 'Choreography',
 'Дуу бүрд бүтэн бүжиг сурна. Үндсэн хөдөлгөөнүүдийг мэддэг хүнд тохиромжтой.',
 'Learn a full routine to a track. Suited to those who know the basics.',
 'intermediate', 75, '/media/studio-5.svg', 40000, 2),
('33333333-3333-4333-8333-333333333333', 'advanced-flow', 'Ахисан түвшин', 'Advanced Flow',
 'Хурд, техник, тайз дээрх илэрхийлэл. Дор хаяж 6 сар бүжиглэсэн байх шаардлагатай.',
 'Speed, technique and stage presence. Requires at least six months of practice.',
 'advanced', 90, '/media/studio-6.svg', 45000, 3),
('33333333-3333-4333-8333-444444444444', 'stretch', 'Stretch & Conditioning', 'Stretch & Conditioning',
 'Уян хатан байдал, тэсвэр. Бүжгийн хичээлийг нөхөх дасгалууд.',
 'Flexibility and stamina. A complement to the dance classes.',
 'beginner', 60, '/media/studio-1.svg', 30000, 4)
on conflict (id) do nothing;

-- ── Хуваарь: ирэх 3 долоо хоног ────────────────────────────────────────────
-- Мя/Пү/Бя гэсэн 3 өдөрт, өдөрт 2-3 хичээл.
insert into class_sessions (class_type_id, instructor_id, location_id, starts_at, ends_at, capacity, price)
select
  s.class_type_id,
  s.instructor_id,
  s.location_id,
  slot_start,
  slot_start + make_interval(mins => s.duration),
  s.capacity,
  s.price
from (
  values
    ('33333333-3333-4333-8333-111111111111'::uuid, '22222222-2222-4222-8222-111111111111'::uuid,
     '11111111-1111-4111-8111-111111111111'::uuid, 2, 19, 60, 16, 35000),
    ('33333333-3333-4333-8333-222222222222'::uuid, '22222222-2222-4222-8222-222222222222'::uuid,
     '11111111-1111-4111-8111-111111111111'::uuid, 2, 20, 75, 14, 40000),
    ('33333333-3333-4333-8333-444444444444'::uuid, '22222222-2222-4222-8222-333333333333'::uuid,
     '11111111-1111-4111-8111-222222222222'::uuid, 4, 18, 60, 8, 30000),
    ('33333333-3333-4333-8333-111111111111'::uuid, '22222222-2222-4222-8222-111111111111'::uuid,
     '11111111-1111-4111-8111-111111111111'::uuid, 4, 19, 60, 16, 35000),
    ('33333333-3333-4333-8333-333333333333'::uuid, '22222222-2222-4222-8222-222222222222'::uuid,
     '11111111-1111-4111-8111-111111111111'::uuid, 4, 20, 90, 12, 45000),
    ('33333333-3333-4333-8333-222222222222'::uuid, '22222222-2222-4222-8222-222222222222'::uuid,
     '11111111-1111-4111-8111-111111111111'::uuid, 6, 12, 75, 14, 40000),
    ('33333333-3333-4333-8333-111111111111'::uuid, '22222222-2222-4222-8222-111111111111'::uuid,
     '11111111-1111-4111-8111-111111111111'::uuid, 6, 14, 60, 16, 35000)
  ) as s (class_type_id, instructor_id, location_id, dow, hour, duration, capacity, price)
cross join lateral (
  select (
    date_trunc('week', (now() at time zone 'Asia/Ulaanbaatar'))
      + make_interval(days => s.dow - 1, weeks => w.n, hours => s.hour)
  ) at time zone 'Asia/Ulaanbaatar' as slot_start
  from generate_series(0, 2) as w (n)
) slots
where slot_start > now()
  and not exists (
    select 1 from class_sessions cs
    where cs.class_type_id = s.class_type_id and cs.starts_at = slot_start
  );

-- ── Дэлгүүр ────────────────────────────────────────────────────────────────
insert into products (id, slug, name_mn, name_en, desc_mn, desc_en, category, base_price, sort_order) values
('44444444-4444-4444-8444-111111111111', 'crop-top', 'Crop top', 'Crop top',
 'Бүжгийн дасгалд зориулсан амьсгалдаг даавуутай crop top.',
 'Breathable crop top made for dance practice.', 'hувцас', 65000, 1),
('44444444-4444-4444-8444-222222222222', 'joggers', 'Joggers өмд', 'Joggers',
 'Уян хатан, хөдөлгөөнд саад болохгүй сунадаг өмд.',
 'Stretchy joggers that never get in the way of a move.', 'hувцас', 89000, 2),
('44444444-4444-4444-8444-333333333333', 'knee-pads', 'Өвдөгний хамгаалалт', 'Knee pads',
 'Шалан дээрх хөдөлгөөнд заавал хэрэгтэй зузаан дэвсгэртэй.',
 'Thick padding — essential for floor work.', 'хэрэгсэл', 45000, 3),
('44444444-4444-4444-8444-444444444444', 'tote-bag', 'Tote цүнх', 'Tote bag',
 'Twerk Mongolia лого бүхий даавуун цүнх.',
 'Canvas tote with the Twerk Mongolia logo.', 'merch', 25000, 4)
on conflict (id) do nothing;

insert into product_images (product_id, url, alt, sort_order) values
('44444444-4444-4444-8444-111111111111', '/media/studio-2.svg', 'Crop top', 1),
('44444444-4444-4444-8444-222222222222', '/media/studio-3.svg', 'Joggers', 1),
('44444444-4444-4444-8444-333333333333', '/media/studio-4.svg', 'Өвдөгний хамгаалалт', 1),
('44444444-4444-4444-8444-444444444444', '/media/studio-5.svg', 'Tote цүнх', 1)
on conflict do nothing;

insert into product_variants (product_id, sku, size, color, price, stock_qty) values
('44444444-4444-4444-8444-111111111111', 'CROP-S-BLK', 'S', 'Хар', 65000, 8),
('44444444-4444-4444-8444-111111111111', 'CROP-M-BLK', 'M', 'Хар', 65000, 12),
('44444444-4444-4444-8444-111111111111', 'CROP-L-BLK', 'L', 'Хар', 65000, 5),
('44444444-4444-4444-8444-111111111111', 'CROP-M-PNK', 'M', 'Ягаан', 68000, 3),
('44444444-4444-4444-8444-222222222222', 'JOG-S-BLK',  'S', 'Хар', 89000, 6),
('44444444-4444-4444-8444-222222222222', 'JOG-M-BLK',  'M', 'Хар', 89000, 9),
('44444444-4444-4444-8444-222222222222', 'JOG-L-BLK',  'L', 'Хар', 89000, 2),
('44444444-4444-4444-8444-333333333333', 'KNEE-ONE',   'Стандарт', 'Хар', 45000, 20),
('44444444-4444-4444-8444-444444444444', 'TOTE-ONE',   'Стандарт', 'Цагаан', 25000, 30)
on conflict (sku) do nothing;

-- ── Галерей ба FAQ ─────────────────────────────────────────────────────────
insert into gallery_items (url, alt_mn, alt_en, sort_order) values
('/media/studio-1.svg', 'Заалан дээрх хичээл', 'Class in the studio', 1),
('/media/studio-2.svg', 'Choreography хичээл', 'Choreography class', 2),
('/media/studio-3.svg', 'Stretch хичээл', 'Stretch class', 3),
('/media/studio-4.svg', 'Тоглолтын бэлтгэл', 'Show rehearsal', 4),
('/media/studio-5.svg', 'Сурагчид', 'Students', 5),
('/media/studio-6.svg', 'Үндсэн заал', 'Main studio', 6)
on conflict do nothing;

insert into faq_items (question_mn, question_en, answer_mn, answer_en, sort_order) values
('Огт бүжиглэж байгаагүй бол болох уу?',
 'Can I come with no dance experience?',
 'Мэдээж. «Twerk үндэс» хичээл яг танд зориулагдсан. Сурагчдын дийлэнх нь тэндээс эхэлдэг.',
 'Absolutely. The "Twerk Basics" class is made for exactly that. Most of our students start there.', 1),
('Юу өмсөж очих вэ?',
 'What should I wear?',
 'Хөдөлгөөнд саад болохгүй сунадаг өмд, тав тухтай пүүз. Өвдөгний хамгаалалт байвал сайн.',
 'Stretchy trousers you can move in and comfortable trainers. Knee pads help.', 2),
('Хичээлээ цуцалж болох уу?',
 'Can I cancel a booking?',
 'Хичээл эхлэхээс 6 цагийн өмнө өөрөө цуцалж болно. Түүнээс хойш бол бидэн рүү залгана уу.',
 'You can cancel yourself up to 6 hours before the class. After that, please call us.', 3),
('Төлбөрөө яаж хийх вэ?',
 'How do I pay?',
 'Одоогоор банкны шилжүүлгээр. Захиалга үүсгэсний дараа дансны мэдээлэл харагдана.',
 'By bank transfer for now. Account details appear once you place an order.', 4)
on conflict do nothing;
