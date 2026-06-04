-- Add remaining SCHNEIDER ELECTRIC products grouped by catalog subcategory.
-- Only product names/codes are added; images can be updated later from the admin.

do $$
begin
  if not exists (select 1 from public.brands where lower(name) = 'schneider electric') then
    raise exception 'Brand SCHNEIDER ELECTRIC does not exist.';
  end if;
end $$;

with source_products(name, subcategory_name) as (
  values
    -- Selectores
    ('9001KS11FBH5', 'Selectores'),
    ('9001KS43FBH13', 'Selectores'),

    -- Telerruptores
    ('A9C20632', 'Telerruptores'),
    ('A9C30812', 'Telerruptores'),

    -- Toroides
    ('50441', 'Toroides')
),
missing_subcategories as (
  select distinct source_products.subcategory_name
  from source_products
  left join public.subcategories as subcategory
    on lower(subcategory.name) = lower(source_products.subcategory_name)
  where subcategory.id is null
),
targets as (
  select
    source_products.name,
    brand.id as brand_id,
    brand.name as brand_name,
    category.id as category_id,
    category.name as category_name,
    subcategory.id as subcategory_id,
    subcategory.name as subcategory_name
  from source_products
  join public.brands as brand on lower(brand.name) = 'schneider electric'
  join public.subcategories as subcategory on lower(subcategory.name) = lower(source_products.subcategory_name)
  join public.categories as category on category.id = subcategory.category_id
)
insert into public.products (
  name,
  brand_id,
  category_id,
  subcategory_id,
  brand,
  category,
  subcategory,
  image_url,
  stock_status,
  description,
  is_active
)
select
  targets.name,
  targets.brand_id,
  targets.category_id,
  targets.subcategory_id,
  targets.brand_name,
  targets.category_name,
  targets.subcategory_name,
  'imagenes/optimized/productos/productos-1.webp',
  'Disponible',
  '',
  true
from targets
where not exists (
  select 1
  from public.products as product
  where product.brand_id = targets.brand_id
    and product.subcategory_id = targets.subcategory_id
    and lower(product.name) = lower(targets.name)
)
and not exists (select 1 from missing_subcategories);
