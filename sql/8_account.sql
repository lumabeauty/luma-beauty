-- Личный кабинет (account.html): клиент может изменить только своё имя.
-- Остальные поля профиля (кэшбэк, права админа, телефон) этой функцией не меняются.
create or replace function public.update_my_name(p_name text)
returns text language plpgsql security definer set search_path to 'pg_catalog', 'public' as $function$
declare
  v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 60 then
    raise exception 'invalid_name';
  end if;
  update public.profiles set name = v_name where id = auth.uid();
  return v_name;
end;
$function$;

revoke all on function public.update_my_name(text) from public, anon;
grant execute on function public.update_my_name(text) to authenticated;
