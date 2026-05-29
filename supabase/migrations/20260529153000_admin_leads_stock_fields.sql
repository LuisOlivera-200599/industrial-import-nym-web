-- Extra admin fields for lead follow-up and stock quantity tracking.
-- Safe to run more than once.

alter table public.products
  add column if not exists stock_quantity integer,
  add column if not exists low_stock_threshold integer;

alter table public.contact_leads
  add column if not exists admin_notes text;
