-- Описание товара (показывается на product.html во вкладке «Описание»)
alter table public.products add column if not exists description text not null default '';
