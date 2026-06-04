-- Add LEGRAND products for subcategory "Accesorios para contactores".
-- Only product names/codes are added; images can be updated later from the admin.

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
  where lower(brand.name) = 'legrand'
    and lower(subcategory.name) = 'accesorios para contactores'
  limit 1
),
new_products(name) as (
  values
    ('407672'),
    ('407675'),
    ('027051'),
    ('422265'),
    ('027002'),
    ('407668'),
    ('420081'),
    ('407860'),
    ('027066'),
    ('027061'),
    ('408094'),
    ('407804'),
    ('027062'),
    ('027056'),
    ('409280'),
    ('409203'),
    ('407806'),
    ('408095'),
    ('409260'),
    ('408640'),
    ('027058'),
    ('407934'),
    ('409342'),
    ('409452'),
    ('408093'),
    ('408092'),
    ('402024'),
    ('419874'),
    ('411504'),
    ('027026'),
    ('027225'),
    ('027028'),
    ('420239'),
    ('420002'),
    ('419888'),
    ('411590'),
    ('420007'),
    ('420047'),
    ('027022'),
    ('027024'),
    ('027257'),
    ('419873'),
    ('422682'),
    ('411704'),
    ('411554'),
    ('402025'),
    ('419876'),
    ('420095'),
    ('422001'),
    ('412283'),
    ('419887'),
    ('1051003'),
    ('420238'),
    ('419885'),
    ('027023'),
    ('420083'),
    ('420043'),
    ('420085'),
    ('420004')
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
