-- Ensure the React admin can read/write stock movements and audit history.
-- Safe to run more than once.

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

alter table public.stock_movements enable row level security;
alter table public.admin_audit_log enable row level security;

grant select, insert, update, delete on public.stock_movements to authenticated;
grant select, insert, update, delete on public.admin_audit_log to authenticated;

drop policy if exists "Admins can manage stock movements" on public.stock_movements;
create policy "Admins can manage stock movements"
on public.stock_movements
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read admin audit log" on public.admin_audit_log;
create policy "Admins can read admin audit log"
on public.admin_audit_log
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can create admin audit log" on public.admin_audit_log;
create policy "Admins can create admin audit log"
on public.admin_audit_log
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update admin audit log" on public.admin_audit_log;
create policy "Admins can update admin audit log"
on public.admin_audit_log
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete admin audit log" on public.admin_audit_log;
create policy "Admins can delete admin audit log"
on public.admin_audit_log
for delete
to authenticated
using (public.is_admin());
