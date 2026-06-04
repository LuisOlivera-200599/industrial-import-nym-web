-- Add MENNEKES products for subcategory "Tomacorriente adosable".
-- Only product names/codes are added; images can be updated later from the admin.

do $$
begin
  if not exists (select 1 from public.brands where lower(name) = 'mennekes') then
    raise exception 'Brand MENNEKES does not exist.';
  end if;

  if not exists (select 1 from public.subcategories where lower(name) = 'tomacorriente adosable') then
    raise exception 'Subcategory Tomacorriente adosable does not exist.';
  end if;
end $$;

with target as (
  select
    brand.id as brand_id,
    brand.name as brand_name,
    category.id as category_id,
    category.name as category_name,
    subcategory.id as subcategory_id,
    subcategory.name as subcategory_name
  from public.brands as brand
  cross join public.subcategories as subcategory
  join public.categories as category on category.id = subcategory.category_id
  where lower(brand.name) = 'mennekes'
    and lower(subcategory.name) = 'tomacorriente adosable'
  limit 1
),
new_products(name) as (
  values
    ('27001'),
    ('9301'),
    ('9321'),
    ('27005'),
    ('27006'),
    ('9371'),
    ('1424'),
    ('1203'),
    ('9351'),
    ('10082'),
    ('27008'),
    ('9322'),
    ('10081'),
    ('9323'),
    ('136A'),
    ('128A'),
    ('3406'),
    ('5602306G'),
    ('27002'),
    ('132A'),
    ('5604A')
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
  new_products.name,
  target.brand_id,
  target.category_id,
  target.subcategory_id,
  target.brand_name,
  target.category_name,
  target.subcategory_name,
  'imagenes/optimized/productos/productos-1.webp',
  'Disponible',
  '',
  true
from new_products
cross join target
where not exists (
  select 1
  from public.products as product
  where product.brand_id = target.brand_id
    and lower(product.name) = lower(new_products.name)
);
