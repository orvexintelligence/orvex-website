import test from 'node:test'
import assert from 'node:assert/strict'
import { Router } from 'express'
import { createApp } from '../server/index.js'

test('HTTP stack: CORS, body limits, raw webhook and proxy gate',async()=>{
  const analyze=Router();analyze.post('/text',(req,res)=>res.json({ip:req.ip}))
  let calls=0
  const previousProxy=process.env.GUARD_TRUST_PROXY
  process.env.GUARD_TRUST_PROXY='one-hop'
  const app=createApp({getAdmin:()=>({rpc:async()=>{calls++;return {data:true}}}),analyzeRouter:analyze,
    webhook:(req,res)=>res.json({raw:Buffer.isBuffer(req.body)})})
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r))
  const url=`http://127.0.0.1:${server.address().port}/api/guard`
  try {
    let r=await fetch(url+'/analyze/text',{method:'OPTIONS',headers:{Origin:'https://orvexintelligence.com','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}})
    assert.equal(r.status,204);assert.equal(r.headers.get('access-control-allow-origin'),'https://orvexintelligence.com');assert.equal(calls,0)
    r=await fetch(url+'/analyze/text',{method:'OPTIONS',headers:{Origin:'https://attacker.invalid','Access-Control-Request-Method':'POST'}})
    assert.equal(r.headers.get('access-control-allow-origin'),null)
    for(const [body,expected] of [['{',400],[JSON.stringify({text:'x'.repeat(17000)}),413]]) {
      r=await fetch(url+'/analyze/text',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://orvexintelligence.com'},body})
      assert.equal(r.status,expected);assert.equal(r.headers.get('access-control-allow-origin'),'https://orvexintelligence.com')
    }
    r=await fetch(url+'/stripe/webhook',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"test":true}'})
    assert.equal((await r.json()).raw,true)
    r=await fetch(url+'/analyze/text',{method:'POST',headers:{'Content-Type':'application/json','X-Forwarded-For':'198.51.100.10, 203.0.113.8'},body:'{}'})
    assert.equal((await r.json()).ip,'203.0.113.8')
    const old=process.env.NODE_ENV;process.env.NODE_ENV='production'
    try {
      assert.equal((await fetch(url+'/profile')).status,503)
      assert.equal((await fetch(url+'/health')).status,200)
    } finally {process.env.NODE_ENV=old}
  } finally {
    if(previousProxy===undefined) delete process.env.GUARD_TRUST_PROXY;else process.env.GUARD_TRUST_PROXY=previousProxy
    await new Promise(r=>server.close(r))
  }
})
