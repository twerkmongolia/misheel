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
 'Мэдээж. «Twerk үндэс» хичээл яг эхлэгчдэд зориулагдсан бөгөөд сурагчдын дийлэнх нь тэндээс эхэлдэг. Багш хөдөлгөөн бүрийг жижиг хэсэг болгон задалж, удаан хэмнэлээр давтуулдаг тул урьдчилсан бэлтгэл огт шаардлагагүй.',
 'Absolutely. The Twerk Basics class is built for people starting from zero, and most of our students begin there. Every movement is broken into small pieces and repeated slowly, so no previous experience is needed.', 1),
('Хичээлд хэрхэн бүртгүүлэх вэ?',
 'How do I book a class?',
 'Хуваарь хуудаснаас өөрт тохирох өдөр, цагаа сонгоод «Бүртгүүлэх» товчийг дарахад суудал тань шууд баталгаажна. Бүртгүүлэхийн өмнө нэвтэрсэн байх шаардлагатай — ингэснээр бүх бүртгэлээ «Миний булан» дотроос хараад, шаардлагатай үед цуцлах боломжтой болно.',
 'Pick a day and time on the Schedule page and press Book — your seat is confirmed straight away. You need to be logged in first, which also lets you see every booking under My account and cancel it if your plans change.', 2),
('Аль түвшнээс эхлэх вэ?',
 'Which level should I start at?',
 'Гурван түвшин бий: анхан, дунд, ахисан. Өмнө нь бүжиглэж байгаагүй бол анхан шатнаас эхэл; үндсэн хөдөлгөөнүүдийг мэддэг болсон үед дунд шат тохирно. Ахисан түвшин нь дор хаяж зургаан сарын тогтмол дадлага шаарддаг тул яаралгүй ойртоорой.',
 'There are three levels: beginner, intermediate and advanced. Start at beginner if you have never danced; intermediate suits you once the basic movements feel familiar. Advanced asks for at least six months of steady practice, so there is no rush to get there.', 3),
('Нэг хичээл хэдэн минут үргэлжлэх вэ?',
 'How long is a class?',
 'Хичээлийн төрлөөс хамаарч 60-аас 90 минут. Яг хэдэн минут болохыг хуваарь дээрх цаг бүрийн хажууд, мөн хичээлийн дэлгэрэнгүй хуудаснаас харж болно. Эхлэхээс арав орчим минутын өмнө ирж, хувцсаа сольж, биеэ дулаацуулахыг зөвлөж байна.',
 'Between 60 and 90 minutes, depending on the class. The exact length is shown next to every slot on the schedule and on each class page. Arrive about ten minutes early to change and warm up.', 4),
('Юу өмсөж очих вэ?',
 'What should I wear?',
 'Хөдөлгөөнд саад болохгүй сунадаг өмд эсвэл лосин, тав тухтай пүүз. Өвдөг шалан дээр тулах хөдөлгөөн олон байдаг тул өвдөгний хамгаалалт нэг цагийг хамаагүй тав тухтай болгоно — манай дэлгүүрээс авах боломжтой.',
 'Stretchy trousers or leggings you can move in, and comfortable trainers. A lot of the work happens on your knees, so knee pads make the hour far more comfortable — you can pick up a pair from our shop.', 5),
('Хичээлээ цуцалж болох уу?',
 'Can I cancel a booking?',
 'Болно. Хичээл эхлэхээс 6 цагийн өмнө хүртэл «Миний булан» дотроос өөрөө цуцална. Түүнээс хойш систем цуцлахыг зөвшөөрөхгүй тул бидэн рүү шууд залгаарай — боломжтой бол суудлыг тань хүлээж байгаа өөр сурагчид шилжүүлнэ.',
 'Yes. You can cancel yourself from My account up to six hours before the class starts. After that the system locks it, so please call us instead — where we can, we pass your seat on to another student who is waiting.', 6),
('Төлбөрөө яаж хийх вэ?',
 'How do I pay?',
 'Одоогоор банкны шилжүүлгээр. Захиалга үүсгэсний дараа дансны дугаар, гүйлгээний утга дэлгэц дээр гарч ирэх бөгөөд төлбөр орсны дараа захиалга боловсруулагдана. Гүйлгээний утгыг яг бичсэнээр нь оруулах нь баталгаажилтыг хурдасгана.',
 'By bank transfer for now. Once you place an order the account number and the reference appear on screen, and we process the order as soon as the payment arrives. Copying the reference exactly speeds the confirmation up.', 7),
('Ганцаараа очиход эвгүй биш үү?',
 'Is it strange to come on my own?',
 'Сурагчдын олонх нь ганцаараа ирдэг. Эхний хичээл дээр хэн ч бие биенээ ажигладаггүй — бүгд толинд өөрийгөө хараад л завгүй байдаг. Хоёр гурван хичээлийн дараа заал танил болж, нэрсийг нь ч санаж эхэлнэ.',
 'Most people arrive alone. In your first class nobody is watching you — everyone is busy watching themselves in the mirror. After two or three classes the room stops feeling new and you start knowing names.', 8),
