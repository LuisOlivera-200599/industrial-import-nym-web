-- Stock movement history for admin inventory tracking.
-- Safe to run more than once.

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type text not null check (movement_type in ('entrada', 'salida', 'ajuste')),
  quantity_delta integer not null,
  previous_quantity integer,
  new_quantity integer not null,
  note text,
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_product_id_created_at_idx
on public.stock_movements (product_id, created_at desc);

create index if not exists stock_movements_created_at_idx
on public.stock_movements (created_at desc);

alter table public.stock_movements enable row level security;

drop policy if exists "Admins can manage stock movements" on public.stock_movements;
create policy "Admins can manage stock movements"
on public.stock_movements
for all
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
  )
);
