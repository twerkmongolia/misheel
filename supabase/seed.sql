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
-- ЭНД БАЙХГҮЙ. Багш нар бол жишээ өгөгдөл БИШ — бодит хүмүүс, бодит
-- танилцуулгатай. Тэд `migrations/20260914000001_instructor_profile.sql`
-- дотор, тогтмол `22222222-…` дугаартайгаар үүснэ. Доорх хуваарь, курс
-- яг тэр дугаараар багшийг заана.

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

-- Мөр таслалт нь ЗОРИУДЫНХ: хуудас хариултыг `whitespace-pre-line`
-- -ээр харуулдаг тул жагсаалт бичсэн хэлбэрээрээ гарна (§ faq/page.tsx).
insert into faq_items (id, question_mn, question_en, answer_mn, answer_en, sort_order, is_active)
values
('faaaaaaa-0001-4000-8000-000000000001',
 'Анх удаа Twerk сурч байгаа бол болох уу?',
 'Can I join if this is my first time doing Twerk?',
 'Тийм. Анхан шатны ангид өмнө нь бүжиглэж байгаагүй хүн ч хамрагдах боломжтой. Суурь хөдөлгөөнөөс эхлээд алхам бүрийг ойлгомжтой, дараалалтайгаар сурна.',
 'Yes. The beginner class is open to people who have never danced before. You start from the basic movements and learn every step in a clear order.',
 1, true),

('faaaaaaa-0001-4000-8000-000000000002',
 'Хичээлд яаж хувцаслаж ирэх вэ?',
 'What should I wear to class?',
 'Twerk анги

• Өгзөгний хөдөлгөөн чөлөөтэй харагдах шорт, сул шорт эсвэл сул өмд
• Биед эвтэйхэн цамц, топ эсвэл өөрт тохиромжтой хувцас
• Өвдгөвч
• Зааланд өмсөх цэвэр, солих пүүз (ул нь зураас гаргадаггүй байх)

Heels Twerk анги

• Өгзөгний хөдөлгөөн чөлөөтэй харагдах шорт, сул шорт эсвэл сул өмд
• Биед эвтэйхэн цамц, топ эсвэл өөрт тохиромжтой хувцас
• Өвдгөвч
• Өөрт тохирох өндөртэй, зориулалтын өсгийт (ул нь зураас гаргадаггүй, шовх үзүүргүй байх)

Нэмэлт торкио зэрэг өөрт тохирсон гоёл, аксессуар хэрэглэж болно.

Хамгийн гол нь өөртөө тухтай, өөрийгөө итгэлтэй, эмэгтэйлэг мэдрүүлэх хувцсаа сонгоорой. 🤭',
 'Twerk class

• Shorts, loose shorts or loose trousers that let the hip movement show
• A T-shirt, top or anything else you feel good moving in
• Knee pads
• Clean indoor trainers you change into (non-marking soles)

Heels Twerk class

• Shorts, loose shorts or loose trousers that let the hip movement show
• A T-shirt, top or anything else you feel good moving in
• Knee pads
• Dance heels at a height that suits you (non-marking soles, no stiletto tips)

You are welcome to add accessories that suit you, a torquio for example.

Above all, choose the outfit that makes you feel comfortable, confident and feminine. 🤭',
 2, true),

('faaaaaaa-0001-4000-8000-000000000003',
 'Twerk болон Heels Twerk хоёрын ялгаа юу вэ?',
 'What is the difference between Twerk and Heels Twerk?',
 'Twerk

Үндсэн twerk хөдөлгөөн, техник, хэмнэл болон choreography-д төвлөрнө. Илүү эрч хүчтэй, хөдөлгөөн ихтэй хичээл.

Heels Twerk

Twerk-ийн суурь хөдөлгөөнөөс гадна өсгийт дээр зөв зогсох, алхах, биеийн шугам, эмэгтэйлэг хөдөлгөөн болон choreography-д төвлөрнө.

Товчхондоо:

Twerk — Техник + Хэмнэл + Эрч хүч
Heels Twerk — Twerk + Heels + Feminine movement',
 'Twerk

Focuses on the core twerk movements, technique, rhythm and choreography. The higher-energy class, with more movement.

Heels Twerk

On top of the twerk basics it focuses on standing and walking properly in heels, body lines, feminine movement and choreography.

In short:

Twerk — technique + rhythm + energy
Heels Twerk — twerk + heels + feminine movement',
 3, true),

