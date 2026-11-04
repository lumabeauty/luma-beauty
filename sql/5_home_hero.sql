-- Editable homepage hero slider; keeps the current five images as defaults.
create table if not exists public.home_hero (
 id integer primary key check (id=1),
 photos text[] not null default '{}',
 updated_at timestamptz not null default now()
);
alter table public.home_hero enable row level security;
drop policy if exists "Public can view homepage hero" on public.home_hero;
create policy "Public can view homepage hero" on public.home_hero for select using (true);
drop policy if exists "Admins manage homepage hero" on public.home_hero;
create policy "Admins manage homepage hero" on public.home_hero for all
using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin=true))
with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin=true));
