-- Fix ambiguous user_id reference in admin user helper.

create or replace function public.add_admin_user_by_email(admin_email text)
returns table (
  user_id uuid,
  email text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede agregar usuarios admin.';
  end if;

  select auth_user.id
  into target_user_id
  from auth.users as auth_user
  where lower(auth_user.email) = lower(trim(admin_email))
  limit 1;

  if target_user_id is null then
    raise exception 'No existe un usuario registrado con el correo %. Primero debe crear cuenta o iniciar sesion una vez.', admin_email;
  end if;

  insert into public.admin_users (user_id)
  values (target_user_id)
  on conflict (user_id) do nothing;

  return query
  select
    admin_row.user_id,
    auth_user.email::text,
    admin_row.created_at
  from public.admin_users as admin_row
  left join auth.users as auth_user on auth_user.id = admin_row.user_id
  where admin_row.user_id = target_user_id;
end;
$$;

grant execute on function public.add_admin_user_by_email(text) to authenticated;
