-- Twerk Mongolia — ТӨЛБӨР БАРАГДУУЛАХ
--
-- ── Юуны тулд ─────────────────────────────────────────────────────────────
-- Bonum-ийн webhook ирэхэд захиалгыг «төлөгдсөн» болгох ЦОРЫН ГАНЦ цэг.
-- Урьд нь тэр ажил `handle-result.ts` дотор TODO хэвээр байсан: webhook
-- ирдэг, лог бичигддэг, гэвч захиалга `pending_payment` дээрээ үлддэг байв.
--
-- ── Яагаад функц, шууд UPDATE биш вэ ──────────────────────────────────────
-- Гурван зүйл НЭГ транзакц дотор, НЭГ түгжээний дор болох ёстой:
--
--   1. Идэмпотент байдал. Bonum webhook-оо давтан илгээж болно (сүлжээ
--      тасарсан, 200 хоцорсон). Хоёр дахь удаад ЮУ Ч болох ёсгүй.
--   2. Дүн тулгах. Provider-ээс ирсэн дүнд сохроор итгэхгүй — манай
--      `payments.amount` -тай таарч байж л төлөгдсөнд тооцно.
--   3. Захиалгын төлөв. `orders.status = 'paid'` болоход `orders_sync_enrollment`
--      trigger нь курсын элсэлтийг өөрөө идэвхжүүлнэ (§ 20260903000001).
--
-- Эдгээрийг код дээр тус тусад нь хийвэл хоёр webhook зэрэг ирэхэд хоёулаа
-- «pending» гэж уншаад хоёулаа төлөгдсөн гэж бичнэ. `for update` нь тэр
-- уралдааныг зогсооно.
--
-- ── Яагаад `security definer` вэ ──────────────────────────────────────────
-- Webhook нь нэвтрээгүй хүсэлт. Аюулгүй байдал нь бүхэлдээ `x-checksum-v2`
-- гарын үсэг дээр тогтоно (§ api/payments/webhook). Тэр шалгалт давсны
-- дараа л энэ функц service-role client-ээр дуудагдана — anon руу ЭНЭ
-- функцийн эрх ОГТ олгогдохгүй.

create or replace function public.settle_payment(
  p_payment_id   uuid,
  p_provider     text,
  p_provider_ref text,
  p_amount       int,
  p_paid         boolean,
  p_raw          jsonb default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payment payments;
begin
  select * into v_payment from payments where id = p_payment_id for update;

  if not found then
    return 'not_found';
  end if;

  -- 1. Идэмпотент: аль хэдийн шийдэгдсэн төлбөрийг дахин хөндөхгүй.
  if v_payment.status <> 'pending' then
    return 'already_' || v_payment.status;
  end if;

  -- 2. Дүн тулгах. Зөрвөл ЮУ Ч хийхгүй — гараар шалгах ёстой тохиолдол.
  if p_paid and v_payment.amount <> p_amount then
    return 'amount_mismatch';
  end if;

  if not p_paid then
    update payments
    set status = 'failed', provider = p_provider, provider_ref = p_provider_ref, raw = p_raw
    where id = p_payment_id;
    return 'failed';
  end if;

  update payments
  set status = 'paid',
      provider = p_provider,
      provider_ref = p_provider_ref,
      raw = p_raw,
      paid_at = now()
  where id = p_payment_id;

  -- 3. Зорилтот биетийн төлөв.
  if v_payment.target_type = 'order' then
    /* Зөвхөн `pending_payment` -аас. Ажилтан гараар «Төлөгдсөн» болгочихсон,
       эсвэл захиалга цуцлагдсан байж болно — хоцорсон webhook тэр
       шийдвэрийг эргүүлж болохгүй. */
    update orders
    set status = 'paid', updated_at = now()
    where id = v_payment.target_id and status = 'pending_payment';

  elsif v_payment.target_type = 'booking' then
    update bookings
    set status = 'confirmed'
    where id = v_payment.target_id and status = 'pending';
  end if;

  insert into audit_log (actor_id, action, entity, entity_id, diff)
  values (
    null, 'payment.settled', 'payments', p_payment_id,
    jsonb_build_object('provider', p_provider, 'ref', p_provider_ref, 'amount', p_amount)
  );

  return 'paid';
end;
$$;

-- Нэвтрээгүй хэн ч дуудаж болохгүй: webhook нь service-role -оор дууддаг
-- (§ lib/supabase/admin.ts) тул эдгээр дүрд эрх хэрэггүй.
revoke all on function public.settle_payment(uuid, text, text, int, boolean, jsonb) from public;
revoke all on function public.settle_payment(uuid, text, text, int, boolean, jsonb) from anon;
revoke all on function public.settle_payment(uuid, text, text, int, boolean, jsonb) from authenticated;

-- ── Хайлт хурдасгах ───────────────────────────────────────────────────────
-- Нэхэмжлэл үүсгэхэд захиалгын `pending` төлбөрийг хайна; webhook-д
-- provider_ref -ээр буцаан хайх шаардлага гарч болно.
create index if not exists payments_target_idx on payments (target_type, target_id, status);
create index if not exists payments_provider_ref_idx on payments (provider_ref);
