import test from 'node:test'
import assert from 'node:assert/strict'
import { processGuardCheckout } from '../server/guardStripeProcessCheckout.js'
import { GUARD_PAYMENT_LINKS } from '../server/guardDirectPurchase.js'
import { createGuardStripeWebhook } from '../server/routes/guardStripeWebhook.js'
import Stripe from 'stripe'

function fixture(link, env) {
  const price = process.env[env]
  const session = { id:'cs_fixture', status:'complete', mode:'subscription', payment_status:'paid', livemode:true,
    payment_link:link, customer:'cus_fixture', subscription:'sub_fixture', customer_details:{email:'Buyer@Example.com'},
    client_reference_id:'untrusted-reference-from-browser' }
  const sub = {livemode:true,status:'active',customer:'cus_fixture',items:{data:[{price:{id:price},quantity:1}]}}
  const stripe = {checkout:{sessions:{retrieve:async()=>session,listLineItems:async()=>({data:[{price:{id:price},quantity:1}]})}},subscriptions:{retrieve:async()=>sub}}
  let writes = []
  const admin = {rpc:async(name,args)=>{writes.push({name,args});return {data:true}}}
  return {session,sub,stripe,admin,writes}
}
for (const [link,env] of Object.entries(GUARD_PAYMENT_LINKS)) {
  test(`Direct paid checkout works without prior account: ${env}`,async()=>{
    const f=fixture(link,env)
    assert.equal((await processGuardCheckout(f.stripe,f.admin,'cs_fixture')).recorded,true)
    assert.equal(f.writes[0].name,'guard_record_direct_purchase')
    assert.equal(f.writes[0].args.p_checkout_email,'buyer@example.com')
    assert.equal(f.writes[0].args.p_plan,env.includes('SMALL')?'small_b2b':'premium')
    assert.equal('p_user_id' in f.writes[0].args,false)
  })
}
for (const mutate of [f=>f.session.payment_status='unpaid',f=>f.session.livemode=false,
  f=>f.session.payment_link='plink_unapproved',f=>f.sub.customer='cus_other',f=>f.sub.items.data[0].quantity=2,
  f=>f.session.customer_details.email='',f=>f.sub.items.data[0].price.id='price_other']) {
  test('Invalid direct purchase never grants access',async()=>{
    const f=fixture(...Object.entries(GUARD_PAYMENT_LINKS)[0]);mutate(f)
    assert.equal((await processGuardCheckout(f.stripe,f.admin,'cs_fixture')).recorded,false)
    assert.equal(f.writes.length,0)
  })
}
test('Real signature verification and test/live separation',async()=>{
  const secret='whsec_local_fixture'
  const api=new Stripe('sk_test_local_fixture')
  const handler=createGuardStripeWebhook({stripe:api,admin:{},secret})
  const run=async(livemode,signatureValid)=>{
    const payload=JSON.stringify({id:'evt_fixture',livemode,type:'unrelated.event',data:{object:{}}})
    const signature=Stripe.webhooks.generateTestHeaderString({payload,secret:signatureValid?secret:'wrong'})
    const res={status(code){this.code=code;return this},json(body){this.body=body;return this}}
    await handler({headers:{'stripe-signature':signature},body:Buffer.from(payload)},res)
    return res.code
  }
  assert.equal(await run(true,true),200)
  assert.equal(await run(false,true),400)
  assert.equal(await run(true,false),400)
})

for (const type of ['checkout.session.completed','checkout.session.async_payment_succeeded']) {
  test(`Signed ${type} persists direct purchase and reconciles first invoice without an account`,async()=>{
    const f=fixture(...Object.entries(GUARD_PAYMENT_LINKS)[0])
    const price=process.env.STRIPE_GUARD_PREMIUM_MONTHLY_PRICE_ID
    const secret='whsec_local_full_checkout'
    const invoice={id:'in_fixture',subscription:'sub_fixture',customer:'cus_fixture',status:'paid',paid:true}
    f.sub.latest_invoice=invoice.id
    const lines={data:[{price:{id:price},quantity:1}],async *[Symbol.asyncIterator](){yield* this.data}}
    f.stripe.checkout.sessions.listLineItems=()=>lines
    f.stripe.webhooks=new Stripe('sk_test_local_fixture').webhooks
    f.stripe.invoices={retrieve:async()=>invoice,listLineItems:async()=>({data:[{price:{id:price},period:{end:2000000000}}]})}
    f.admin.from=table=>table==='guard_stripe_events'?{upsert:async()=>({})}:{select:()=>({eq:()=>({maybeSingle:async()=>({data:{
      stripe_subscription_id:'sub_fixture',stripe_customer_id:'cus_fixture',stripe_price_id:price,auth_user_id:null
    }})})})}
    f.admin.rpc=async(name,args)=>{
      f.writes.push({name,args})
      return {data:name==='guard_claim_stripe_event'?{status:'claimed',attempt:1}:true}
    }
    const payload=JSON.stringify({id:'evt_fixture',livemode:true,type,data:{object:f.session}})
    const signature=Stripe.webhooks.generateTestHeaderString({payload,secret})
    const res={status(code){this.code=code;return this},json(body){this.body=body;return this}}
    await createGuardStripeWebhook({stripe:f.stripe,admin:f.admin,secret})({headers:{'stripe-signature':signature},body:Buffer.from(payload)},res)
    assert.equal(res.code,200)
    assert.ok(f.writes.some(x=>x.name==='guard_record_direct_purchase'))
    assert.ok(f.writes.some(x=>x.name==='guard_sync_paid_invoice'))
    assert.equal(f.writes.at(-1).args.p_status,'processed')
  })
}
