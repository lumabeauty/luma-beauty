-- Регистрация по номеру телефона и паролю без SMS.
-- Сайт превращает номер в технический e-mail вида 998XXXXXXXXX@phone.lumabeauty.uz,
-- поэтому в Supabase должно быть выключено Authentication -> Sign In / Providers -> Email -> Confirm email.
-- Технический e-mail не сохраняется в profiles.email.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id,name,phone,email)
  values(new.id,
         new.raw_user_meta_data->>'name',
         new.raw_user_meta_data->>'phone',
         case when new.email ilike '%@phone.lumabeauty.uz' then null else new.email end);
  return new;
end $$;
