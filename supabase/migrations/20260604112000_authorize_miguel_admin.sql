-- Authorize the second admin account from the panel if the Auth user already exists.

insert into public.admin_users (user_id)
select auth_user.id
from auth.users as auth_user
where lower(auth_user.email) = lower('miguel.maot@hotmail.com')
on conflict (user_id) do nothing;
