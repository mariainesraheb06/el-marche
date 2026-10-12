-- A restricted login for the recommender service.
-- It can read product and event data and write only recommendations_cache.
-- It has no password here: the password is set separately and never committed.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'recommender') then
    create role recommender login noinherit connection limit 5;
  end if;
end
$$;

alter role recommender set statement_timeout = '10s';

grant usage on schema public to recommender;
grant select on public.products, public.product_views, public.favorites, public.searches
  to recommender;
grant select, insert, update, delete on public.recommendations_cache to recommender;

-- RLS stays on for every table, so the role also needs explicit policies.
create policy "recommender_read_products" on public.products
  for select to recommender using (true);
create policy "recommender_read_views" on public.product_views
  for select to recommender using (true);
create policy "recommender_read_favorites" on public.favorites
  for select to recommender using (true);
create policy "recommender_read_searches" on public.searches
  for select to recommender using (true);
create policy "recommender_write_cache" on public.recommendations_cache
  for all to recommender using (true) with check (true);