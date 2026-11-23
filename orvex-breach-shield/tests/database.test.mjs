import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

// Contract fixture for pre-existing tables, not a dump of the operational database.
const baseline = `
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
`
test('PostgreSQL: paid purchase claim, isolation, retries, ownership and rate limits',async()=>{
  const db=new PGlite()
  try {
    await db.exec(baseline)
    await db.exec(await readFile(new URL('../supabase/migrations/202611230001_direct_purchases.sql',import.meta.url),'utf8'))
    await db.exec(await readFile(new URL('../supabase/migrations/202611230002_invoice_sync.sql',import.meta.url),'utf8'))
    const record=()=>db.query("select guard_record_direct_purchase('cs_1','sub_1','cus_1','price_1','premium','buyer@example.com')")
    await record();await record()
    assert.equal((await db.query('select count(*)::int as n from guard_direct_purchases')).rows[0].n,1)
    await assert.rejects(db.query("select guard_record_direct_purchase('cs_1','sub_1','cus_1','price_1','premium','attacker@example.com')"))
    const claim=id=>db.query('select guard_claim_direct_purchases($1) as n',[id])
    await assert.rejects(claim('33333333-3333-4333-8333-333333333333'))
    assert.equal((await claim('22222222-2222-4222-8222-222222222222')).rows[0].n,0)
    assert.equal((await claim('11111111-1111-4111-8111-111111111111')).rows[0].n,1)
    assert.equal((await db.query("select plan from guard_profiles where auth_user_id='11111111-1111-4111-8111-111111111111'")).rows[0].plan,'free')
    await db.exec("update guard_stripe_subscriptions set status='active',paid_through=now()+interval '1 month'")
    await claim('11111111-1111-4111-8111-111111111111')
    assert.equal((await db.query("select plan from guard_profiles where auth_user_id='11111111-1111-4111-8111-111111111111'")).rows[0].plan,'premium')
    // Email reuse never transfers an already-claimed purchase.
    await db.exec("update auth.users set email='buyer@example.com' where id='22222222-2222-4222-8222-222222222222'")
    assert.equal((await claim('22222222-2222-4222-8222-222222222222')).rows[0].n,0)
    for(let i=0;i<3;i++) assert.equal((await db.query("select guard_take_request('guest:fixture',2) as allowed")).rows[0].allowed,i<2)
    await db.exec("update guard_request_windows set window_start=now()-interval '2 minutes'")
    assert.equal((await db.query("select guard_take_request('guest:fixture',2) as allowed")).rows[0].allowed,true)
    await db.query("select guard_sync_paid_invoice('sub_1','cus_1','price_1','in_new','2099-01-01','active')")
    await db.query("select guard_sync_paid_invoice('sub_1','cus_1','price_1','in_old','2098-01-01','active')")
    assert.equal((await db.query("select last_paid_invoice_id from guard_stripe_subscriptions")).rows[0].last_paid_invoice_id,'in_new')
    await db.exec("update guard_stripe_subscriptions set status='canceled',paid_through=null")
    await db.query("select guard_sync_paid_invoice('sub_1','cus_1','price_1','in_retry','2099-01-01','active')")
    assert.equal((await db.query("select status from guard_stripe_subscriptions")).rows[0].status,'canceled')
    await db.exec('set role authenticated')
    await assert.rejects(claim('22222222-2222-4222-8222-222222222222'))
    await assert.rejects(record())
    await assert.rejects(db.query('select * from guard_direct_purchases'))
  } finally {await db.close()}
})
