-- Twerk Mongolia — ЭЛСЭГЧИЙН ТОО = ТӨЛСӨН ХҮН
--
-- ── Асуудал ───────────────────────────────────────────────────────────────
-- `courses.enrolled_count` нь `pending_payment` төлөвтэй мөрийг ч тоолдог
-- байсан. Тэр нь «элссэн» биш, «элсэх гэж оролдсон» хүн: Bonum руу үсэрсэн
-- боловч төлөөгүй, эсвэл хуудсаа хаачихсан байж болно.
--
-- Үр дагавар нь хоёр:
--   1. Багш, ажилтан хоёр ХУДАЛ тоо харна. «12 хүн бүртгүүлсэн» гэхэд
--      үнэндээ 4 нь л төлсөн байж болно — анги төлөвлөх суурь нь эвдэрнэ.
--   2. Төлөөгүй хүн суудлыг МӨНХӨД эзэлнэ. `pending_payment` мөр өөрөө
--      хугацаа дуусдаггүй тул нэг л удаа дарсан хүн тэр суудлыг үүрд авна.
--
-- ── Шийдэл ────────────────────────────────────────────────────────────────
-- ХАРАГДАХ тоо (`enrolled_count`) ба СУУДЛЫН шалгалт хоёрыг САЛГАВ:
--
--   • `enrolled_count` = зөвхөн `active` + `completed` — мөнгө нь орсон хүн.
--     Энэ бол хүн харах, тайланд орох, багшид хэлэх тоо.
--
--   • Суудлын шалгалт = дээрх дүн + ДӨНГӨЖ саяхны `pending_payment`.
--     Төлбөрийн цонх нээлттэй байгаа хүний суудлыг хамгаалах ёстой: эс
--     тэгвэл 10 суудалтай ангид 40 хүн зэрэг төлж, 30-д нь мөнгө буцаах
--     хэрэг гарна. Гэхдээ тэр хамгаалалт нь ХУГАЦААТАЙ (§ HOLD).
--
-- Танхим, онлайн хоёрын аль алинд хамаарна — хоёулаа `courses` мөр.

