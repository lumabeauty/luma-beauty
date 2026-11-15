-- 17. Growth features: delivery fee + free threshold, gift with purchase, first-order promo,
-- gift certificates, product Q&A, review pros/cons, product views, newsletter, order tracking.

-- Shop settings (editable in admin)
insert into public.site_settings(key, value) values
 ('shop', '{"delivery_tashkent":25000,"delivery_region":35000,"free_from":500000,"gift_active":true,"gift_from":1000000,"gift_text":"Миниатюра в подарок"}'::jsonb)
on conflict (key) do nothing;

-- First-order promo
alter table public.promos add column if not exists first_order_only boolean not null default false;
insert into public.promos(code, percent, active, first_order_only) values ('NEW', 10, true, true)
on conflict (code) do update set percent = 10, active = true, first_order_only = true;

create or replace function public.check_promo(c text)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce((
    select p.percent from public.promos p
    where p.code = upper(trim(c)) and p.active
      and (not p.first_order_only or auth.uid() is null or not exists (
        select 1 from public.orders o where o.user_id = auth.uid() and o.status <> 'canceled'))
  ), 0)
$$;

-- Orders: new columns
alter table public.orders add column if not exists delivery_fee integer not null default 0;
alter table public.orders add column if not exists gift text;
alter table public.orders add column if not exists gift_card_code text;
alter table public.orders add column if not exists gift_card_used integer not null default 0;