('faaaaaaa-0001-4000-8000-000000000004',
 'Хичээл хэдэн минут үргэлжилдэг вэ?',
 'How long is a class?',
 'Нэг хичээл 90 минут үргэлжилнэ.',
 'A class runs for 90 minutes.',
 4, true),

('faaaaaaa-0001-4000-8000-000000000005',
 'Хичээлийн дараа дасгал, сунгалт хийх үү?',
 'Is there conditioning and stretching after class?',
 'Тийм. Хичээл бүрийн дараа булчинг ажиллуулах нэмэлт дасгал болон сунгалтыг тогтмол хийдэг.

Үүнд:

• Өгзөг, гуяны дасгал
• Хэвлий болон core-ийн дасгал
• Резинтэй дасгал
• Сунгалт

зэрэг багтана.',
 'Yes. Every class ends with extra conditioning work and stretching.

That includes:

• Glute and thigh work
• Abs and core work
• Resistance band work
• Stretching',
 5, true),

('faaaaaaa-0001-4000-8000-000000000006',
 'Нэг ангид хэдэн хүн байдаг вэ?',
 'How many people are in one class?',
 'Анги болон хөтөлбөрөөсөө хамаарч 10–20 суралцагчтай байна.',
 'Between 10 and 20 students, depending on the class and the programme.',
 6, true),

('faaaaaaa-0001-4000-8000-000000000007',
 'Twerk хийснээр өгзөг томрох уу?',
 'Will twerking make my glutes bigger?',
 'Twerk-ийн хөдөлгөөнөөр өгзөг, ташаа, гуя болон core хэсгийн булчингууд идэвхтэй ажилладаг. Тогтмол хичээллэснээр булчин чангарч, өгзөгний хэлбэр илүү тодорч, өргөгдсөн харагдана.

Үр дүн нь хүн бүрийн биеийн онцлог, хооллолт болон хичээллэх давтамжаас хамаарч өөр байна.

Зарим суралцагчид анхны хэдэн долоо хоногоосоо хөдөлгөөний болон биеийн өөрчлөлтөө мэдэрч эхэлдэг.',
 'Twerk movement works the glutes, hips, thighs and core. With regular practice the muscles tighten and the shape of the glutes becomes more defined and lifted.

Results differ from person to person, depending on your body, your diet and how often you train.

Some students start to feel a change in their movement and their body within the first few weeks.',
 7, true),

('faaaaaaa-0001-4000-8000-000000000008',
 'Twerk хичээллээд жин хасах уу?',
 'Will twerk classes help me lose weight?',
 'Twerk нь идэвхтэй хөдөлгөөн шаарддаг бүжгийн төрөл тул тогтмол хичээллэх нь энерги зарцуулалт болон биеийн идэвхийг нэмэгдүүлэхэд хувь нэмэр оруулна.

Жин болон биеийн хэмжээнд гарах өөрчлөлт нь хүн бүрийн биеийн онцлог, хооллолт, өдөр тутмын хөдөлгөөн болон хичээллэх давтамжаас хамаарч өөр байна.

Twerk-ийн гол зорилго нь зөвхөн турах биш, биеэ чангалах, галбиржуулах, хөдөлгөөний хяналт болон өөртөө итгэх итгэлийг хөгжүүлэх юм.

Зарим тохиолдолд жин төдийлөн өөрчлөгдөхгүй ч биеийн хэлбэр, булчингийн чангарсан байдалд өөрчлөлт мэдрэгдэж болно.',
 'Twerk is an active dance form, so training regularly adds to the energy you burn and to how much you move overall.

Changes in weight and body measurements differ from person to person, depending on your body, your diet, your daily activity and how often you train.

The point of twerk is not only to get slimmer: it is to tone and shape the body, to build movement control and to grow your confidence.

Sometimes the number on the scale barely moves while the shape of the body and the tone of the muscles clearly change.',
 8, true),

