-- Migration 2: seller shop name, wilaya of residence, and a signup trigger
-- that never fails on bad metadata (the app validates; the database stays safe).

alter table public.profiles
  add column shop_name text
    check (shop_name is null or char_length(shop_name) between 2 and 80),
  add column wilaya_code smallint
    check (wilaya_code is null or wilaya_code between 1 and 99);

-- Users may edit these two columns on their own profile (role stays locked).
grant update (shop_name, wilaya_code) on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role public.user_role :=
    case when meta ->> 'role' = 'seller'
         then 'seller'::public.user_role
         else 'buyer'::public.user_role end;
  v_wilaya smallint;
  v_shop text;
  v_whatsapp text;
begin
  if (meta ->> 'wilaya_code') ~ '^[0-9]{1,2}$' then
    v_wilaya := (meta ->> 'wilaya_code')::smallint;
    if v_wilaya < 1 then
      v_wilaya := null;
    end if;
  end if;

  if v_role = 'seller'
     and char_length(btrim(coalesce(meta ->> 'shop_name', ''))) between 2 and 80 then
    v_shop := btrim(meta ->> 'shop_name');
  end if;

  if (meta ->> 'whatsapp_number') ~ '^\+?[0-9]{8,15}$' then
    v_whatsapp := meta ->> 'whatsapp_number';
  end if;

  insert into public.profiles (id, full_name, role, shop_name, wilaya_code, whatsapp_number)
  values (new.id, left(meta ->> 'full_name', 120), v_role, v_shop, v_wilaya, v_whatsapp);

  return new;
end;
$$;