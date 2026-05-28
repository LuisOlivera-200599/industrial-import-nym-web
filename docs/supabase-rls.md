# Supabase RLS checklist

Este proyecto usa Supabase desde frontend. Por eso, las tablas y buckets deben protegerse con Row Level Security. La regla general es: lectura publica solo para contenido activo, escritura solo para administradores autenticados.

La migracion propuesta esta en:

- `supabase/migrations/20260528120000_harden_public_rls.sql`

Antes de aplicarla, confirma que ya existen estas tablas y buckets. Despues de aplicarla, registra al primer administrador manualmente desde SQL Editor con el `id` del usuario de Supabase Auth:

```sql
insert into public.admin_users (user_id)
values ('00000000-0000-0000-0000-000000000000');
```

Reemplaza el UUID por el `auth.users.id` real del administrador.

## Tablas publicas de catalogo

Tablas esperadas:

- `products`
- `brands`
- `categories`
- `subcategories`
- `company_settings`

Politicas recomendadas:

- Permitir `select` publico solo cuando `is_active = true` en catalogo.
- Permitir `select` publico de `company_settings`, si no contiene datos privados.
- Permitir `insert`, `update` y `delete` solo a usuarios autenticados que sean administradores.
- Evitar que un usuario autenticado cualquiera pueda administrar catalogo si no pertenece al rol/lista admin.

## Leads de contacto

Tabla esperada:

- `contact_leads`

Politicas recomendadas:

- Permitir `insert` publico con campos limitados por constraints.
- No permitir `select`, `update` ni `delete` publico.
- Permitir lectura y gestion solo a administradores.

## Storage

Buckets esperados:

- `product-images`
- `brand-logos`

Politicas recomendadas:

- Permitir lectura publica de archivos.
- Permitir subida, actualizacion y eliminacion solo a administradores.
- Validar desde el panel tamano y tipo de archivo antes de subir.

## Pendiente tecnico

Definir una fuente clara para saber quien es admin. Opciones:

- Tabla `admin_users` con `user_id` relacionado a `auth.users.id`.
- Custom claim en JWT.
- Funcion SQL `is_admin()` usada por todas las politicas privadas.

Sin esta capa, el panel puede iniciar sesion, pero la seguridad queda incompleta.

## Pruebas recomendadas

- Sin iniciar sesion, confirmar que la web publica ve productos/marcas activos.
- Sin iniciar sesion, confirmar que no se pueden insertar, editar ni eliminar productos desde la API.
- Con un usuario autenticado no registrado en `admin_users`, confirmar que el panel no puede guardar cambios.
- Con un usuario en `admin_users`, confirmar que el panel puede gestionar catalogo, empresa y Storage.
