# industrial-import-nym-web

Sitio web corporativo y catalogo administrable de Industrial Import NYM.

## Estructura

- `index.html`, `productos.html`, `marcas.html`, `clientes.html`, `nosotros.html`, `contacto.html`: paginas publicas.
- `admin-login.html`, `admin.html`: acceso y panel administrativo conectado a Supabase.
- `css/style.css`: estilos globales compartidos.
- `js/supabase-config.js`: cliente Supabase publico.
- `js/site-utils.js`: utilidades compartidas de sitio, empresa y WhatsApp.
- `js/company-settings.js`: carga datos de empresa desde Supabase y los aplica en la web.
- `js/catalog.js`: catalogo publico de productos, filtros y paginacion.
- `js/brands.js`: catalogo publico de marcas y filtros.
- `js/admin-core.js`: estado, referencias DOM y helpers compartidos del panel.
- `js/admin-products*.js`: formularios, render, guardado y eliminacion de productos.
- `js/admin-brands*.js`: formularios, render, guardado y eliminacion de marcas.
- `js/admin-taxonomy*.js`: categorias y subcategorias.
- `js/admin-company.js`: datos de empresa.
- `js/admin-events-*.js`, `js/admin-session.js`, `js/admin-init.js`: eventos, sesion y arranque del panel.

## Admin: imagenes

- Productos: JPG, PNG o WebP hasta 4 MB.
- Logos de marcas: JPG, PNG o WebP hasta 2 MB.
- La validacion ocurre al seleccionar el archivo y antes de subirlo a Supabase Storage.

## Seguridad

La llave publica de Supabase puede vivir en frontend, pero la seguridad real debe estar en Row Level Security. Revisa `docs/supabase-rls.md` antes de publicar o cambiar tablas/buckets.

La migracion base de endurecimiento esta en `supabase/migrations/20260528120000_harden_public_rls.sql`.
