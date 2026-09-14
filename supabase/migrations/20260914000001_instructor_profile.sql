-- Twerk Mongolia — БАГШИЙН ДЭЛГЭРЭНГҮЙ ТАНИЛЦУУЛГА
--
-- ── Яагаад нэг хайрцаг текст хүрэхээ больсон бэ ────────────────────────────
-- `instructors` хүснэгт эхэндээ ганц `bio_mn/bio_en` талбартай байв: «Багш
-- хэн бэ» гэдгийг нэг догол мөрөөр хэлнэ гэсэн таамаг. Бодит танилцуулга
-- ирэхэд тэр таамаг нурав — нэг хүний ард дөрвөн ӨӨР ТӨРЛИЙН баримт байна:
--
--   1. ҮҮРЭГ    — нэрийн доор сууж, «энэ хүн юу хийдэг» -ийг нэг мөрөөр.
--   2. НАМТАР   — жагсаалт: боловсрол, мэргэжил, хэдэн жил.
--   3. ЧИГЛЭЛ   — заадаг хичээлүүд. Богино, шошго хэлбэртэй.
--   4. ХЭЛ      — гурав хүртэлх үг.
--
-- Эдгээрийг догол мөр болгож нийлүүлбэл бүгд ижил жинтэй болно — уншигч
-- «энэ багш ЮУ ЗААДАГ вэ» гэдгээ хайж догол мөр гүйлгэх ёстой. Тусад нь
-- талбар болгосноор хуудас нь эрэмбийг өөрөө барина.
--
-- ── Яагаад `text[]`, jsonb биш вэ ─────────────────────────────────────────
-- Жагсаалтын мөр бүр нь энгийн ЭГНЭЭ — түлхүүргүй, бүтэцгүй, зөвхөн дараалал
-- утгатай. jsonb нь байхгүй бүтцийг зөвшөөрнө (нэг багш дээр `{title,years}`,
-- нөгөө дээр нь цулгуй мөр), улмаар уншигч код нь хоёуланг барих ёстой болно.
-- `text[]` нь хэлбэрийг нэг утгатай байлгана.
--
-- ⚠️ Дахин ажиллуулахад аюулгүй. Багана нэмэх нь `if not exists`, өгөгдөл нь
-- `on conflict (slug) do update` — өөрөөр хэлбэл энэ файл нь ТАНИЛЦУУЛГЫН
-- ЭХ СУРВАЛЖ. Админаас гараар засчихаад энэ файлыг дахин ажиллуулбал засвар
-- дарагдана; тиймээс засварыг энд БУЦААЖ бичнэ.

-- ── Багана ────────────────────────────────────────────────────────────────
alter table instructors add column if not exists role_mn       text   not null default '';
alter table instructors add column if not exists role_en       text   not null default '';
alter table instructors add column if not exists background_mn text[] not null default '{}';
alter table instructors add column if not exists background_en text[] not null default '{}';
alter table instructors add column if not exists expertise_mn  text[] not null default '{}';
alter table instructors add column if not exists expertise_en  text[] not null default '{}';
alter table instructors add column if not exists languages_mn  text[] not null default '{}';
alter table instructors add column if not exists languages_en  text[] not null default '{}';

-- Twerk Mongolia -д хэдэн жил болсныг ЗӨВХӨН мэдэж байгаа багш дээр бичнэ.
-- `0` бол «тэг жил» гэсэн худал баримт болох тул анхдагч нь NULL.
alter table instructors add column if not exists years int check (years is null or years > 0);

-- ── Гараар үүссэн мөрийг цэгцлэх ──────────────────────────────────────────
-- Үүсгэн байгуулагчийн мөр админаас гараар орсон тул slug нь «1» болчихсон
-- байв — /instructors/1 гэсэн хаяг хүнд ч, хайлтын системд ч юу ч хэлэхгүй.
-- Гадны холбоос бүрдээгүй байхад нь засах цорын ганц боломж бол ОДОО.
update instructors set slug = 'misheel'
 where slug = '1'
   and not exists (select 1 from instructors i where i.slug = 'misheel');

