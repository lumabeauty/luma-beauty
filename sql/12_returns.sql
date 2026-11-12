-- Возвраты (вкладка «Возвраты» в админке)
create table if not exists public.order_returns(
  id bigserial primary key,
  order_id bigint references public.orders(id) on delete set null,
  user_id uuid,
  customer_name text default '',
  phone text default '',
  items jsonb not null default '[]'::jsonb,
  reason text not null default '',
  comment text not null default '',
  amount integer not null default 0 check (amount >= 0),
  refund_method text not null default '',
  restock boolean not null default true,
  restocked boolean not null default false,
  status text not null default 'new' check (status in ('new','approved','received','refunded','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.order_returns enable row level security;
drop policy if exists "returns admin" on public.order_returns;
create policy "returns admin" on public.order_returns for all using (public.is_admin()) with check (public.is_admin());

-- Товар возвращается на склад один раз, когда статус становится «Товар получен» или «Деньги возвращены»
create or replace function public.apply_return_inventory() returns trigger
language plpgsql security definer set search_path to 'pg_catalog','public' as $$
declare line jsonb; pid integer; q integer;
begin
  new.updated_at := now();
  if new.restock and not new.restocked and new.status in ('received','refunded') then
    for line in select value from jsonb_array_elements(coalesce(new.items,'[]'::jsonb)) loop
      pid := nullif(line->>'id','')::integer;
      q := greatest(0, least(999, coalesce(nullif(line->>'qty','')::integer,0)));
      if pid is not null and q > 0 then
        update public.products set stock = stock + q where id = pid and stock is not null;
      end if;
    end loop;
    new.restocked := true;
  end if;
  return new;
end $$;
drop trigger if exists order_returns_inventory on public.order_returns;
create trigger order_returns_inventory before insert or update on public.order_returns
for each row execute function public.apply_return_inventory();
drop trigger if exists audit_order_returns_changes on public.order_returns;
create trigger audit_order_returns_changes after insert or update or delete on public.order_returns
for each row execute function public.write_admin_audit_log();
