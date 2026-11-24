import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { createGuardAuthRouter } from '../server/routes/guard.js'
import { createGuardProfileRouter } from '../server/routes/guardProfile.js'

async function serverFor(router,run) {
  const app=express();app.use(express.json());app.use(router)
  app.use((_err,_req,res,_next)=>res.status(503).json({error:'unavailable'}))
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r))
  const request=async(path,body,token)=>{
    const r=await fetch(`http://127.0.0.1:${server.address().port}${path}`,{method:body?'POST':'GET',
      headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined})
    return {status:r.status,body:await r.json()}
  }
  try {await run(request)} finally {await new Promise(r=>server.close(r))}
}
test('FREE registration, login and token rotation cannot accept client entitlements',async()=>{
  let signup;let updates=0;let wrongIdentity=false
  const user={id:'user_1',email:'buyer@example.com'}
  const session={access_token:'access',refresh_token:'rotated',expires_at:123,token_type:'bearer'}
  const auth={
    signUp:async args=>{signup=args;return {}},
    signInWithPassword:async args=>args.password==='correct-password'?{data:{user:wrongIdentity?{...user,id:'other'}:user,session}}:{error:{}},
    refreshSession:async args=>args.refresh_token==='valid-refresh'?{data:{user,session}}:{error:{}},
    updateUser:async()=>{updates++;return {}},signOut:async()=>({})
  }
  await serverFor(createGuardAuthRouter({createAuthClient:()=>({auth}),verifyToken:async t=>t==='valid'?user:null}),async req=>{
    assert.equal((await req('/register',{email:'buyer@example.com',password:'short'})).status,400)
    assert.equal((await req('/register',{email:'buyer@example.com',password:'correct-password',plan:'premium',auth_user_id:'other'})).status,202)
    assert.deepEqual(Object.keys(signup).sort(),['email','password'])
    assert.equal((await req('/login',{email:user.email,password:'wrong'})).status,401)
    assert.equal((await req('/login',{email:user.email,password:'correct-password'})).body.refresh_token,'rotated')
    assert.equal((await req('/refresh',{refresh_token:'invalid'})).status,401)
    assert.equal((await req('/refresh',{refresh_token:'valid-refresh'})).body.access_token,'access')
    assert.equal((await req('/me')).status,401)
    assert.equal((await req('/me',undefined,'invalid')).status,401)
    assert.equal((await req('/me',undefined,'valid')).body.user.id,user.id)
    const password={currentPassword:'correct-password',newPassword:'new-password'}
    wrongIdentity=true;assert.equal((await req('/password',password,'valid')).status,401);assert.equal(updates,0)
    wrongIdentity=false;assert.equal((await req('/password',password,'valid')).status,200);assert.equal(updates,1)
  })
})
test('FREE profile initialization: verified identity, legacy protection, duplicate and DB failures',async()=>{
  let verified=true,legacy=false,existing=null,insertError=null,inserted=null,claimed=null
  const user={id:'user_1',email:'Buyer@Example.com'}
  const admin={rpc:async(name,args)=>{claimed={name,args};return {data:0}},from:()=>({
    select(){return this},eq(){return this},not(){return this},
    maybeSingle:async()=>({data:existing}),limit:async()=>({data:legacy?[{id:'legacy'}]:[]}),
    insert:async row=>{inserted=row;return {error:insertError}}
  })}
  const deps={admin,verifyToken:async t=>t==='valid'?{...user,email_confirmed_at:verified?'2026-01-01':null}:null,
    createUserClient:token=>{assert.equal(token,'valid');return {from:()=>({select(){return this},eq(field,id){assert.equal(field,'auth_user_id');assert.equal(id,user.id);return this},maybeSingle:async()=>({data:existing})})}}}
  await serverFor(createGuardProfileRouter(deps),async req=>{
    assert.equal((await req('/initialize',{})).status,401)
    verified=false;assert.equal((await req('/initialize',{},'valid')).status,403);verified=true
    legacy=true;assert.equal((await req('/initialize',{},'valid')).status,409);assert.equal(inserted,null);legacy=false
    assert.equal((await req('/initialize',{name:'Buyer',plan:'premium',auth_user_id:'other',actived:false},'valid')).status,201)
    assert.equal(inserted.plan,'free');assert.equal(inserted.auth_user_id,'user_1');assert.equal(inserted.email,'buyer@example.com')
    insertError={code:'23505'};assert.equal((await req('/initialize',{},'valid')).status,409)
    insertError={code:'other'};assert.equal((await req('/initialize',{},'valid')).status,503)
    existing={id:'profile',plan:'free',email:user.email}
    assert.equal((await req('/initialize',{},'valid')).status,200)
    assert.equal((await req('/',undefined,'valid')).body.plan,'free')
    assert.deepEqual(claimed,{name:'guard_claim_direct_purchases',args:{p_user_id:'user_1'}})
  })
})