-- Instagram нь БҮТЭН ХАЯГААР орсон байв ('https://www.instagram.com/...').
-- Код нь `https://instagram.com/{instagram}` гэж угсардаг тул холбоос нь
-- давхарлаад эвдэрнэ. Хадгалах хэлбэр нь ганц: @-гүй хэрэглэгчийн нэр.
update instructors
   set instagram = regexp_replace(instagram, '^.*instagram\.com/@?([^/?#]+).*$', '\1')
 where instagram like '%instagram.com/%';

-- ── Багш нар ──────────────────────────────────────────────────────────────
-- `id` нь ТОГТМОЛ. Жишээ өгөгдөл (§ seed.sql) нь хуваарь, курсэн дээрээ
-- багшийг ЯГ энэ дугаараар заадаг тул санамсаргүй uuid бол холбоо тасарна.
-- Амьд суурин дээр мөр нь аль хэдийн өөр дугаартай байж болно — тиймээс
-- мөргөлдөөнийг `slug` -аар барина: тэр нь хаягийг ч тодорхойлдог
-- цорын ганц утга.
insert into instructors (
  id, slug, name, role_mn, role_en, bio_mn, bio_en,
  background_mn, background_en, expertise_mn, expertise_en,
  languages_mn, languages_en, years, instagram, sort_order
) values

('22222222-2222-4222-8222-111111111111', 'misheel', 'Мишээл Баттулга',
 'Twerk Mongolia-г үүсгэн байгуулагч',
 'Founder of Twerk Mongolia',
 'Мэргэжлийн хувьд олон улсын харилцаа, англи хэлний орчуулгын чиглэлээр боловсрол эзэмшсэн. Бүжиг, контент, event production болон олон улсын уран бүтээлчидтэй хамтран ажиллах чиглэлээр үйл ажиллагаагаа хөгжүүлж ирсэн.',
 'Educated in international relations and English translation. Built a career around dance, content, event production and collaborations with international artists.',
 array['Олон улсын харилцаа',
       'Англи хэлний орчуулагч, хэлмэрч',
       'Twerk бүжигчин, багш',
       'Event болон бүтээлч продакшн',
       'Twerk Mongolia-г үүсгэн байгуулагч'],
 array['International Relations',
       'English Translator & Interpreter',
       'Twerk Dancer & Instructor',
       'Event & Creative Production',
       'Founder of Twerk Mongolia'],
 array[]::text[], array[]::text[],
 array['Монгол', 'Орос', 'Англи'],
 array['Mongolian', 'Russian', 'English'],
 5, 'misheelbattulga', 1),

('22222222-2222-4222-8222-222222222222', 'nomiko', 'Nomiko',
 'Twerk Mongolia багш · Уран бүтээлч · Makeup artist · Фитнесс тамирчин',
 'Twerk Mongolia Instructor · Artist · Makeup Artist · Fitness Athlete',
 'Урлаг, гоо сайхан, фитнесс болон бүжгийн чиглэлээр өөрийгөө хөгжүүлж ирсэн олон талт уран бүтээлч. Мэргэжлийн зураач, makeup artist бөгөөд сүүлийн 4 жилийн хугацаанд Twerk болон Booty Workout чиглэлээр хичээл зааж байна.',
 'A multidisciplinary artist working across art, beauty, fitness and dance. A professional painter and makeup artist who has taught Twerk and Booty Workout for the past four years.',
 array['Мэргэжлийн зураач',
       'Мэргэжлийн makeup artist',
       'Twerk бүжгийн багш — 4 жил',
       'Booty Workout багш — 4 жил',
       'Фитнесс тамирчин',
       'Studio 10th Block-ийн хамтран үүсгэн байгуулагч'],
 array['Professional Artist / Painter',
       'Professional Makeup Artist',
       'Twerk Dance Instructor — 4 years',
       'Booty Workout Instructor — 4 years',
       'Fitness Athlete',
       'Co-founder — Studio 10th Block'],
 array['Twerk', 'Booty Workout фитнесс', 'Урлаг', 'Makeup'],
 array['Twerk', 'Booty Workout Fitness', 'Art', 'Makeup'],
 array['Монгол', 'Англи', 'Хятад'],
 array['Mongolian', 'English', 'Chinese'],
 null, 'nomiko_inshape', 2),

