-- Product-level discounts for Luma Beauty
-- Run once in Supabase SQL Editor if this migration has not already been applied.

alter table public.products
add column if not exists discount_percent integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_discount_percent_check'
  ) then
    alter table public.products
    add constraint products_discount_percent_check
    check (discount_percent between 0 and 100);
  end if;
end $$;

create or replace function public.create_order(
  items jsonb,
  promo_code text,
  pay text,
  addr text default ''::text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  sub int;
  lines jsonb;
  pct int;
  tot int;
  oid bigint;
  pr profiles;
  code text;
begin
  if auth.uid() is null then
    raise exception 'login required';
  end if;
  select * into pr from profiles where id = auth.uid();

  with l as (
    select
      p.id,
      p.kind,
      p.title,
      p.price as original_price,
      round(p.price * (100 - coalesce(p.discount_percent, 0)) / 100.0)::int as sale_price,
      coalesce(p.discount_percent, 0) as discount_percent,
      greatest(1, least(99, (i->>'qty')::int)) as q
    from jsonb_array_elements(items) i
    join products p
      on p.id = (i->>'id')::int
     and p.active
     and p.price > 0
  )
  select
    coalesce(sum(sale_price * q), 0),
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'title', trim(kind || ' ' || title),
          'qty', q,
          'price', sale_price,
          'original_price', original_price,
          'discount_percent', discount_percent
        )
      ),
      '[]'::jsonb
    )
  into sub, lines
  from l;

  if sub = 0 then raise exception 'empty order'; end if;
  code := upper(trim(coalesce(promo_code, '')));
  pct := check_promo(code);
  tot := round(sub * (100 - pct) / 100.0);

  insert into orders(
    user_id, customer_name, phone, items,
    promo, discount, total, payment, address
  )
  values (
    auth.uid(), pr.name, pr.phone, lines,
    nullif(code, ''), pct, tot, pay,
    left(coalesce(addr, ''), 500)
  )
  returning id into oid;

  return jsonb_build_object('id', oid, 'total', tot);
end;
$function$;
