-- Заявки из формы «Заполните заявку» на странице «О нас» + уведомление в Telegram
create table if not exists public.partner_requests(
  id bigserial primary key,
  name text not null check (char_length(name) between 2 and 120),
  company text not null default '' check (char_length(company) <= 160),
  email text not null default '' check (char_length(email) <= 160),
  phone text not null check (char_length(phone) between 7 and 30),
  message text not null default '' check (char_length(message) <= 2000),
  status text not null default 'new' check (status in ('new','in_work','done','spam')),
  admin_note text not null default '',
  created_at timestamptz not null default now()
);
alter table public.partner_requests enable row level security;
create policy "partner requests insert" on public.partner_requests for insert to anon, authenticated
  with check (status = 'new' and admin_note = '');
create policy "partner requests admin" on public.partner_requests for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
grant insert on public.partner_requests to anon, authenticated;
grant usage, select on sequence public.partner_requests_id_seq to anon, authenticated;
-- Триггер шлёт заявку в Edge Function super-handler (type = 'partner'), та — в Telegram.
-- super-handler проверяет заголовок x-order-secret сам, поэтому развёрнут с verify_jwt = false.
