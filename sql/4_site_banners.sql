-- Luma Beauty: editable homepage story gallery (up to five images)
create table if not exists public.site_banners (
 id integer primary key check (id=1),
 title text not null default 'Время для себя',
 subtitle text not null default 'Создайте свой ежедневный ритуал красоты',
 photos text[] not null default '{}',
 updated_at timestamptz not null default now()
);
alter table public.site_banners enable row level security;
drop policy if exists "Public can view homepage banner" on public.site_banners;
create policy "Public can view homepage banner" on public.site_banners for select using (true);
drop policy if exists "Admins manage homepage banner" on public.site_banners;
create policy "Admins manage homepage banner" on public.site_banners for all
using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin=true))
with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin=true));
