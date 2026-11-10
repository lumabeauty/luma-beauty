-- Фото профиля в личном кабинете (account.html).
-- Хранилище avatars: публичное чтение, каждый клиент пишет только в свою папку <user_id>/.
alter table public.profiles add column if not exists avatar_url text not null default '';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars own read" on storage.objects;
drop policy if exists "avatars own insert" on storage.objects;
drop policy if exists "avatars own delete" on storage.objects;
create policy "avatars own read" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars own insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Сохраняет путь к своему фото (или '' чтобы удалить). Принимает только файл из своей папки.
create or replace function public.update_my_avatar(p_path text)
returns text language plpgsql security definer set search_path to 'pg_catalog', 'public' as $function$
declare
  v_uid uuid := auth.uid();
  v_path text := btrim(coalesce(p_path, ''));
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if v_path <> '' then
    if v_path not like v_uid::text || '/%' or v_path like '%..%' or char_length(v_path) > 200 then
      raise exception 'invalid_path';
    end if;
    if not exists (select 1 from storage.objects where bucket_id = 'avatars' and name = v_path) then
      raise exception 'file_not_found';
    end if;
  end if;
  update public.profiles set avatar_url = v_path where id = v_uid;
  return v_path;
end;
$function$;

revoke all on function public.update_my_avatar(text) from public, anon;
grant execute on function public.update_my_avatar(text) to authenticated;
