import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
const baseline=await readFile(new URL('./fixtures/database-baseline.sql',import.meta.url),'utf8')
const bundle=await readFile(new URL('../ops/generated/apply.sql',import.meta.url),'utf8')
test('Migration bundle commits both migrations together and refuses repeat application',async()=>{
  const db=new PGlite()
  try {
    await db.exec(baseline);await db.exec(bundle)
    assert.ok((await db.query("select to_regprocedure('guard_sync_paid_invoice(text,text,text,text,timestamptz,text)') as fn")).rows[0].fn)
    await assert.rejects(db.exec(bundle),/already exist/);await db.exec('rollback')
    assert.ok((await db.query("select to_regclass('guard_direct_purchases') as t")).rows[0].t)
  } finally {await db.close()}
})
test('Failure in second migration rolls back first migration without changing baseline rows',async()=>{
  const db=new PGlite()
  try {
    await db.exec(baseline)
    await assert.rejects(db.exec(bundle.replace('create function public.guard_sync_paid_invoice','select 1/0;\ncreate function public.guard_sync_paid_invoice')),/division by zero/)
    await db.exec('rollback')
    assert.equal((await db.query("select to_regclass('guard_direct_purchases') as t")).rows[0].t,null)
    assert.equal((await db.query('select count(*)::int as n from guard_profiles')).rows[0].n,3)
  } finally {await db.close()}
})
test('Preflight blocks incompatible nullability, RLS or public plan-refresh execution',async()=>{
  const db=new PGlite()
  try {
    await db.exec(baseline)
    for(const [breakSql,restoreSql,reason] of [
      ['alter table guard_stripe_subscriptions alter auth_user_id set not null','alter table guard_stripe_subscriptions alter auth_user_id drop not null',/nullable/],
      ['alter table guard_profiles disable row level security','alter table guard_profiles enable row level security',/RLS/],
      ['grant execute on function guard_refresh_user_plan(uuid) to public','revoke execute on function guard_refresh_user_plan(uuid) from public',/browser roles/]
    ]) {
      await db.exec(breakSql);await assert.rejects(db.exec(bundle),reason);await db.exec('rollback');await db.exec(restoreSql)
      assert.equal((await db.query("select to_regclass('guard_direct_purchases') as t")).rows[0].t,null)
    }
  } finally {await db.close()}
})
test('Captured REST contract matches migration public-column requirements',async()=>{
  const audit=JSON.parse(await readFile(new URL('../ops/evidence/service-audit.json',import.meta.url),'utf8'))
  const sub=audit.supabase.tables.guard_stripe_subscriptions
  assert.equal(sub.required.includes('auth_user_id'),false)
  for(const column of ['stripe_subscription_id','stripe_customer_id','stripe_price_id','plan','status','paid_through','last_paid_invoice_id','updated_at'])
    assert.ok(sub.columns[column],column)
  assert.equal(audit.supabase.rpc.guard_refresh_user_plan.properties.p_auth_user_id.format,'uuid')
  assert.equal(audit.supabase.tables.guard_direct_purchases,undefined)
  assert.equal(audit.supabase.tables.guard_request_windows,undefined)
})
