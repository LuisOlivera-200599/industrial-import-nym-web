# industrial-import-nym-web

Sitio web corporativo y catalogo administrable de INDUSTRIAL IMPORT COMPANY S.R.L..

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
- `js/admin-components.js`: componentes HTML reutilizables del panel administrativo.
- `js/admin-products*.js`: formularios, render, guardado y eliminacion de productos.
- `js/admin-brands*.js`: formularios, render, guardado y eliminacion de marcas.
- `js/admin-taxonomy*.js`: categorias y subcategorias.
- `js/admin-company.js`: datos de empresa.
- `js/admin-events-*.js`, `js/admin-session.js`, `js/admin-init.js`: eventos, sesion y arranque del panel.
- `robots.txt`, `sitemap.xml`, `404.html`: SEO tecnico y pagina de error.
- `producto.html`, `js/product-detail.js`: detalle individual de producto.
- `package.json`, `scripts/`: validacion y optimizacion reproducible de assets.
- `producto/`: paginas estaticas generadas para URLs limpias de productos.

## Admin: build

El admin se mantiene en modulos fuente `js/admin-*.js`.
`js/admin-app.js` es un archivo generado y es el unico bundle que carga `admin.html`.

```bash
npm run build:admin
```

`npm run check` ejecuta este build antes de validar, para evitar que el bundle quede desactualizado.

## Rendimiento

- El video principal del home usa `preload="none"` y solo se ofrece como fuente en pantallas mayores a 640px.
- En movil se muestra imagen fallback para evitar descargar el video hero.
- Las imagenes dinamicas del catalogo y marcas usan `loading="lazy"` y `decoding="async"`.
- Ejecuta `npm run optimize:assets` para regenerar WebP y el video optimizado.

## Validacion local

```bash
npm install
npm run check
npm run format:check
```

Usa `npm run format` para normalizar HTML, CSS, JS, JSON, Markdown y YAML antes de cambios grandes.
Usa `npm run generate:products` para regenerar las paginas limpias de productos y el sitemap desde Supabase.

## Admin: imagenes

- Productos: JPG, PNG o WebP hasta 4 MB.
- Logos de marcas: JPG, PNG o WebP hasta 2 MB.
- La validacion ocurre al seleccionar el archivo y antes de subirlo a Supabase Storage.

## Seguridad

La llave publica de Supabase puede vivir en frontend, pero la seguridad real debe estar en Row Level Security. Revisa `docs/supabase-rls.md` antes de publicar o cambiar tablas/buckets.

La migracion base de endurecimiento esta en `supabase/migrations/20260528120000_harden_public_rls.sql`.
