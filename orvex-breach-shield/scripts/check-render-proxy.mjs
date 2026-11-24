// Signed, read-only probe. Does not enable proxy trust or change any quota.
import {createHmac,randomBytes} from 'node:crypto'
import {writeFile} from 'node:fs/promises'
const base='https://orvex-guard-staging.onrender.com/api/guard'
const secret=process.env.GUARD_IP_HASH_SECRET
if(!secret || secret.length<32) throw new Error('Diagnostic secret unavailable')
const results=[]
for(const spoof of [null,'198.51.100.9','198.51.100.9, 203.0.113.7']) {
  const stamp=Date.now().toString(),nonce=randomBytes(16).toString('hex')
  const signature=createHmac('sha256',secret).update(`guard-proxy-diagnostic:v1:${stamp}:${nonce}`).digest('hex')
  const r=await fetch(base+'/diagnostics/proxy',{headers:{'X-Guard-Diagnostic':`${stamp}:${nonce}:${signature}`,...(spoof?{'X-Forwarded-For':spoof}:{})},signal:AbortSignal.timeout(30000)})
  let data;try{data=await r.json()}catch{data={}}
  results.push({spoofedHeader:spoof!==null,http:r.status,data})
}
const comparable=results.every(r=>r.http===200)
const report={checkedAt:new Date().toISOString(),readOnly:true,
  signedProbeAccepted:comparable,
  headerSpoofChangedIdentity:comparable?results.some(r=>r.data.identity!==results[0].data.identity):null,
  observations:results.map(({spoofedHeader,http,data})=>({spoofedHeader,http,ipFamily:data.ipFamily,ipRange:data.ipRange,
    interpretedHops:data.interpretedHops,trustProxy:data.trustProxy,guestGateEnabled:data.guestGateEnabled})),
  limitations:'Single-origin probe. Unchanged identity alone does not prove distinct clients receive distinct quotas; no flag is enabled automatically.'}
await writeFile('ops/evidence/render-proxy.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report,null,2))
