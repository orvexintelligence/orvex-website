import test from 'node:test'
import assert from 'node:assert/strict'
import { isGuardInvoicePaid, GUARD_STRIPE_API_VERSION } from '../server/guardStripeConfig.js'
import { processGuardLifecycleEvent } from '../server/guardStripeLifecycle.js'

test('Pinned Stripe schema accepts settled invoices without removed paid boolean',()=>{
  assert.equal(GUARD_STRIPE_API_VERSION,'2026-11-18.endive')
  assert.equal(isGuardInvoicePaid({status:'paid',amount_remaining:0}),true)
  assert.equal(isGuardInvoicePaid({status:'paid',paid:true}),true)
  for(const invoice of [{status:'open',paid:true},{status:'paid',paid:false},{status:'paid',amount_remaining:1},{}])
    assert.equal(isGuardInvoicePaid(invoice),false)
})
test('Current Stripe parent/pricing invoice format renews an unclaimed subscription',async()=>{
  const price=process.env.STRIPE_GUARD_PREMIUM_MONTHLY_PRICE_ID
  const invoice={id:'in_modern',customer:'cus_1',status:'paid',amount_remaining:0,parent:{subscription_details:{subscription:'sub_1'}}}
  let called
  const stripe={invoices:{retrieve:async()=>invoice,listLineItems:async()=>({data:[{pricing:{price_details:{price}},period:{end:2000000000}}]})},
    subscriptions:{retrieve:async()=>({customer:'cus_1',status:'active'})}}
  const admin={from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{stripe_customer_id:'cus_1',stripe_price_id:price,auth_user_id:null}})}),
    rpc:async(name,args)=>{called={name,args};return {data:true}}}
  assert.equal((await processGuardLifecycleEvent(stripe,admin,{type:'invoice.paid',data:{object:invoice}})).handled,true)
  assert.equal(called.name,'guard_sync_paid_invoice');assert.equal(called.args.p_subscription_id,'sub_1')
})
