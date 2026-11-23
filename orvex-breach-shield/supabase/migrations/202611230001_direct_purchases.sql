-- Additive migration for the existing Guard database. Run inside a transaction.
-- Existing guard_profiles / guard_stripe_subscriptions and lifecycle RPCs are prerequisites.
begin;
create table public.guard_direct_purchases (
  stripe_checkout_session_id text primary key,
  stripe_subscription_id text not null unique references public.guard_stripe_subscriptions(stripe_subscription_id),
  checkout_email text not null,
  claimed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);
alter table public.guard_direct_purchases enable row level security;
revoke all on public.guard_direct_purchases from anon, authenticated;
grant all on public.guard_direct_purchases to service_role;

create function public.guard_record_direct_purchase(
  p_session_id text, p_subscription_id text, p_customer_id text,
  p_price_id text, p_plan text, p_checkout_email text
) returns boolean language plpgsql security definer set search_path = '' as $$
declare existing public.guard_stripe_subscriptions; purchase public.guard_direct_purchases;
begin
  if p_plan not in ('premium','small_b2b') or p_checkout_email is null or
     length(p_checkout_email) > 254 or position('@' in p_checkout_email) < 2 then
    raise exception 'Invalid purchase';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_subscription_id, 0));
  select * into existing from public.guard_stripe_subscriptions where stripe_subscription_id=p_subscription_id for update;
  if found and (existing.stripe_customer_id is distinct from p_customer_id or
      existing.stripe_price_id is distinct from p_price_id or existing.plan is distinct from p_plan) then
    raise exception 'Subscription mismatch';
  end if;
  insert into public.guard_stripe_subscriptions(stripe_subscription_id,stripe_customer_id,stripe_price_id,plan,status)
    values(p_subscription_id,p_customer_id,p_price_id,p_plan,'pending_verification')
    on conflict (stripe_subscription_id) do nothing;
  insert into public.guard_direct_purchases(stripe_checkout_session_id,stripe_subscription_id,checkout_email)
    values(p_session_id,p_subscription_id,lower(trim(p_checkout_email))) on conflict do nothing;
  select * into purchase from public.guard_direct_purchases where stripe_checkout_session_id=p_session_id;
  if not found or purchase.stripe_subscription_id is distinct from p_subscription_id or
     purchase.checkout_email is distinct from lower(trim(p_checkout_email)) then
    raise exception 'Purchase mismatch';
  end if;
  return true;
end $$;

create function public.guard_claim_direct_purchases(p_user_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare verified_email text; purchase record; linked integer := 0; owner_id uuid;
begin
  -- Read verified identity from Auth, never from a request body or JWT email claim.
  select lower(trim(email)) into verified_email from auth.users
    where id=p_user_id and email_confirmed_at is not null and deleted_at is null for share;
  if verified_email is null then raise exception 'Verified identity required'; end if;
  -- Serialize account claims and plan refresh for users with multiple subscriptions.
  perform 1 from public.guard_profiles where auth_user_id=p_user_id for update;
  if not found then return 0; end if;
  for purchase in select * from public.guard_direct_purchases
    where checkout_email=verified_email and claimed_by is null order by stripe_subscription_id for update loop
    select auth_user_id into owner_id from public.guard_stripe_subscriptions
      where stripe_subscription_id=purchase.stripe_subscription_id for update;
    if owner_id is not null and owner_id <> p_user_id then continue; end if;
    update public.guard_stripe_subscriptions set auth_user_id=p_user_id, updated_at=now()
      where stripe_subscription_id=purchase.stripe_subscription_id;
    update public.guard_direct_purchases set claimed_by=p_user_id, claimed_at=now()
      where stripe_checkout_session_id=purchase.stripe_checkout_session_id;
    linked := linked + 1;
  end loop;
  perform public.guard_refresh_user_plan(p_user_id);
  return linked;
end $$;

create table public.guard_request_windows (
  principal_key text primary key, window_start timestamptz not null, request_count integer not null
);
alter table public.guard_request_windows enable row level security;
revoke all on public.guard_request_windows from anon, authenticated;
grant all on public.guard_request_windows to service_role;
create function public.guard_take_request(p_key text,p_limit integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n integer; bucket timestamptz := date_trunc('minute',now());
begin
  if p_limit < 1 or p_limit > 300 or p_key not like 'guest:%' or length(p_key)>100 then
    raise exception 'Invalid limit';
  end if;
  insert into public.guard_request_windows values(p_key,bucket,1)
  on conflict (principal_key) do update set
    window_start=bucket,
    request_count=case when public.guard_request_windows.window_start=bucket then public.guard_request_windows.request_count+1 else 1 end
  where public.guard_request_windows.window_start<>bucket or public.guard_request_windows.request_count<p_limit
  returning request_count into n;
  return n is not null;
end $$;
revoke all on function public.guard_record_direct_purchase(text,text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.guard_claim_direct_purchases(uuid) from public,anon,authenticated;
revoke all on function public.guard_take_request(text,integer) from public,anon,authenticated;
grant execute on function public.guard_record_direct_purchase(text,text,text,text,text,text) to service_role;
grant execute on function public.guard_claim_direct_purchases(uuid) to service_role;
grant execute on function public.guard_take_request(text,integer) to service_role;
commit;