-- Gift certificates
create table if not exists public.gift_cards (
  code text primary key,
  amount integer not null check (amount > 0),
  balance integer not null check (balance >= 0),
  active boolean not null default true,
  order_id bigint references public.orders(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
alter table public.gift_cards enable row level security;
drop policy if exists "gift cards admin" on public.gift_cards;
create policy "gift cards admin" on public.gift_cards for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "gift cards buyer read" on public.gift_cards;
create policy "gift cards buyer read" on public.gift_cards for select using (
  order_id is not null and exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

create or replace function public.new_gift_code()
returns text language plpgsql volatile set search_path = public, extensions as $$
declare a text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; s text; i int; b bytea;
begin
  loop
    b := extensions.gen_random_bytes(8); s := '';
    for i in 0..7 loop s := s || substr(a, (get_byte(b, i) % 32) + 1, 1); end loop;
    s := 'LUMA-' || substr(s,1,4) || '-' || substr(s,5,4);
    exit when not exists (select 1 from public.gift_cards where code = s);
  end loop;
  return s;
end $$;

create or replace function public.check_gift_card(c text)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce((select balance from public.gift_cards where code = upper(trim(c)) and active), -1)
$$;
grant execute on function public.check_gift_card(text) to anon, authenticated;

-- Issue certificates when an order with certificate products gets paid
create or replace function public.orders_issue_gift_cards()
returns trigger language plpgsql security definer set search_path = public as $$
declare it jsonb; n int; pr public.products%rowtype;
begin
  if new.status in ('paid','shipped','done') and coalesce(old.status,'new') not in ('paid','shipped','done')
     and not exists (select 1 from public.gift_cards where order_id = new.id) then
    for it in select * from jsonb_array_elements(new.items) loop
      select * into pr from public.products where id = (it->>'id')::int;
      if found and pr.category = 'Сертификаты' then
        for n in 1..greatest(1, (it->>'qty')::int) loop
          insert into public.gift_cards(code, amount, balance, order_id, note)
          values (public.new_gift_code(), pr.price, pr.price, new.id, 'Куплен в заказе №' || new.id);
        end loop;
      end if;
    end loop;
  end if;
  -- restore certificate balance if an order that used it is canceled
  if new.status = 'canceled' and coalesce(old.status,'') <> 'canceled' and coalesce(new.gift_card_used,0) > 0 and new.gift_card_code is not null then
    update public.gift_cards set balance = balance + new.gift_card_used where code = new.gift_card_code;
  end if;
  return new;
end $$;
drop trigger if exists orders_issue_gift_cards on public.orders;
create trigger orders_issue_gift_cards after update of status on public.orders
for each row execute function public.orders_issue_gift_cards();

-- Certificate products
insert into public.products(title, kind, category, volume, price, image, active, sort, discount_percent, stock, description)
select t, 'Luma Beauty', 'Сертификаты', '', pr, 'img/gift-' || (pr/1000) || '.jpg', true, 900 + (pr/100000), 0, null,
 'Электронный подарочный сертификат Luma Beauty. Код придёт после оплаты в личный кабинет и в Telegram. Действует 1 год на любые товары, можно использовать частями.'
from (values ('Подарочный сертификат 200 000 сум', 200000), ('Подарочный сертификат 500 000 сум', 500000), ('Подарочный сертификат 1 000 000 сум', 1000000)) v(t, pr)
where not exists (select 1 from public.products where category = 'Сертификаты' and price = v.pr);

-- Product questions (Q&A)
create table if not exists public.product_questions (
  id bigint generated always as identity primary key,
  product_id integer not null references public.products(id) on delete cascade,
  user_id uuid default auth.uid(),
  author_name text,
  question text not null check (length(question) between 5 and 500),
  answer text,
  status text not null default 'pending' check (status in ('pending','published','hidden')),
  created_at timestamptz not null default now(),
  answered_at timestamptz
);
alter table public.product_questions enable row level security;
drop policy if exists "q read" on public.product_questions;
create policy "q read" on public.product_questions for select using (status = 'published' or public.is_admin());
drop policy if exists "q insert" on public.product_questions;
create policy "q insert" on public.product_questions for insert with check (status = 'pending' and answer is null and (user_id is null or user_id = auth.uid()));
drop policy if exists "q admin" on public.product_questions;
create policy "q admin" on public.product_questions for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "q admin del" on public.product_questions;
create policy "q admin del" on public.product_questions for delete using (public.is_admin());
revoke all on public.product_questions from anon, authenticated;
grant select on public.product_questions to anon, authenticated;
grant insert (product_id, author_name, question) on public.product_questions to anon, authenticated;
grant update, delete on public.product_questions to authenticated;
create index if not exists product_questions_pid on public.product_questions(product_id, status);

-- Review pros / cons tags
alter table public.product_reviews add column if not exists tags text[] not null default '{}';
alter table public.product_reviews drop constraint if exists product_reviews_tags_ok;
alter table public.product_reviews add constraint product_reviews_tags_ok check (
  tags <@ array['p_moist','p_absorb','p_light','p_smell','p_result','p_value','p_gentle','p_long',
                'c_heavy','c_smell','c_slow','c_price','c_irrit','c_pack']::text[] and cardinality(tags) <= 8);
grant insert (tags), update (tags) on public.product_reviews to authenticated;

-- Product views (honest "N people viewed" counter)
create table if not exists public.product_views (
  product_id integer not null,
  at timestamptz not null default now()
);
alter table public.product_views enable row level security;
create index if not exists product_views_pid_at on public.product_views(product_id, at);
create or replace function public.track_view(pid integer)
returns integer language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if exists (select 1 from public.products where id = pid and active) then
    insert into public.product_views(product_id) values (pid);
  end if;
  if random() < 0.02 then delete from public.product_views where at < now() - interval '7 days'; end if;
  select count(*) into n from public.product_views where product_id = pid and at > now() - interval '3 hours';
  return n;
end $$;
grant execute on function public.track_view(integer) to anon, authenticated;

-- Newsletter
create table if not exists public.newsletter_subscribers (
  id bigint generated always as identity primary key,
  contact text not null check (length(contact) between 5 and 120),
  lang text,
  created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;
drop policy if exists "nl insert" on public.newsletter_subscribers;
create policy "nl insert" on public.newsletter_subscribers for insert with check (true);
drop policy if exists "nl admin" on public.newsletter_subscribers;
create policy "nl admin" on public.newsletter_subscribers for select using (public.is_admin());
drop policy if exists "nl admin del" on public.newsletter_subscribers;
create policy "nl admin del" on public.newsletter_subscribers for delete using (public.is_admin());
revoke all on public.newsletter_subscribers from anon, authenticated;
grant insert (contact, lang) on public.newsletter_subscribers to anon, authenticated;
grant select, delete on public.newsletter_subscribers to authenticated;

-- Order tracking by number + phone
create or replace function public.track_order(p_id bigint, p_phone text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare d text := regexp_replace(coalesce(p_phone,''), '\D', '', 'g'); o public.orders%rowtype;
begin
  if length(d) < 9 then return null; end if;
  select * into o from public.orders where id = p_id
    and right(regexp_replace(coalesce(phone,''), '\D', '', 'g'), 9) = right(d, 9);
  if not found then return null; end if;
  return jsonb_build_object('id', o.id, 'status', o.status, 'created_at', o.created_at, 'total', o.total,
    'payment', o.payment, 'items', (select coalesce(sum((i->>'qty')::int),0) from jsonb_array_elements(o.items) i),
    'pickup', o.address ilike 'Самовывоз%');
end $$;
grant execute on function public.track_order(bigint, text) to anon, authenticated;

-- create_order v3: delivery fee, gift, gift card; certificates are never discounted
alter function public.create_order(jsonb, text, text, text, integer, text) rename to create_order_v2_retired;
revoke all on function public.create_order_v2_retired(jsonb, text, text, text, integer, text) from public, anon, authenticated;
create or replace function public.create_order(items jsonb, promo_code text, pay text, addr text default '',
  p_cashback_to_use integer default 0, p_welcome text default null, p_gift_code text default null)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $function$
declare
  sub integer; dsub integer; lines jsonb; pct integer; ppct integer; bpct integer; wpct integer; nqty integer;
  tot integer; oid bigint; pr public.profiles%rowtype; code text; label text;
  cb integer := greatest(coalesce(p_cashback_to_use, 0), 0);
  s jsonb; fee integer := 0; gift text; gc public.gift_cards%rowtype; gcode text; gused integer := 0; payable integer;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  select * into pr from public.profiles where id = auth.uid() for update;
  if not found then raise exception 'profile not found'; end if;

  with l as (
    select p.id, p.kind, p.title, p.category, p.price as original_price,
      round(p.price * (100 - coalesce(p.discount_percent, 0)) / 100.0)::int as sale_price,
      coalesce(p.discount_percent, 0) as discount_percent,
      greatest(1, least(99, (i->>'qty')::int)) as q
    from jsonb_array_elements(items) i
    join public.products p on p.id = (i->>'id')::int and p.active and p.price > 0
  )
  select coalesce(sum(sale_price * q), 0),
    coalesce(sum(case when category <> 'Сертификаты' then sale_price * q else 0 end), 0),
    coalesce(sum(case when category <> 'Сертификаты' then q else 0 end), 0),
    coalesce(jsonb_agg(jsonb_build_object('id', id, 'title', trim(kind || ' ' || title), 'qty', q,
      'price', sale_price, 'original_price', original_price, 'discount_percent', discount_percent)), '[]'::jsonb)
  into sub, dsub, nqty, lines from l;
  if sub = 0 then raise exception 'empty order'; end if;

  code := upper(trim(coalesce(promo_code, '')));
  ppct := public.check_promo(code);
  bpct := public.bulk_promo_pct(nqty);
  wpct := public.welcome_pct(p_welcome);
  pct := greatest(ppct, bpct, wpct);
  if dsub = 0 then pct := 0; end if;
  if pct = 0 then label := null;
  elsif pct = ppct and ppct > 0 then label := nullif(code, '');
  elsif pct = bpct then label := 'АКЦИЯ: ' || nqty || ' шт';
  else label := 'ПРИВЕТСТВЕННАЯ СКИДКА';
  end if;
  tot := sub - round(dsub * pct / 100.0)::int;

  -- delivery fee and gift with purchase
  select value into s from public.site_settings where key = 'shop';
  s := coalesce(s, '{}'::jsonb);
  if coalesce(addr,'') ilike 'Самовывоз%' then fee := 0;
  elsif tot >= coalesce((s->>'free_from')::int, 0) and coalesce((s->>'free_from')::int, 0) > 0 then fee := 0;
  elsif coalesce(addr,'') ilike 'Доставка: г. Ташкент,%' then fee := coalesce((s->>'delivery_tashkent')::int, 0);
  else fee := coalesce((s->>'delivery_region')::int, 0);
  end if;
  if coalesce((s->>'gift_active')::boolean, false) and tot >= coalesce((s->>'gift_from')::int, 0) then
    gift := nullif(s->>'gift_text', '');
  end if;

  payable := tot + fee;

  -- gift certificate
  gcode := nullif(upper(trim(coalesce(p_gift_code, ''))), '');
  if gcode is not null then
    select g.* into gc from public.gift_cards g where g.code = gcode and g.active for update;
    if not found or gc.balance <= 0 then raise exception 'gift card invalid'; end if;
    gused := least(gc.balance, payable);
    update public.gift_cards g set balance = g.balance - gused where g.code = gcode;
    payable := payable - gused;
  end if;

  if cb > floor(tot * 0.50) then raise exception 'cashback limit exceeded: maximum is 50 percent of order'; end if;
  if cb > coalesce(pr.cashback_balance, 0) then raise exception 'insufficient cashback balance'; end if;
  cb := least(cb, payable);
  payable := payable - cb;

  insert into public.orders(user_id, customer_name, phone, items, promo, discount, total, payment, address, cashback_used,
    delivery_fee, gift, gift_card_code, gift_card_used)
  values (auth.uid(), pr.name, pr.phone, lines, label, pct, payable, pay, left(coalesce(addr, ''), 500), cb,
    fee, gift, gcode, gused)
  returning id into oid;

  if cb > 0 then
    update public.profiles set cashback_balance = cashback_balance - cb where id = auth.uid();
    insert into public.cashback_redemptions(order_id, user_id, amount) values (oid, auth.uid(), cb);
  end if;

  return jsonb_build_object('id', oid, 'total', payable, 'subtotal_after_promo', tot, 'cashback_used', cb,
    'discount', pct, 'promo', label, 'delivery_fee', fee, 'gift', gift, 'gift_card_used', gused);
end;
$function$;
revoke all on function public.create_order(jsonb, text, text, text, integer, text, text) from public, anon;
grant execute on function public.create_order(jsonb, text, text, text, integer, text, text) to authenticated;

-- Best sellers for "Хиты" (counts only, no personal data)
create or replace function public.top_products(n integer default 12)
returns table(product_id integer, sold integer) language sql stable security definer set search_path = public as $$
  select (i->>'id')::int, sum((i->>'qty')::int)::int
  from public.orders o, jsonb_array_elements(o.items) i
  where o.status in ('new','paid','shipped','done') and o.created_at > now() - interval '120 days'
  group by 1 order by 2 desc limit least(greatest(n,1),50)
$$;
grant execute on function public.top_products(integer) to anon, authenticated;
