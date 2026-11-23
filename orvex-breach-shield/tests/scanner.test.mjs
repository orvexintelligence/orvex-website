import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { createGuardAnalyzeRouter } from '../server/routes/guardAnalyze.js'
import { validateGuardAIResult } from '../server/guardOpenAI.js'
import { guardRateLimit } from '../server/guardRateLimit.js'

const result={score:40,level:'warning',label:'Attenzione',summary:'Verifica il mittente',advice:'Non rispondere',signals:[]}
test('AI output must match the public contract',()=>{
  assert.deepEqual(validateGuardAIResult(result),result)
  for (const bad of [{...result,score:999},{...result,level:'unknown'},{...result,signals:null},{...result,advice:''}])
    assert.throws(()=>validateGuardAIResult(bad))
})
test('Scanner: guest/free/paid quotas, invalid tokens, outages and AI cap',async()=>{
  let rows=[],usage=[],denied=false,aiCalls=0,capDenied=false,dbError=false,aiError=false,unverified=false
  const query={select(){return this},eq(){return this},in(_key,statuses){this.statuses=statuses;return this},gt:async function(_key,now){return {data:rows.filter(r=>this.statuses.includes(r.status)&&r.paid_through>now)}}}
  const admin={from:()=>query,rpc:async(_,args)=>{
    usage.push(args)
    if(dbError) return {error:{message:'offline'}}
    return {data:(denied || (capDenied && args.p_principal_key.startsWith('system:')))?{allowed:false,error:'Limite giornaliero raggiunto'}:{allowed:true,remaining:1}}
  }}
  const app=express();app.use(express.json())
  app.use(createGuardAnalyzeRouter({admin,verifyToken:async t=>t==='valid'?{id:'user-verified',email_confirmed_at:unverified?null:'2026-01-01'}:null,
    isAIConfigured:()=>true,analyzeAI:async()=>{aiCalls++;if(aiError) throw new Error('timeout');return {available:true,result}}}))
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r))
  const url=`http://127.0.0.1:${server.address().port}/text`
  const scan=(token,text='Controlla questo messaggio')=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:token}:{})},body:JSON.stringify({text,plan:'small_b2b'})})
  try {
    assert.equal((await scan('Bearer invalid')).status,401)
    assert.equal((await scan('invalid')).status,401)
    assert.equal(usage.length,0)
    assert.equal((await scan(null,'')).status,400)
    assert.equal((await scan(null,'x'.repeat(4001))).status,413)
    assert.equal((await (await scan()).json()).plan,'guest');assert.equal(usage[0].p_limit,2)
    usage=[]
    assert.equal((await (await scan('Bearer valid')).json()).plan,'free');assert.equal(usage[0].p_limit,3)
    for(const [plan,limit] of [['premium',10],['small_b2b',20]]) {
      rows=[{plan,status:'active',paid_through:'2099-01-01'}];usage=[]
      assert.equal((await (await scan('Bearer valid')).json()).plan,plan);assert.equal(usage[0].p_limit,limit)
    }
    for(const row of [{plan:'premium',status:'canceled',paid_through:'2099-01-01'},{plan:'premium',status:'active',paid_through:'2000-01-01'}]) {
      rows=[row];assert.equal((await (await scan('Bearer valid')).json()).plan,'free')
    }
    unverified=true;assert.equal((await scan('Bearer valid')).status,403);unverified=false
    capDenied=true;const capBefore=aiCalls;assert.equal((await scan()).status,429);assert.equal(aiCalls,capBefore);capDenied=false
    dbError=true;assert.equal((await scan()).status,503);dbError=false
    aiError=true;assert.equal((await scan()).status,503);aiError=false
    denied=true;const before=aiCalls
    assert.equal((await scan()).status,429);assert.equal(aiCalls,before)
    assert.equal(usage.at(-1).p_limit,2)
  } finally {await new Promise(r=>server.close(r))}
})
test('Abuse limiter rejects database failure and exhausted IP budget',async()=>{
  for (const [reply,expected] of [[{data:false},429],[{error:{}},503],[{data:null},503],[{data:true},200]]) {
    const middleware=guardRateLimit(()=>({rpc:async()=>reply}))
    const res={status(code){this.code=code;return this},set(){return this},json(){return this}}
    await middleware({method:'POST',ip:'127.0.0.1'},res,()=>{res.code=200})
    assert.equal(res.code,expected)
  }
})
