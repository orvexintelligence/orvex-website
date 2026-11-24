import { readFile,writeFile,mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const files=['202611230001_direct_purchases.sql','202611230002_invoice_sync.sql']
const chunks=[]
for(const file of files) {
  const sql=(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8')).replaceAll('\r\n','\n')
  if((sql.match(/^begin;$/gim)??[]).length!==1 || (sql.match(/^commit;$/gim)??[]).length!==1) throw new Error('Unexpected transaction framing')
  chunks.push(`-- ${file}; SHA256 ${createHash('sha256').update(sql).digest('hex')}\n`+sql.replace(/^begin;\s*$/im,'').replace(/^commit;\s*$/im,''))
}
const preflight=await readFile(new URL('../ops/preflight.sql',import.meta.url),'utf8')
// A single transaction, not nested BEGIN/COMMIT from the individual migrations.
const bundle=`-- GENERATED. Run only after verified encrypted backup and restore rehearsal.\nBEGIN;\nSET LOCAL lock_timeout='5s';\nSET LOCAL statement_timeout='60s';\nSELECT pg_advisory_xact_lock(hashtextextended('orvex-guard-migration-20261123',0));\n${preflight}\n${chunks.join('\n')}\nNOTIFY pgrst, 'reload schema';\nCOMMIT;\n`
await mkdir(new URL('../ops/generated/',import.meta.url),{recursive:true})
await writeFile(new URL('../ops/generated/apply.sql',import.meta.url),bundle)
console.log('Generated atomic migration bundle; no database connection opened')
