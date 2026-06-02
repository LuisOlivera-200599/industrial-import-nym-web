-- Admin audit trail for product, lead and stock changes.
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text,
  action text not null,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
on public.admin_audit_log (created_at desc);

create index if not exists admin_audit_log_entity_idx
on public.admin_audit_log (entity_type, entity_id, created_at desc);

alter table public.admin_audit_log enable row level security;

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
