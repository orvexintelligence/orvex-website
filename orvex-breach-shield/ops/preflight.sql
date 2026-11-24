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
  if target is null or (select prorettype from pg_proc where oid=target)<>'void'::regtype then
    raise exception 'Expected guard_refresh_user_plan(uuid) returns void';
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