('faaaaaaa-0001-4000-8000-000000000009',
 'Ангид бүртгүүлсний дараа юу болох вэ?',
 'What happens after I sign up for a class?',
 'Бүртгэл болон төлбөрөө баталгаажуулсны дараа таны бүртгэлтэй холбоо барих сувгаар хичээлийн дэлгэрэнгүй мэдээллийг хүргэнэ.

Мөн тухайн ангийн Instagram group-д нэмэгдэж, хичээлийн хуваарь, зарлал болон бусад мэдээллийг хүлээн авна.',
 'Once your registration and payment are confirmed, we send the class details to the contact channel you registered with.

You are also added to the Instagram group for that class, where the schedule, announcements and everything else are posted.',
 9, true)
on conflict do nothing;

-- ── Анги, курс ─────────────────────────────────────────────────────────────
-- Танхимын нэг элсэлт. `starts_on` нь ХАРЬЦАНГУЙ огноо:
-- тогтмол огноо бичвэл үрийн өгөгдөл хэдэн сарын дараа «аль хэдийн эхэлсэн»
-- болж, элсэлтийн урсгалыг туршиж үзэх боломжгүй болно.
insert into courses (
  id, slug, mode, name_mn, name_en, summary_mn, summary_en, desc_mn, desc_en,
  level, instructor_id, location_id, cover_url, price, lesson_count,
  starts_on, ends_on, schedule_mn, schedule_en, capacity, sort_order
) values
('55555555-5555-4555-8555-111111111111', 'twerk-4-week', 'studio',
 'Шинэчлэгчдийн 4 долоо хоног', 'Beginner 4-Week Course',
 'Огт бүжиглэж үзээгүй хүнд зориулсан бүтэн хөтөлбөр — эхний алхмаас бүтэн бүжиг хүртэл.',
 'A full programme for people who have never danced — from the first step to a whole routine.',
 'Дөрвөн долоо хоног, найман хичээл. Эхний долоо хоногт биеэ хэрхэн авч явах, хэмнэлээ олох; хоёрдугаарт үндсэн хөдөлгөөнүүд; гуравдугаарт тэдгээрийг холбох; дөрөвдүгээрт бүтэн бүжиг сурч, хүсвэл бичлэг хийнэ.

Хувцас, гутлын тухай: хөнгөн, суналттай өмд, хөл нүцгэн эсвэл гутлаа авчирч болно. Бусад бүхнийг заалнаас олно.',
 'Four weeks, eight classes. Week one is about carrying yourself and finding the rhythm; week two the core movements; week three linking them; week four a full routine, with an optional filmed take.

On clothes: light stretchy trousers, barefoot or bring your trainers. Everything else is at the studio.',
 'beginner',
 '22222222-2222-4222-8222-111111111111',
 '11111111-1111-4111-8111-111111111111',
 '/media/studio-4.svg', 240000, 8,
 (current_date + 14), (current_date + 42),
 'Мягмар, Пүрэв · 19:00–20:15', 'Tuesdays and Thursdays · 19:00–20:15',
 12, 1)
on conflict (id) do nothing;

-- ── Онлайн анги ────────────────────────────────────────────────────────────
-- ЭНД БАЙХГҮЙ. Онлайн анги нь Telegram дээр амьд ажиллаж байгаа ХОЁР бүлэг
-- бөгөөд тэдгээр нь `migrations/20260914000002_online_courses.sql` дотор
-- үүснэ — жинхэнэ урилгын холбоостойгоор. Энд хуурамч холбоостой жишээ
-- анги тавих нь төлбөр төлсөн хүнийг хоосон хуудас руу хөтөлнө.
