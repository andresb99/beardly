create table if not exists public.shop_gallery_images (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (shop_id, storage_path)
);

create index if not exists shop_gallery_images_shop_sort_idx
  on public.shop_gallery_images (shop_id, sort_order, created_at);

alter table public.shop_gallery_images enable row level security;

drop policy if exists "public_read_shop_gallery_images" on public.shop_gallery_images;
create policy "public_read_shop_gallery_images"
on public.shop_gallery_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.shops sh
    where sh.id = shop_gallery_images.shop_id
      and sh.status = 'active'
  )
);

drop policy if exists "admin_manage_shop_gallery_images" on public.shop_gallery_images;
create policy "admin_manage_shop_gallery_images"
on public.shop_gallery_images
for all
to authenticated
using (public.is_admin(shop_id))
with check (public.is_admin(shop_id));

grant select on public.shop_gallery_images to anon, authenticated;
grant insert, update, delete on public.shop_gallery_images to authenticated;