('Бие бялдрын бэлтгэл сайтай байх шаардлагатай юу?',
 'Do I need to be fit already?',
 'Үгүй. Хичээл бүр дулаацуулах дасгалаас эхэлж, ачааллаа аажмаар нэмдэг тул биеэ дасгах хугацаа өөрөө гарна. Хэрэв гэмтэл, мэс засал, эсвэл анхаарах шаардлагатай зүйл байвал хичээл эхлэхээс өмнө багшдаа хэлээрэй — хөдөлгөөнийг тань тохируулж өгнө.',
 'No. Every class opens with a warm-up and builds the load gradually, so your body has time to catch up. If you are carrying an injury or anything we should know about, tell the instructor before the class and they will adapt the movements for you.', 9),
('Хуваарь хэр олон удаа шинэчлэгддэг вэ?',
 'How often is the schedule updated?',
 'Долоо хоног бүр. Хуваарь хуудсан дээр өмнөх, дараагийн долоо хоног руу чөлөөтэй шилжиж, өдөр бүрд хэдэн хичээл байгааг нэг харцаар харна. Тухайн хичээл дүүрсэн бол мөр дээрээ «Дүүрсэн» гэж бичигдэнэ.',
 'Every week. On the Schedule page you can move freely between the previous and the next week and see at a glance how many classes fall on each day. If a class is full, the row says so instead of offering a button.', 10),
('Дэлгүүрийн захиалга хэрхэн ирэх вэ?',
 'How does shop delivery work?',
 'Улаанбаатар хотод 5,000₮ -ийн хүргэлтийн төлбөртэй. Захиалга баталгаажсаны дараа бид тантай утсаар холбогдож, хүргэх өдөр, цагийг тохирно. Заалнаас өөрөө авахыг хүсвэл захиалгын тайлбартаа бичээд үлдээгээрэй.',
 'Delivery inside Ulaanbaatar costs ₮5,000. Once your order is confirmed we call you to agree a day and a time. If you would rather collect it at the studio, just say so in the order note.', 11),
('Тоглолт, арга хэмжээнд урьж болох уу?',
 'Can we book you for an event?',
 'Болно. Twerk Mongolia корпоратив арга хэмжээ, тоглолт, бичлэгт тогтмол оролцдог. Огноо, байршил, хэдэн бүжигчин хэрэгтэйгээ холбоо барих хуудсаар бичиж илгээгээрэй — ажлын өдрүүдэд 24 цагийн дотор хариулна.',
 'Yes. Twerk Mongolia performs regularly at corporate events, shows and shoots. Send us the date, the venue and how many dancers you need through the contact page and we will reply within 24 hours on weekdays.', 12)
on conflict do nothing;

-- ── Анги, курс ─────────────────────────────────────────────────────────────
-- Танхимын элсэлт нэг, онлайн анги нэг. `starts_on` нь ХАРЬЦАНГУЙ огноо:
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
 12, 1),
('55555555-5555-4555-8555-222222222222', 'online-basics', 'online',
 'Онлайн үндэс', 'Online Basics',
 'Гэрээсээ, өөрийн хэмнэлээр. Хичээлүүд Telegram бүлэгт байршина.',
 'From home, at your own pace. The lessons live in a Telegram group.',
 'Арван хичээл, тус бүр 15-25 минут. Бүгд бичлэгээр тул хэдэн ч удаа буцааж үзнэ.

Элссэн даруйдаа Telegram бүлгийн урилга нээгдэнэ. Тэндээс хичээл бүрийн бичлэг, дасгалын жагсаалт, асуулт хариултын хэсэг олдоно. Багш долоо хоног бүр асуултад хариулна.',
 'Ten lessons, 15-25 minutes each. Everything is recorded, so you can go back as often as you like.

The Telegram invite unlocks the moment you enrol. Inside you will find every lesson, the drill list and a questions thread. The instructor answers questions weekly.',
 'beginner',
 '22222222-2222-4222-8222-222222222222',
 null,
 '/media/studio-5.svg', 120000, 10,
 null, null,
 'Өөрийн хэмнэлээр', 'At your own pace',
 null, 2)
on conflict (id) do nothing;

-- Telegram холбоос ТУСДАА хүснэгтэд — төлбөрөө төлсөн элсэгч л уншина.
insert into course_access (course_id, telegram_url, note_mn, note_en) values
('55555555-5555-4555-8555-222222222222', 'https://t.me/+twerkmongolia_demo',
 'Бүлэгт орсны дараа өөрийгөө танилцуулаарай — багш танд эхлэх хичээлээ хэлж өгнө.',
 'Introduce yourself once you are in — the instructor will point you to the right first lesson.')
on conflict (course_id) do nothing;
