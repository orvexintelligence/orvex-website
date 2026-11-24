import test from 'node:test'
import assert from 'node:assert/strict'
import {createHmac} from 'node:crypto'
import {guardProxyDiagnostic} from '../server/guardProxyDiagnostic.js'

test('Proxy diagnostic requires a fresh valid signature and never returns raw IP or secrets',()=>{
  const secret=process.env.GUARD_IP_HASH_SECRET
  const sign=timestamp=>{
    const nonce='a'.repeat(32)
    return `${timestamp}:${nonce}:`+createHmac('sha256',secret).update(`guard-proxy-diagnostic:v1:${timestamp}:${nonce}`).digest('hex')
  }
  const run=header=>{
    const res={code:200,set(){return this},status(code){this.code=code;return this},json(body){this.body=body;return this}}
    guardProxyDiagnostic({headers:{'x-guard-diagnostic':header},ip:'203.0.113.9',ips:['203.0.113.9'],app:{get:()=>1}},res)
    return res
  }
  for(const header of [undefined,'bad',sign(Date.now()-120000),sign(Date.now()).slice(0,-1)+'z']) assert.equal(run(header).code,403)
  const response=run(sign(Date.now()))
  assert.equal(response.code,200);assert.equal(response.body.trustProxy,'one-hop')
  assert.equal(JSON.stringify(response.body).includes('203.0.113.9'),false)
  assert.equal(JSON.stringify(response.body).includes(secret),false)
})
