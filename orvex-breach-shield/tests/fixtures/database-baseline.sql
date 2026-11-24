
create role anon; create role authenticated; create role service_role;
create schema auth;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,deleted_at timestamptz);
create table guard_profiles(auth_user_id uuid primary key,plan text);
create table guard_stripe_subscriptions(stripe_subscription_id text primary key,stripe_customer_id text not null,
 auth_user_id uuid,stripe_price_id text,plan text,status text not null,paid_through timestamptz,last_paid_invoice_id text,updated_at timestamptz default now());
create function guard_refresh_user_plan(p_auth_user_id uuid) returns void language sql set search_path = public as $$
 update guard_profiles set plan=coalesce((select plan from guard_stripe_subscriptions where auth_user_id=p_auth_user_id
 and status in ('active','past_due') and paid_through>now() order by case plan when 'small_b2b' then 0 else 1 end limit 1),'free')
 where auth_user_id=p_auth_user_id;
$$;
insert into auth.users values
 ('11111111-1111-4111-8111-111111111111','buyer@example.com',now(),null),
 ('22222222-2222-4222-8222-222222222222','other@example.com',now(),null),
 ('33333333-3333-4333-8333-333333333333','buyer@example.com',null,null);
insert into guard_profiles select id,'free' from auth.users;
alter table public.guard_profiles enable row level security;
revoke all on function public.guard_refresh_user_plan(uuid) from public,anon,authenticated;
grant execute on function public.guard_refresh_user_plan(uuid) to service_role;
