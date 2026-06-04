-- Add MENNEKES products grouped by their catalog subcategory.
-- Only product names/codes are added; images can be updated later from the admin.

do $$
begin
  if not exists (select 1 from public.brands where lower(name) = 'mennekes') then
    raise exception 'Brand MENNEKES does not exist.';
  end if;

  if not exists (select 1 from public.subcategories where lower(name) = 'tomacorriente aéreo') then
    raise exception 'Subcategory Tomacorriente aéreo does not exist.';
  end if;

  if not exists (select 1 from public.subcategories where lower(name) = 'tomacorriente empotrable') then
    raise exception 'Subcategory Tomacorriente empotrable does not exist.';
  end if;

  if not exists (select 1 from public.subcategories where lower(name) = 'tomacorriente múltiples') then
    raise exception 'Subcategory Tomacorriente múltiples does not exist.';
  end if;
end $$;

with source_products(name, subcategory_name) as (
  values
    -- Tomacorriente aereo
    ('3402', 'Tomacorriente aéreo'),
    ('540', 'Tomacorriente aéreo'),
    ('3414', 'Tomacorriente aéreo'),
    ('14620', 'Tomacorriente aéreo'),
    ('525', 'Tomacorriente aéreo'),
    ('513', 'Tomacorriente aéreo'),
    ('543', 'Tomacorriente aéreo'),
    ('556', 'Tomacorriente aéreo'),
    ('300', 'Tomacorriente aéreo'),
    ('552', 'Tomacorriente aéreo'),
    ('3425', 'Tomacorriente aéreo'),
    ('527', 'Tomacorriente aéreo'),
    ('3408', 'Tomacorriente aéreo'),
    ('2177A', 'Tomacorriente aéreo'),
    ('545', 'Tomacorriente aéreo'),
    ('3416', 'Tomacorriente aéreo'),

    -- Tomacorriente empotrable
    ('1463', 'Tomacorriente empotrable'),
    ('1475', 'Tomacorriente empotrable'),
    ('1496', 'Tomacorriente empotrable'),
    ('1492', 'Tomacorriente empotrable'),
    ('11012', 'Tomacorriente empotrable'),
    ('11011', 'Tomacorriente empotrable'),
    ('1495', 'Tomacorriente empotrable'),
    ('1506', 'Tomacorriente empotrable'),
    ('1276', 'Tomacorriente empotrable'),
    ('1507', 'Tomacorriente empotrable'),
    ('1478', 'Tomacorriente empotrable'),
    ('209A', 'Tomacorriente empotrable'),
    ('11031', 'Tomacorriente empotrable'),
    ('206A', 'Tomacorriente empotrable'),
    ('1467', 'Tomacorriente empotrable'),
    ('2123A', 'Tomacorriente empotrable'),
    ('240A', 'Tomacorriente empotrable'),
    ('1366', 'Tomacorriente empotrable'),
    ('1466', 'Tomacorriente empotrable'),
    ('228A', 'Tomacorriente empotrable'),
    ('1399', 'Tomacorriente empotrable'),
    ('1502', 'Tomacorriente empotrable'),
    ('204A', 'Tomacorriente empotrable'),
    ('817M', 'Tomacorriente empotrable'),
    ('218A', 'Tomacorriente empotrable'),
    ('11032', 'Tomacorriente empotrable'),
    ('1473', 'Tomacorriente empotrable'),

    -- Tomacorriente multiples
    ('92895', 'Tomacorriente múltiples'),
    ('86946', 'Tomacorriente múltiples'),
    ('7638', 'Tomacorriente múltiples'),
    ('936532', 'Tomacorriente múltiples'),
    ('549', 'Tomacorriente múltiples')
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
  join public.brands as brand on lower(brand.name) = 'mennekes'
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
);
