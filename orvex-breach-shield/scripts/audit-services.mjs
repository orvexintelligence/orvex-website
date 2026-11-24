// Read-only audit. No customer rows, RPC calls, account creation or payments.
// Run: node --env-file=.env.guard.local scripts/audit-services.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import Stripe from 'stripe'
import { GUARD_PAYMENT_LINKS } from '../server/guardDirectPurchase.js'
import { GUARD_STRIPE_API_VERSION } from '../server/guardStripeConfig.js'

const report={checkedAt:new Date().toISOString(),readOnly:true}
const get=async(url,headers={})=>{
  const response=await fetch(url,{headers,signal:AbortSignal.timeout(45000)})
  return {response,body:await response.text()}
}
const base=process.env.SUPABASE_URL
if(!base || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing local Supabase configuration')
const schema=await get(base+'/rest/v1/',{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY})
if(schema.response.status!==200) throw new Error('Schema unavailable')
const api=JSON.parse(schema.body)
report.supabase={http:200,tables:{},rpc:{},notObservable:['auth.users columns','CHECK/UNIQUE constraints','RLS policies','function bodies','role grants','triggers','backups']}
for(const [name,table] of Object.entries(api.definitions??{}).filter(([k])=>k.startsWith('guard_'))) {
  report.supabase.tables[name]={required:table.required??[],columns:Object.fromEntries(Object.entries(table.properties??{}).map(([k,v])=>[k,v.format??v.type]))}
}
for(const [name,rpc] of Object.entries(api.paths??{}).filter(([k])=>k.startsWith('/rpc/guard_'))) {
  report.supabase.rpc[name.slice(5)]=rpc.post?.parameters?.find(x=>x.name==='args')?.schema??{}
}
const settings=await get(base+'/auth/v1/settings',{apikey:process.env.SUPABASE_PUBLISHABLE_KEY})
const auth=JSON.parse(settings.body)
report.auth={http:settings.response.status,signupEnabled:auth.disable_signup===false,emailEnabled:auth.external?.email===true,emailConfirmationRequired:auth.mailer_autoconfirm===false}
const publicPage=await get('https://orvexintelligence.com/orvex-guard.html')
const local=await readFile(new URL('../../orvex-guard.html',import.meta.url),'utf8')
const shell=html=>html.replaceAll('\r\n','\n').match(/^[\s\S]*?<script>/)?.[0]
const links=html=>[...new Set(html.match(/https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+/g)??[])].sort()
report.public={http:publicPage.response.status,
  api:publicPage.body.match(/var API_URL\s*=\s*'([^']+)'/)?.[1],
  staticMarkupIdentical:shell(publicPage.body)===shell(local),
  sha256:createHash('sha256').update(shell(publicPage.body)??'').digest('hex'),
  liveLinksIdentical:JSON.stringify(links(publicPage.body))===JSON.stringify(links(local)),links:links(publicPage.body)}
const stripe=new Stripe(process.env.STRIPE_SECRET_KEY,{apiVersion:GUARD_STRIPE_API_VERSION,timeout:20000,maxNetworkRetries:0})
report.stripe={apiVersion:GUARD_STRIPE_API_VERSION,links:[]}
for(const [id,env] of Object.entries(GUARD_PAYMENT_LINKS)) {
  const p=await stripe.paymentLinks.retrieve(id)
  const items=await stripe.paymentLinks.listLineItems(id)
  report.stripe.links.push({id,url:p.url,live:p.livemode,active:p.active,
    configuredPriceMatches:items.data.length===1&&items.data[0].price.id===process.env[env],
    completion:p.after_completion.type})
}
try {
  const endpoints=await stripe.webhookEndpoints.list({limit:100})
  report.stripe.webhooks={readable:true,endpoints:endpoints.data.map(x=>({url:x.url,status:x.status,apiVersion:x.api_version,events:x.enabled_events}))}
} catch(e) {report.stripe.webhooks={readable:false,http:e.statusCode,code:e.code??e.type}}
report.render=[]
for(const [path,options] of [
  ['/health',{}],
  ['/analyze/text',{method:'OPTIONS',headers:{Origin:'https://orvexintelligence.com','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}}],
  ['/profile',{}],
  ['/analyze/text',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://orvexintelligence.com',Authorization:'Bearer invalid-audit-token'},body:JSON.stringify({text:'Audit authorization only'})}]
]) {
  const r=await fetch('https://orvex-guard-staging.onrender.com/api/guard'+path,{...options,signal:AbortSignal.timeout(45000)})
  const body=await r.text()
  let error;try{error=JSON.parse(body).error}catch{}
  report.render.push({path,method:options.method??'GET',status:r.status,cors:r.headers.get('access-control-allow-origin'),...(error?{error}:{})})
}
await mkdir(new URL('../ops/evidence/',import.meta.url),{recursive:true})
await writeFile(new URL('../ops/evidence/service-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({saved:'ops/evidence/service-audit.json',tables:Object.keys(report.supabase.tables),auth:report.auth,public:report.public,webhooks:report.stripe.webhooks,render:report.render},null,2))
