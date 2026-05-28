-- Harden public frontend access for Industrial Import NYM.
-- Run after the catalog/contact tables and Storage buckets already exist.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists "Admins can read admin users" on public.admin_users;
create policy "Admins can read admin users"
on public.admin_users
for select
to authenticated
using (public.is_admin());

-- Catalog tables: public can read active rows; admins can manage all rows.
alter table public.products enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active brands" on public.brands;
create policy "Public can read active brands"
on public.brands
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can manage brands" on public.brands;
create policy "Admins can manage brands"
on public.brands
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories"
on public.categories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active subcategories" on public.subcategories;
create policy "Public can read active subcategories"
on public.subcategories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can manage subcategories" on public.subcategories;
create policy "Admins can manage subcategories"
on public.subcategories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Company settings are public contact data, but only admins can edit them.
alter table public.company_settings enable row level security;

drop policy if exists "Public can read company settings" on public.company_settings;
create policy "Public can read company settings"
on public.company_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage company settings" on public.company_settings;
create policy "Admins can manage company settings"
on public.company_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Contact leads: visitors may create leads, admins may read/manage them.
alter table public.contact_leads enable row level security;

drop policy if exists "Public can create contact leads" on public.contact_leads;
create policy "Public can create contact leads"
on public.contact_leads
for insert
to anon, authenticated
with check (
  origen = 'contacto_web'
  and estado = 'nuevo'
);

drop policy if exists "Admins can manage contact leads" on public.contact_leads;
create policy "Admins can manage contact leads"
on public.contact_leads
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Storage: public reads images; admins write catalog assets.
drop policy if exists "Public can read catalog images" on storage.objects;
create policy "Public can read catalog images"
on storage.objects
for select
to anon, authenticated
using (bucket_id in ('product-images', 'brand-logos'));

drop policy if exists "Admins can upload catalog images" on storage.objects;
create policy "Admins can upload catalog images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('product-images', 'brand-logos')
  and public.is_admin()
);

drop policy if exists "Admins can update catalog images" on storage.objects;
create policy "Admins can update catalog images"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('product-images', 'brand-logos')
  and public.is_admin()
)
with check (
  bucket_id in ('product-images', 'brand-logos')
  and public.is_admin()
);

drop policy if exists "Admins can delete catalog images" on storage.objects;
create policy "Admins can delete catalog images"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('product-images', 'brand-logos')
  and public.is_admin()
);
