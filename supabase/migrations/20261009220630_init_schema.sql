-- =====================================================================
-- El Marché: initial schema (tables, security rules, search, storage)
-- =====================================================================

-- Extensions ----------------------------------------------------------
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- Enums ---------------------------------------------------------------
create type public.user_role as enum ('buyer', 'seller', 'admin');
create type public.listing_status as enum ('pending', 'approved', 'rejected');
create type public.event_type as enum ('view', 'favorite');

-- Helper functions ----------------------------------------------------
-- unaccent() is not "immutable", so we wrap it to use it in indexes.
create or replace function public.immutable_unaccent(input text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, input) $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles (extends Supabase auth.users) ------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.user_role not null default 'buyer',
  whatsapp_number text
    check (whatsapp_number is null or whatsapp_number ~ '^\+?[0-9]{8,15}$'),
  created_at timestamptz not null default now()
);

create or replace function public.is_seller()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('seller', 'admin')
  )
$$;

-- Create a profile automatically when someone signs up.
-- Only 'buyer' or 'seller' can be chosen at signup; 'admin' can never be self-assigned.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    case when new.raw_user_meta_data ->> 'role' = 'seller'
         then 'seller'::public.user_role
         else 'buyer'::public.user_role end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- categories ----------------------------------------------------------
create table public.categories (
  id smallint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  sort_order smallint not null
);

-- products ------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  category_id smallint not null references public.categories (id),
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 10 and 4000),
  price_dzd integer not null check (price_dzd > 0),
  wilaya_code smallint not null check (wilaya_code > 0),
  tags text[] not null default '{}',
  -- 'approved' by default for the MVP so new listings appear immediately.
  -- When the admin panel ships, change the default to 'pending'.
  status public.listing_status not null default 'approved',
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_tsv tsvector generated always as (
    to_tsvector('simple', public.immutable_unaccent(title || ' ' || description))
  ) stored
);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create index products_category_price_idx on public.products (category_id, price_dzd);
create index products_wilaya_idx on public.products (wilaya_code);
create index products_created_idx on public.products (created_at desc);
create index products_seller_idx on public.products (seller_id);
create index products_status_idx on public.products (status);
create index products_search_idx on public.products using gin (search_tsv);
create index products_title_trgm_idx on public.products
  using gin (public.immutable_unaccent(lower(title)) extensions.gin_trgm_ops);

-- product_images (3 to 5 per listing; the minimum of 3 is checked by the app)
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  position smallint not null check (position between 1 and 5),
  unique (product_id, position)
);

-- favorites (wishlist) ------------------------------------------------
create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- product_views (events feeding the recommendation engine) ------------
create table public.product_views (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  event_type public.event_type not null,
  created_at timestamptz not null default now()
);

create index product_views_user_idx on public.product_views (user_id, created_at desc);
create index product_views_product_idx on public.product_views (product_id);

-- Keep products.view_count up to date (powers "popularity").
create or replace function public.bump_view_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.event_type = 'view' then
    update public.products set view_count = view_count + 1 where id = new.product_id;
  end if;
  return new;
end;
$$;

create trigger product_views_bump
  after insert on public.product_views
  for each row execute function public.bump_view_count();

-- searches -------------------------------------------------------------
create table public.searches (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  query text not null check (char_length(query) between 1 and 200),
  created_at timestamptz not null default now()
);

create index searches_user_idx on public.searches (user_id, created_at desc);

-- recommendations_cache (written only by the server) -------------------
create table public.recommendations_cache (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  product_ids uuid[] not null,
  strategy text not null check (strategy in ('content', 'fallback')),
  computed_at timestamptz not null default now()
);

-- =====================================================================
-- Row Level Security: who can see and change what
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.favorites enable row level security;
alter table public.product_views enable row level security;
alter table public.searches enable row level security;
alter table public.recommendations_cache enable row level security;

-- profiles: you see your own row, and sellers are public (buyers need
-- the seller's name and WhatsApp number to make contact).
create policy "profiles_select" on public.profiles
  for select using (id = (select auth.uid()) or role = 'seller');

-- Users can only edit their name and WhatsApp number, never their role.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, whatsapp_number) on public.profiles to authenticated;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- categories: public read; changes are made by admins through the server.
create policy "categories_select" on public.categories
  for select using (true);

-- products
create policy "products_select" on public.products
  for select using (status = 'approved' or seller_id = (select auth.uid()));

-- Sellers can set only these columns; status, view_count, etc. stay server-controlled.
revoke insert, update on public.products from anon, authenticated;
revoke delete on public.products from anon;
grant insert (seller_id, category_id, title, description, price_dzd, wilaya_code, tags)
  on public.products to authenticated;
grant update (category_id, title, description, price_dzd, wilaya_code, tags)
  on public.products to authenticated;

create policy "products_insert_seller" on public.products
  for insert to authenticated
  with check (seller_id = (select auth.uid()) and public.is_seller());
create policy "products_update_own" on public.products
  for update to authenticated
  using (seller_id = (select auth.uid()))
  with check (seller_id = (select auth.uid()));
create policy "products_delete_own" on public.products
  for delete to authenticated
  using (seller_id = (select auth.uid()));

-- product_images: follow the visibility of the product they belong to.
create policy "product_images_select" on public.product_images
  for select using (
    exists (select 1 from public.products p where p.id = product_images.product_id)
  );
create policy "product_images_insert_own" on public.product_images
  for insert to authenticated
  with check (exists (
    select 1 from public.products p
    where p.id = product_images.product_id and p.seller_id = (select auth.uid())
  ));
create policy "product_images_update_own" on public.product_images
  for update to authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_images.product_id and p.seller_id = (select auth.uid())
  ));
create policy "product_images_delete_own" on public.product_images
  for delete to authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_images.product_id and p.seller_id = (select auth.uid())
  ));

-- favorites, product_views, searches: private to their owner.
create policy "favorites_select_own" on public.favorites
  for select to authenticated using (user_id = (select auth.uid()));
create policy "favorites_insert_own" on public.favorites
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "favorites_delete_own" on public.favorites
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "product_views_select_own" on public.product_views
  for select to authenticated using (user_id = (select auth.uid()));
create policy "product_views_insert_own" on public.product_views
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "searches_select_own" on public.searches
  for select to authenticated using (user_id = (select auth.uid()));
create policy "searches_insert_own" on public.searches
  for insert to authenticated with check (user_id = (select auth.uid()));

-- recommendations_cache: users can read their own; only the server writes.
create policy "recommendations_select_own" on public.recommendations_cache
  for select to authenticated using (user_id = (select auth.uid()));

-- =====================================================================
-- Storage: product images (public read, owner-only write)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images', 'product-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "product_images_upload_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "product_images_update_own_folder" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "product_images_delete_own_folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- =====================================================================
-- Seed: the 10 MVP categories
-- =====================================================================
insert into public.categories (slug, name, sort_order) values
  ('mode-accessoires', 'Mode & Accessoires', 1),
  ('beaute-soins', 'Beauté & Soins', 2),
  ('maison-deco', 'Maison & Déco', 3),
  ('electronique', 'Électronique', 4),
  ('artisanat', 'Artisanat', 5),
  ('sports-loisirs', 'Sports & Loisirs', 6),
  ('enfants-bebe', 'Enfants & Bébé', 7),
  ('alimentation', 'Alimentation', 8),
  ('bijoux', 'Bijoux', 9),
  ('autre', 'Autre', 10)
on conflict (slug) do nothing;