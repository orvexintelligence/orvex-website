-- Metadata only. Store the output privately: function definitions may contain
-- implementation details. This is NOT a data backup or restore script.
select jsonb_pretty(jsonb_build_object(
  'server_version',current_setting('server_version'),
  'functions',(select jsonb_agg(jsonb_build_object('signature',p.oid::regprocedure::text,
    'definition',pg_get_functiondef(p.oid),'acl',p.proacl,'config',p.proconfig))
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'guard_%'),
  'constraints',(select jsonb_agg(jsonb_build_object('table',c.conrelid::regclass::text,'definition',pg_get_constraintdef(c.oid)))
    from pg_constraint c where c.conrelid in(select oid from pg_class where relname like 'guard_%')),
  'policies',(select jsonb_agg(to_jsonb(p)) from pg_policies p where schemaname='public' and tablename like 'guard_%'),
  'rls',(select jsonb_agg(jsonb_build_object('table',relname,'enabled',relrowsecurity,'forced',relforcerowsecurity))
    from pg_class where relnamespace='public'::regnamespace and relname like 'guard_%' and relkind='r'),
  'triggers',(select jsonb_agg(pg_get_triggerdef(t.oid)) from pg_trigger t join pg_class c on c.oid=t.tgrelid
    where c.relnamespace='public'::regnamespace and c.relname like 'guard_%' and not t.tgisinternal),
  'grants',(select jsonb_agg(to_jsonb(g)) from information_schema.role_table_grants g where table_schema='public' and table_name like 'guard_%')
));