('22222222-2222-4222-8222-333333333333', 'daarii', 'Daarii',
 'Twerk Mongolia багш · Stretch & Flexibility багш · Эдийн засагч',
 'Twerk Mongolia Instructor · Stretch & Flexibility Instructor · Economist',
 'Санкт-Петербург хотод эдийн засгийн чиглэлээр боловсрол эзэмшсэн, Oil & Gas салбарын эдийн засагч. Бүжгийн чиглэлээр Twerk Mongolia-д багшилж, ялангуяа stretch, flexibility болон биеийн уян хатан байдал, хөдөлгөөний хяналтыг хөгжүүлэх чиглэлээр хичээл заадаг.',
 'Studied economics in Saint Petersburg and works as an economist in oil and gas. Teaches at Twerk Mongolia with a focus on stretch, flexibility and body control.',
 array['Эдийн засагч — Санкт-Петербург хотод төгссөн',
       'Газрын тос, хийн салбарын эдийн засагч',
       'Twerk бүжгийн багш — Twerk Mongolia',
       'Stretch & Flexibility багш'],
 array['Economist — graduated in Saint Petersburg, Russia',
       'Oil & Gas Economist',
       'Twerk Dance Instructor — Twerk Mongolia',
       'Stretch & Flexibility Instructor'],
 array['Stretch', 'Уян хатан байдал', 'Twerk', 'Биеийн хяналт'],
 array['Stretch', 'Flexibility & Mobility', 'Twerk', 'Body Control'],
 array['Монгол', 'Орос', 'Англи'],
 array['Mongolian', 'Russian', 'English'],
 null, 'daarii1216', 3),

('22222222-2222-4222-8222-444444444444', 'itgel', 'Itgel',
 'Twerk Mongolia багш · Сэтгэл судлаач · Бүжигчин',
 'Twerk Mongolia Instructor · Psychology Graduate · Dancer',
 'Сэтгэл судлалын чиглэлээр боловсрол эзэмшсэн, бүжигчин болон Twerk Mongolia-ийн багшаар ажилладаг. Одоогоор Cardio Twerk чиглэлээр хичээл зааж, бүжгийн хөдөлгөөн, эрч хүч болон өөрийн биеэрээ өөрийгөө илэрхийлэх чадварыг хөгжүүлэхэд чиглэн ажиллаж байна.',
 'A psychology graduate, dancer and Twerk Mongolia instructor. Currently teaches Cardio Twerk, working on movement, energy and self-expression through the body.',
 array['Сэтгэл судлалын мэргэжилтэн',
       'Twerk бүжгийн багш — Twerk Mongolia',
       'Cardio Twerk багш',
       'Бүжигчин, тоглолтын уран бүтээлч'],
 array['Psychology Graduate',
       'Twerk Dance Instructor — Twerk Mongolia',
       'Cardio Twerk Instructor',
       'Dancer & Performer'],
 array['Cardio Twerk', 'Twerk тоглолт', 'Биеийн хөдөлгөөн'],
 array['Cardio Twerk', 'Twerk Performance', 'Body Movement'],
 array['Англи'],
 array['English'],
 null, 'itgel_zh', 4)

on conflict (slug) do update set
  name          = excluded.name,
  role_mn       = excluded.role_mn,
  role_en       = excluded.role_en,
  bio_mn        = excluded.bio_mn,
  bio_en        = excluded.bio_en,
  background_mn = excluded.background_mn,
  background_en = excluded.background_en,
  expertise_mn  = excluded.expertise_mn,
  expertise_en  = excluded.expertise_en,
  languages_mn  = excluded.languages_mn,
  languages_en  = excluded.languages_en,
  years         = excluded.years,
  instagram     = excluded.instagram,
  sort_order    = excluded.sort_order;
  -- `photo_url` ба `is_active` нь ЗОРИУД байхгүй. Хоёулаа админаас
  -- удирдагддаг — зургийг ажилтан байршуулж, идэвхгүй болгохыг ажилтан
  -- шийднэ. Энэ файлыг дахин ажиллуулах нь тэр хоёр шийдвэрийг эргүүлж
  -- болохгүй.
