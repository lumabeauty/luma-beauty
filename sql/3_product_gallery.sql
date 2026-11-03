-- Luma Beauty: gallery support for product photos
-- Safe to run once in Supabase SQL Editor.
alter table public.products
  add column if not exists gallery jsonb not null default '[]'::jsonb;

comment on column public.products.gallery is
  'Additional product photo URLs; main photo remains in products.image. Maximum four additional photos per product.';
