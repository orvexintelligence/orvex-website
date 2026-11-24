-- GENERATED. Run only after verified encrypted backup and restore rehearsal.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
SELECT pg_advisory_xact_lock(hashtextextended('orvex-guard-migration-20261123',0));
-- Catalog-only checks. No customer rows are read and no RPC is invoked.
do $preflight$
declare item record; target oid; typ text; nullable boolean;
begin
  for item in select * from (values
    ('public','guard_profiles','auth_user_id','uuid'),
    ('public','guard_profiles','plan','text'),
    ('public','guard_stripe_subscriptions','stripe_subscription_id','text'),
    ('public','guard_stripe_subscriptions','stripe_customer_id','text'),
    ('public','guard_stripe_subscriptions','stripe_price_id','text'),
    ('public','guard_stripe_subscriptions','auth_user_id','uuid'),
    ('public','guard_stripe_subscriptions','plan','text'),
    ('public','guard_stripe_subscriptions','status','text'),
    ('public','guard_stripe_subscriptions','paid_through','timestamp with time zone'),
    ('public','guard_stripe_subscriptions','last_paid_invoice_id','text'),
    ('public','guard_stripe_subscriptions','updated_at','timestamp with time zone'),
    ('auth','users','id','uuid'),('auth','users','email','character varying'),
    ('auth','users','email_confirmed_at','timestamp with time zone'),
    ('auth','users','deleted_at','timestamp with time zone')
  ) as expected(schema_name,table_name,column_name,type_name) loop
    select format_type(a.atttypid,null),not a.attnotnull into typ,nullable
    from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace
    where n.nspname=item.schema_name and c.relname=item.table_name and a.attname=item.column_name and not a.attisdropped;
    if typ is null or (typ<>item.type_name and not (item.column_name='email' and typ='text')) then
      raise exception 'Missing or incompatible column %.%.%',item.schema_name,item.table_name,item.column_name;
    end if;
    if item.table_name='guard_stripe_subscriptions' and item.column_name='auth_user_id' and not nullable then
      raise exception 'Unclaimed purchases require nullable subscription auth_user_id';
    end if;
  end loop;
  if not exists(select 1 from pg_index i join pg_attribute a on a.attrelid=i.indrelid and a.attnum=i.indkey[0]
    where i.indrelid='public.guard_profiles'::regclass and a.attname='auth_user_id'
      and i.indisunique and i.indisvalid and i.indnkeyatts=1
      and (i.indpred is null or pg_get_expr(i.indpred,i.indrelid)='(auth_user_id IS NOT NULL)')) then
    raise exception 'A unique auth_user_id index on guard_profiles is required';
  end if;
  if not (select relrowsecurity from pg_class where oid='public.guard_profiles'::regclass) then
    raise exception 'guard_profiles RLS must be enabled';
  end if;
  target:=to_regprocedure('public.guard_refresh_user_plan(uuid)');
  -- Both contracts are compatible: callers use PERFORM and discard the result.
  -- The existing operational function returns text; do not replace it with void.
  if target is null or (select prorettype from pg_proc where oid=target) not in ('text'::regtype,'void'::regtype) then
    raise exception 'Expected guard_refresh_user_plan(uuid) returns text or void';
  end if;
  if has_function_privilege('anon',target,'EXECUTE') or has_function_privilege('authenticated',target,'EXECUTE') then
    raise exception 'Plan refresh must not be directly callable by browser roles';
  end if;
  if not exists(select 1 from pg_proc p,unnest(p.proconfig) setting where p.oid=target and setting like 'search_path=%') then
    raise exception 'Review guard_refresh_user_plan search_path before invoking it from secure wrappers';
  end if;
  if to_regclass('public.guard_direct_purchases') is not null or to_regclass('public.guard_request_windows') is not null or
     to_regprocedure('public.guard_sync_paid_invoice(text,text,text,text,timestamptz,text)') is not null then
    raise exception 'New objects already exist: inspect migration state, do not overwrite or reapply';
  end if;
end $preflight$;

-- 202611230001_direct_purchases.sql; SHA256 6558ccfd026a3c7387e39b11c2f8f49e84a779d98485bf8866f926cadd32f74d
-- Additive migration for the existing Guard database. Run inside a transaction.
-- Existing guard_profiles / guard_stripe_subscriptions and lifecycle RPCs are prerequisites.

create table public.guard_direct_purchases (
  stripe_checkout_session_id text primary key,
  stripe_subscription_id text not null unique references public.guard_stripe_subscriptions(stripe_subscription_id),
  checkout_email text not null,
  claimed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);
create index guard_direct_purchases_unclaimed_email on public.guard_direct_purchases(checkout_email)
  where claimed_by is null;
alter table public.guard_direct_purchases enable row level security;
revoke all on public.guard_direct_purchases from public, anon, authenticated;
grant all on public.guard_direct_purchases to service_role;

create function public.guard_record_direct_purchase(
  p_session_id text, p_subscription_id text, p_customer_id text,
  p_price_id text, p_plan text, p_checkout_email text
) returns boolean language plpgsql security definer set search_path = '' as $$
declare existing public.guard_stripe_subscriptions; purchase public.guard_direct_purchases;
begin
  if p_plan is null or p_plan not in ('premium','small_b2b') or p_checkout_email is null or
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
revoke all on public.guard_request_windows from public, anon, authenticated;
grant all on public.guard_request_windows to service_role;
create function public.guard_take_request(p_key text,p_limit integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n integer; bucket timestamptz := date_trunc('minute',now());
begin
  if p_limit is null or p_key is null or p_limit < 1 or p_limit > 300 or p_key not like 'guest:%' or length(p_key)>100 then
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

-- 202611230002_invoice_sync.sql; SHA256 68c93993ebe8447a80c9fd922255115a9a8bb4bc0a392ba1c07b46ca693309a4

create function public.guard_sync_paid_invoice(p_subscription_id text,p_customer_id text,
 p_price_id text,p_invoice_id text,p_paid_through timestamptz,p_status text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare sub public.guard_stripe_subscriptions;
begin
  if p_status is null or p_status not in ('active','past_due') or p_paid_through is null or p_invoice_id is null then raise exception 'Invalid invoice'; end if;
  select * into sub from public.guard_stripe_subscriptions where stripe_subscription_id=p_subscription_id for update;
  if not found or sub.stripe_customer_id is distinct from p_customer_id or sub.stripe_price_id is distinct from p_price_id then
    raise exception 'Invoice mismatch';
  end if;
  -- A concurrently processed cancellation must never be reversed by an old checkout.
  if sub.status='canceled' then return true; end if;
  update public.guard_stripe_subscriptions set status=p_status,
    paid_through=greatest(paid_through,p_paid_through),
    last_paid_invoice_id=case when paid_through is null or p_paid_through >= paid_through then p_invoice_id else last_paid_invoice_id end,
    updated_at=now() where stripe_subscription_id=p_subscription_id;
  if sub.auth_user_id is not null then perform public.guard_refresh_user_plan(sub.auth_user_id); end if;
  return true;
end $$;
revoke all on function public.guard_sync_paid_invoice(text,text,text,text,timestamptz,text) from public,anon,authenticated;
grant execute on function public.guard_sync_paid_invoice(text,text,text,text,timestamptz,text) to service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
