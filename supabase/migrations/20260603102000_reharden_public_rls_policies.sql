-- Re-harden public/admin RLS policies after security smoke testing.
-- This drops any old permissive policies on the main public tables and recreates
-- the intended access model explicitly.

do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'admin_users',
        'products',
        'brands',
        'categories',
        'subcategories',
        'company_settings',
        'contact_leads',
        'stock_movements',
        'admin_audit_log'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end $$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users as au
    where au.user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.company_settings enable row level security;
alter table public.contact_leads enable row level security;
alter table public.stock_movements enable row level security;
alter table public.admin_audit_log enable row level security;

grant select on public.products, public.brands, public.categories, public.subcategories, public.company_settings to anon, authenticated;
grant insert, update, delete on public.products, public.brands, public.categories, public.subcategories, public.company_settings to authenticated;
grant insert on public.contact_leads to anon, authenticated;
grant select, update, delete on public.contact_leads to authenticated;
grant select on public.admin_users to authenticated;
grant select, insert, update, delete on public.stock_movements, public.admin_audit_log to authenticated;

create policy "Public can read active products"
on public.products
for select
to anon, authenticated
using (is_active = true);

create policy "Admins can manage products"
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read active brands"
on public.brands
for select
to anon, authenticated
using (is_active = true);

create policy "Admins can manage brands"
on public.brands
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read active categories"
on public.categories
for select
to anon, authenticated
using (is_active = true);

create policy "Admins can manage categories"
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read active subcategories"
on public.subcategories
for select
to anon, authenticated
using (is_active = true);

create policy "Admins can manage subcategories"
on public.subcategories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read company settings"
on public.company_settings
for select
to anon, authenticated
using (true);

create policy "Admins can manage company settings"
on public.company_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can create contact leads"
on public.contact_leads
for insert
to anon, authenticated
with check (
  origen = 'contacto_web'
  and coalesce(estado, 'nuevo') = 'nuevo'
);

create policy "Admins can manage contact leads"
on public.contact_leads
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can read admin users"
on public.admin_users
for select
to authenticated
using (public.is_admin());

create policy "Admins can manage stock movements"
on public.stock_movements
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage admin audit log"
on public.admin_audit_log
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
