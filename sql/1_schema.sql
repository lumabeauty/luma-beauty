-- Luma Beauty: схема базы. Выполнить целиком в Supabase -> SQL Editor
create table profiles(id uuid primary key references auth.users on delete cascade,name text,phone text,email text,is_admin boolean not null default false,created_at timestamptz default now());
create table products(id serial primary key,title text not null,kind text default '',category text default 'Тело',volume text default '',price int not null default 0,image text default '',ingredients text default '',suits text default '',avoid text default '',active boolean not null default true,sort int default 0);
create table promos(code text primary key,percent int not null check(percent between 1 and 90),active boolean not null default true);
create table orders(id bigserial primary key,user_id uuid references auth.users,customer_name text,phone text,items jsonb,promo text,discount int default 0,total int,payment text,address text,status text not null default 'new',created_at timestamptz default now());

create function is_admin() returns boolean language sql security definer stable set search_path=public as $$ select coalesce((select p.is_admin from profiles p where p.id=auth.uid()),false) $$;
create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into profiles(id,name,phone,email) values(new.id,new.raw_user_meta_data->>'name',new.raw_user_meta_data->>'phone',new.email); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

alter table profiles enable row level security; alter table products enable row level security; alter table promos enable row level security; alter table orders enable row level security;
create policy "profiles read" on profiles for select using(id=auth.uid() or is_admin());
create policy "products read" on products for select using(true);
create policy "products admin" on products for all using(is_admin()) with check(is_admin());
create policy "promos admin" on promos for all using(is_admin()) with check(is_admin());
create policy "orders read" on orders for select using(user_id=auth.uid() or is_admin());
create policy "orders admin update" on orders for update using(is_admin()) with check(is_admin());

create function check_promo(c text) returns int language sql security definer stable set search_path=public as $$ select coalesce((select percent from promos where code=upper(trim(c)) and active),0) $$;

create function create_order(items jsonb, promo_code text, pay text, addr text default '') returns jsonb language plpgsql security definer set search_path=public as $$
declare sub int; lines jsonb; pct int; tot int; oid bigint; pr profiles; code text;
begin
 if auth.uid() is null then raise exception 'login required'; end if;
 select * into pr from profiles where id=auth.uid();
 with l as (select p.id,p.kind,p.title,p.price,greatest(1,least(99,(i->>'qty')::int)) q from jsonb_array_elements(items) i join products p on p.id=(i->>'id')::int and p.active and p.price>0)
 select coalesce(sum(price*q),0),coalesce(jsonb_agg(jsonb_build_object('id',id,'title',trim(kind||' '||title),'qty',q,'price',price)),'[]'::jsonb) into sub,lines from l;
 if sub=0 then raise exception 'empty order'; end if;
 code:=upper(trim(coalesce(promo_code,'')));
 pct:=check_promo(code); tot:=round(sub*(100-pct)/100.0);
 insert into orders(user_id,customer_name,phone,items,promo,discount,total,payment,address) values(auth.uid(),pr.name,pr.phone,lines,nullif(code,''),pct,tot,pay,left(coalesce(addr,''),500)) returning id into oid;
 return jsonb_build_object('id',oid,'total',tot);
end $$;

insert into storage.buckets(id,name,public) values('products','products',true) on conflict do nothing;
create policy "img admin write" on storage.objects for all using(bucket_id='products' and public.is_admin()) with check(bucket_id='products' and public.is_admin());
insert into promos values('LUMA25',20,true);
