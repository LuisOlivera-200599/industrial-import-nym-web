-- Admin user management helpers for the React admin panel.
-- These functions let an existing admin list, add and remove admins by email
-- without exposing auth.users directly to the browser.

create or replace function public.list_admin_users()
returns table (
  user_id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    au.user_id,
    u.email::text,
    au.created_at,
    u.last_sign_in_at
  from public.admin_users au
  left join auth.users u on u.id = au.user_id
  where public.is_admin()
  order by au.created_at desc;
$$;

grant execute on function public.list_admin_users() to authenticated;

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
    raise exception 'Only admins can add admin users';
  end if;

  select id
  into target_user_id
  from auth.users
  where lower(email) = lower(trim(admin_email))
  limit 1;

  if target_user_id is null then
    raise exception 'No auth user found for email %', admin_email;
  end if;

  insert into public.admin_users (user_id)
  values (target_user_id)
  on conflict (user_id) do nothing;

  return query
  select au.user_id, u.email::text, au.created_at
  from public.admin_users au
  left join auth.users u on u.id = au.user_id
  where au.user_id = target_user_id;
end;
$$;

grant execute on function public.add_admin_user_by_email(text) to authenticated;

create or replace function public.remove_admin_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can remove admin users';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'You cannot remove your own admin access';
  end if;

  delete from public.admin_users
  where user_id = target_user_id;
end;
$$;

grant execute on function public.remove_admin_user(uuid) to authenticated;
