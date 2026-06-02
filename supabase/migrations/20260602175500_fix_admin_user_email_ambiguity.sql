-- Fix ambiguous email reference in admin user helper.

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

  select u.id
  into target_user_id
  from auth.users as u
  where lower(u.email) = lower(trim(admin_email))
  limit 1;

  if target_user_id is null then
    raise exception 'No existe un usuario registrado con el correo %. Primero debe crear cuenta o iniciar sesion una vez.', admin_email;
  end if;

  insert into public.admin_users (user_id)
  values (target_user_id)
  on conflict (user_id) do nothing;

  return query
  select au.user_id, u.email::text, au.created_at
  from public.admin_users as au
  left join auth.users as u on u.id = au.user_id
  where au.user_id = target_user_id;
end;
$$;

grant execute on function public.add_admin_user_by_email(text) to authenticated;