-- ═══════════════════════════════════════════════════════════════════════════
-- ХУГАЦАА ДУУССАН ОРОЛДЛОГЫГ ЦЭВЭРЛЭХ
-- ═══════════════════════════════════════════════════════════════════════════
-- Cron ажил ашиглаагүй: элсэлт бүрийн ӨМНӨ тухайн курсын хуучирсныг цэвэрлэх
-- нь хангалттай бөгөөд хамаагүй энгийн. Хэн ч элсэхгүй байгаа курсын хуучин
-- мөр хэнд ч саад болохгүй — тоолуур нь аль хэдийн түүнийг тоохоо больсон.
create or replace function public.expire_stale_enrollments(
  p_course_id uuid,
  p_hold      interval
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
begin
  for v_order_id in
    select e.order_id
    from course_enrollments e
    where e.course_id = p_course_id
      and e.status = 'pending_payment'
      and e.created_at < now() - p_hold
      and e.order_id is not null
  loop
    /* Захиалгыг цуцлавал `orders_sync_enrollment` триггер нь элсэлтийг
       өөрөө хаана — элсэлтийг энд ГАРААР цуцлахгүй. Нэг үнэн, нэг зам.

       `cancel_order()` -ийг дуудаж БОЛОХГҮЙ: тэр нь `auth.uid()` -ийг
       захиалгын эзэнтэй тулгадаг ба энд дуудаж буй хүн ӨӨР хүн (дараагийн
       элсэгч). Курсын захиалгад нөөц хасагддаггүй тул цуцлалт нь ердөө
       хоёр мөр. */
    update orders set status = 'cancelled', updated_at = now()
     where id = v_order_id and status = 'pending_payment';

    update payments set status = 'failed'
     where target_type = 'order' and target_id = v_order_id and status = 'pending';
  end loop;

  /* Захиалгагүй (гараар үүсгэсэн) хуучин мөр үлдвэл шууд хаана. */
  update course_enrollments
  set status = 'cancelled', cancelled_at = now()
  where course_id = p_course_id
    and status = 'pending_payment'
    and order_id is null
    and created_at < now() - p_hold;
end;
$$;

revoke all on function public.expire_stale_enrollments(uuid, interval) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- ТООЛУУР — ЗӨВХӨН ТӨЛСӨН
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.sync_course_enrolled_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_course uuid := coalesce(new.course_id, old.course_id);
begin
  update courses c
  set enrolled_count = (
    select count(*) from course_enrollments e
    where e.course_id = v_course
      -- `pending_payment` ЗОРИУД байхгүй: төлөөгүй хүн бол элсэгч биш.
      and e.status in ('active', 'completed')
  )
  where c.id = v_course;
  return null;
end;
$$;

-- Одоо байгаа тоонууд хуучин дүрмээр бодогдсон тул ДАХИН тоолно.
update courses c
set enrolled_count = (
  select count(*) from course_enrollments e
  where e.course_id = c.id and e.status in ('active', 'completed')
);

-- ═══════════════════════════════════════════════════════════════════════════
-- ЭЛСЭХ — СУУДЛЫГ АМЬД ТООЛНО
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.enroll_course(
  p_course_id uuid,
  p_name      text,
  p_phone     text,
  p_note      text default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  -- Төлбөрийн цонх хэр удаан суудал барих вэ. Bonum-ийн нэхэмжлэл
  -- хэдхэн минутын настай тул 30 минут нь уужуу: карт хайж, банк руу
  -- залгаж амжина. Үүнээс хойш суудал чөлөөлөгдөнө.
  c_hold constant interval := interval '30 minutes';
  v_course   courses;
  v_taken    int;
  v_order_id uuid;
  v_order_no text;
begin
  if auth.uid() is null then
    raise exception 'Нэвтэрсэн байх шаардлагатай' using errcode = '42501';
  end if;

  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_phone), '') = '' then
    raise exception 'CONTACT_REQUIRED';
  end if;

  /* Түгжихийн ӨМНӨ цэвэрлэнэ: хугацаа дууссан оролдлогууд нь суудлын
     тооллогод ч, «аль хэдийн элссэн» шалгалтад ч орох ёсгүй. Ингэснээр
     төлбөрөө орхисон хүн ӨӨРӨӨ дахин оролдох боломжтой болно — өмнө нь
     тэр хүн үүрд «аль хэдийн элссэн» гэж хаагддаг байв. */
  perform public.expire_stale_enrollments(p_course_id, c_hold);

  select * into v_course from courses where id = p_course_id for update;

  if not found or not v_course.is_active then
    raise exception 'COURSE_UNAVAILABLE';
  end if;

  if v_course.enroll_opens_at is not null and now() < v_course.enroll_opens_at then
    raise exception 'ENROLL_NOT_OPEN';
  end if;

  if v_course.enroll_closes_at is not null and now() > v_course.enroll_closes_at then
    raise exception 'ENROLL_CLOSED';
  end if;

  -- Танхимын анги эхэлсэн бол элсэлт хаагдана. Онлайн ангид эхлэх өдөр
  -- байхгүй тул энэ шалгалт өөрөө алгасагдана.
  --
  -- ⚠️ `current_date` БИШ: тэр нь серверийн бүсээр (UTC) тоолдог тул УБ-ын
  -- өглөөний 8 цаг хүртэл өчигдрийн огноо буцаана. Студи Улаанбаатарт
  -- байрладаг бөгөөд «өнөөдөр» гэдэг нь ажилтан, сурагч хоёрын өдөр.
  if v_course.starts_on is not null
     and v_course.starts_on < (now() at time zone 'Asia/Ulaanbaatar')::date then
    raise exception 'ENROLL_CLOSED';
  end if;

  /* ⚠️ `v_course.enrolled_count` -ийг ХЭРЭГЛЭХГҮЙ: тэр нь зөвхөн ТӨЛСӨН
     хүнийг тоолдог (§ sync_course_enrolled_count) бөгөөд энд бидэнд
     төлбөрийн цонхонд явж буй хүмүүс ч хэрэгтэй. Мөрийг `for update`
     -ээр түгжсэн тул хоёр хүн сүүлийн суудлыг зэрэг авч чадахгүй. */
  if v_course.capacity is not null then
    select count(*) into v_taken
    from course_enrollments e
    where e.course_id = p_course_id
      and (
        e.status in ('active', 'completed')
        or (e.status = 'pending_payment' and e.created_at > now() - c_hold)
      );

    if v_taken >= v_course.capacity then
      raise exception 'COURSE_FULL';
    end if;
  end if;

  if exists (
    select 1 from course_enrollments
    where course_id = p_course_id
      and user_id = auth.uid()
      and status in ('pending_payment', 'active', 'completed')
  ) then
    raise exception 'ALREADY_ENROLLED';
  end if;

  insert into orders (user_id, ship_name, ship_phone, subtotal, shipping_fee, total, note)
  values (auth.uid(), trim(p_name), trim(p_phone),
          v_course.price, 0, v_course.price, nullif(trim(coalesce(p_note, '')), ''))
  returning id, order_no into v_order_id, v_order_no;

  insert into order_items (order_id, course_id, name_snapshot, variant_snapshot, unit_price, qty)
  values (v_order_id, v_course.id, v_course.name_mn,
          case when v_course.mode = 'online' then 'Онлайн анги' else 'Танхимын анги' end,
          v_course.price, 1);

  insert into payments (amount, target_type, target_id)
  values (v_course.price, 'order', v_order_id);

  insert into course_enrollments (course_id, user_id, order_id, price_paid)
  values (v_course.id, auth.uid(), v_order_id, v_course.price);

  -- Үнэгүй анги бол төлбөр хүлээх утгагүй — шууд нээнэ.
  if v_course.price = 0 then
    update orders set status = 'paid', updated_at = now() where id = v_order_id;
  end if;

  return v_order_no;
end;
$$;

-- Цэвэрлэгээ, суудлын тооллого хоёр энэ индексээр явна.
create index if not exists course_enrollments_course_status_idx
  on course_enrollments (course_id, status, created_at);
