-- Add SCHNEIDER ELECTRIC products grouped by their catalog subcategory.
-- Only product names/codes are added; images can be updated later from the admin.

do $$
begin
  if not exists (select 1 from public.brands where lower(name) = 'schneider electric') then
    raise exception 'Brand SCHNEIDER ELECTRIC does not exist.';
  end if;
end $$;

with source_products(name, subcategory_name) as (
  values
    -- Contactores de fuerza
    ('LC1D09M7', 'Contactores de fuerza'),
    ('LC1D12M7', 'Contactores de fuerza'),
    ('LC1D18M7', 'Contactores de fuerza'),
    ('LC1D25M7', 'Contactores de fuerza'),
    ('LC1D32M7', 'Contactores de fuerza'),
    ('LC1D40AM7', 'Contactores de fuerza'),
    ('LC1D50AM7', 'Contactores de fuerza'),
    ('LC1D65AM7', 'Contactores de fuerza'),
    ('LC1D95M7', 'Contactores de fuerza'),
    ('LC1D115M7', 'Contactores de fuerza'),
    ('LC1D150M7', 'Contactores de fuerza'),
    ('LC1F150M7', 'Contactores de fuerza'),
    ('LC1F185R7', 'Contactores de fuerza'),
    ('LC1F265M7', 'Contactores de fuerza'),
    ('LE1D09M7', 'Contactores de fuerza'),

    -- Contactores para condensadores
    ('LC1DMKM7', 'Contactores para condensadores'),
    ('LC1DPKM7', 'Contactores para condensadores'),
    ('LC1DWK12M7', 'Contactores para condensadores'),

    -- Fuentes de alimentacion
    ('ABL8MEM24012', 'Fuentes de alimentación'),
    ('ABL8REM24030', 'Fuentes de alimentación'),
    ('ABL8RPS24030', 'Fuentes de alimentación'),

    -- Guardamotores magneto-termicos
    ('GV2ME08', 'Guardamotores magneto-térmicos'),
    ('GV2ME14', 'Guardamotores magneto-térmicos'),
    ('GV2ME32', 'Guardamotores magneto-térmicos'),
    ('GV2ME20', 'Guardamotores magneto-térmicos'),
    ('GV2P08', 'Guardamotores magneto-térmicos'),
    ('GV2P14', 'Guardamotores magneto-térmicos'),
    ('GV2P20', 'Guardamotores magneto-térmicos'),
    ('GV2P32', 'Guardamotores magneto-térmicos'),
    ('GV3P40', 'Guardamotores magneto-térmicos'),
    ('GV3P50', 'Guardamotores magneto-térmicos'),

    -- Interruptores automaticos fijo
    ('EZC100N3100', 'Interruptores automáticos fijo'),
    ('EZC250N3250', 'Interruptores automáticos fijo'),

    -- Interruptores automaticos para AC
    ('A9F74120', 'Interruptores automáticos para AC'),
    ('A9F74220', 'Interruptores automáticos para AC'),
    ('A9F74320', 'Interruptores automáticos para AC'),
    ('A9K24116', 'Interruptores automáticos para AC'),
    ('A9K24220', 'Interruptores automáticos para AC'),
    ('A9K24316', 'Interruptores automáticos para AC'),

    -- Interruptores automaticos regulables
    ('33478', 'Interruptores automáticos regulables'),

    -- Interruptores diferenciales
    ('A9R50225', 'Interruptores diferenciales'),
    ('A9R71225', 'Interruptores diferenciales'),
    ('A9R71425', 'Interruptores diferenciales'),
    ('A9R91225', 'Interruptores diferenciales'),
    ('A9R91440', 'Interruptores diferenciales'),

    -- Interruptores horarios
    ('15336', 'Interruptores horarios'),
    ('CCT15854', 'Interruptores horarios'),

    -- Limitadores de sobretensiones transitorias
    ('A9L40100', 'Limitadores de sobretensiones transitorias'),
    ('A9L40321', 'Limitadores de sobretensiones transitorias'),
    ('A9L40600', 'Limitadores de sobretensiones transitorias'),

    -- Medidor de energia KW-h
    ('A9MEM2155', 'Medidor de energía KW-h'),

    -- Minicontactores
    ('LC1K0910M7', 'Minicontactores'),

    -- Pilotos
    ('9001KP7LGG9', 'Pilotos'),
    ('9001KP7LRR9', 'Pilotos'),
    ('9001KP38LYA9', 'Pilotos'),

    -- Portafusibles
    ('DF101', 'Portafusibles'),

    -- Pulsadores
    ('9001KR1UH13', 'Pulsadores'),
    ('9001KR3UH13', 'Pulsadores'),

    -- Pulsadores de emergencia
    ('9001KR16H13', 'Pulsadores de emergencia'),

    -- Pulsadores luminosos
    ('9001K3L7LGGH13', 'Pulsadores luminosos'),
    ('9001K3L7LRRH13', 'Pulsadores luminosos'),
    ('9001K3L7LYH13', 'Pulsadores luminosos'),
    ('9001K3L25GH13', 'Pulsadores luminosos'),
    ('9001K3L38LYAH13', 'Pulsadores luminosos'),

    -- Reles diferenciales de toroide
    ('56173', 'Relés diferenciales de toroide'),
    ('56273', 'Relés diferenciales de toroide'),

    -- Reles termicos
    ('LR9F5367', 'Relés térmicos'),
    ('LR9F5369', 'Relés térmicos'),
    ('LRD08', 'Relés térmicos')
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
