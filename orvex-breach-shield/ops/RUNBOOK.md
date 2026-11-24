# Preparazione operativa PR #17 — 24 novembre 2026

Questa procedura è destinata all'esecuzione da parte dell'assistente quando saranno disponibili gli accessi di controllo. **Non richiede test manuali al proprietario.** Non autorizza merge, pubblicazione del sito, pagamenti Live o dismissione AWS.

## Verifica effettuata sul sistema esistente

Evidenza ripetibile: `node --env-file=.env.guard.local scripts/audit-services.mjs`. Produce solo metadati in `ops/evidence/service-audit.json`: nessuna riga cliente, token o chiave, nessuna RPC mutante.

- Tutte le colonne pubbliche necessarie alle due migrazioni sono presenti con tipi compatibili: `guard_profiles.auth_user_id/plan`; `guard_stripe_subscriptions` con PK testuale, cliente/prezzo/piano/stato, UUID utente nullable, `paid_through`, `last_paid_invoice_id`, `updated_at`. La firma REST di `guard_refresh_user_plan` accetta UUID `p_auth_user_id`.
- Le due tabelle nuove e le nuove RPC non risultano ancora installate. Le funzioni e i dati operativi non sono stati modificati.
- Registrazione email abilitata, `disable_signup=false`, `mailer_autoconfirm=false`: conferma email richiesta. Questo non prova recapito SMTP o corretta configurazione dei redirect, da collaudare automaticamente su ambiente isolato.
- **Limite verificabile**: REST non mostra `auth.users`, CHECK/UNIQUE, policy RLS, grant, trigger, corpi/return type/search_path delle funzioni. La compatibilità completa resta condizionata al catalogo SQL; non si può sostituire questa verifica con i test mock.
- Render risponde alla health e al preflight CORS. Ora anche le richieste profilo senza token restituiscono 503 `Protezione richieste non configurata`: il ramo aggiornato include il gate antiabuso davanti alle API. Non è prova di perdita della protezione JWT; lo stack locale la collauda separatamente. Non abilitare il flag per nascondere il problema.
- Stripe: quattro link Live attivi, prezzi coerenti. Lettura endpoint webhook ancora negata con HTTP 403 `more_permissions_required`.
- Il sito pubblico chiama sempre AWS. Markup statico e quattro URL Stripe corrispondono alla copia del ramo. **Nessuna modifica a sito, pulsanti, URL o redirect Stripe è necessaria per il collaudo.** Si può usare il file del ramo tramite server locale `http://localhost:8080`, già ammesso dal CORS. Solo il passaggio finale, successivamente autorizzato, richiederà pubblicare il codice che usa Render.

## Backup, applicazione e rollback

### Ordine vincolante

1. Acquisire l'accesso PostgreSQL amministrativo, il catalogo corrente, la configurazione Auth e l'identità esatta del progetto. Identificare anche il commit effettivamente servito da Render. Disabilitare l'auto-deploy **del solo staging** prima delle operazioni sul database; non toccare il sito AWS o altri servizi.
2. Confermare un backup gestito/PITR ripristinabile su progetto separato. Creare anche un archivio logico cifrato con lo script sotto. Nessuna migrazione finché backup, hash e prova di ripristino non sono registrati nel verbale privato.
3. Ripristinare una copia isolata con le procedure Supabase supportate. Non caricare dati reali in Git/CI; disabilitare invio email e webhook Live nella copia. Il ripristino di schemi gestiti `auth`/`storage` non è un semplice `pg_restore --clean` sul progetto operativo. Non eseguire tale comando. Usare il ripristino gestito su nuovo progetto oppure adattare il ripristino logico alle esclusioni Supabase dopo lettura del catalogo.
4. Eseguire `ops/export-catalog.sql`, confrontare policy, trigger, UNIQUE/CHECK, permessi e corpi delle vecchie RPC. In particolare: aggiornamenti/annullamenti con utente NULL, rinnovi concorrenti, proprietà degli account, contatori atomici, browser escluso dalle RPC amministrative. Eseguire le prove transazionali sulla copia, non sui clienti operativi.
5. Applicare `ops/generated/apply.sql` **sulla copia**. È un unico `BEGIN/COMMIT` per entrambe le migrazioni, con advisory lock, lock timeout 5s, statement timeout 60s e preflight. Se una verifica o un DDL fallisce, non resta la prima migrazione parzialmente installata. Test PostgreSQL locale coprono precisamente questo caso.
6. Collaudare sulla copia l'intero flusso FREE/acquisti/rinnovi e confrontare conteggi e permessi prima/dopo. Dopo queste prove, l'applicazione al database previsto per il nuovo backend richiede lo stesso backup e la stessa procedura; non modifica il sito pubblico. Registrare timestamp, hash del bundle, esito COMMIT e revisione del backend nel verbale privato. Il preflight impedisce riesecuzioni silenziose o sovrascritture di oggetti già esistenti.

### Comandi preparati per l'assistente

Credenziali PostgreSQL in `PGSERVICEFILE`/`PGPASSFILE` privati, profili separati `guard_source` e `guard_restore`, TLS `verify-full` e CA appropriata. Non passare URL con password sulla riga di comando; niente credenziali nel repository. Il percorso backup deve essere esterno al repository e accessibile solo all'operatore. `age` usa un destinatario pubblico `AGE_RECIPIENT`; la chiave privata di decifratura resta nel deposito sicuro del proprietario.

```powershell
# Strumenti necessari: client PostgreSQL della stessa major del server, age, Python.
# Le variabili private di connessione vengono predisposte fuori dal repository.
$env:PGSERVICE = 'guard_source'
python ops/backup-database.py C:/PrivateBackups/OrvexGuard
if ($LASTEXITCODE -ne 0) { throw 'Backup non valido: arresto' }
# Esportazione metadata in directory privata ignorata da Git.
New-Item -ItemType Directory -Force ops/private | Out-Null
psql -X -v ON_ERROR_STOP=1 -At -f ops/export-catalog.sql -o ops/private/catalog.json
if ($LASTEXITCODE -ne 0) { throw 'Catalogo non esportato: arresto' }
# DOPO ripristino riuscito e verificato su progetto separato:
$env:PGSERVICE = 'guard_restore'
psql -X -v ON_ERROR_STOP=1 -f ops/generated/apply.sql
if ($LASTEXITCODE -ne 0) { throw 'Migrazione non applicata: arresto' }
```

Lo script backup passa i byte direttamente da `pg_dump` ad `age`, senza dump in chiaro su disco; verifica gli exit code di entrambi e produce un manifest SHA256 con `restoreVerified:false`. **Un manifest o `pg_restore --list` riuscito non dimostra ripristinabilità**. Decifrare in un percorso privato soltanto durante la prova e confrontare schema, dati, indici, FK, RLS, grant e utenti Auth ripristinati. Conservare separatamente configurazione Auth/SMTP, ruoli globali e oggetti Storage: `pg_dump` non salva impostazioni di servizio o file Storage. Non registrare artificialmente `restoreVerified:true` senza prova.

`ops/preflight.sql` verifica tipi/colonne, nullable per l'utente dell'abbonamento, unicità profilo, RLS attiva, funzione refresh con ritorno text o void (il risultato viene ignorato da PERFORM), permessi e search_path esplicito, assenza di installazione precedente. Un fallimento è una discrepanza da esaminare, non un invito a rimuovere i controlli. La verifica delle policy effettive e dei vecchi corpi SQL è aggiuntiva e non viene simulata dal preflight.

### Rollback senza perdita degli acquisti

- **Errore prima del COMMIT**: rollback automatico dell'intero bundle; nessuna nuova tabella/funzione persistente. `psql ON_ERROR_STOP` chiude la sessione; non continuare con comandi successivi dopo errore.
- **Problema dopo il COMMIT**: fermare l'uso del nuovo backend di collaudo, riportare il solo Render alla revisione verificata precedente e lasciare le nuove tabelle/RPC installate. Non eseguire DROP/TRUNCATE e non ripristinare un vecchio dump sopra acquisti recenti. Il sito resta su AWS. La revisione `5edf9b7` precede le nuove RPC, mentre `8a128f1` già le richiede: scegliere in base alla configurazione effettiva, non solo alla data.
- Se un nuovo endpoint webhook è stato abilitato in seguito, disabilitare solo quello identificato per il nuovo sistema e conservare ID eventi/lease. Non modificare altri endpoint o Payment Links. Conservare i dati per replay/backfill verificato e correzione successiva; un evento già `rejected` non si recupera con un semplice retry.
- In caso di corruzione reale, ripristinare il backup su **nuovo progetto**, confrontare i delta Stripe e definire una riconciliazione prima di qualunque sostituzione del DB. Il backup è una rete di sicurezza, non un meccanismo di rollback che cancelli acquisti successivi.

## Configurazione esatta Stripe

Payload pronto: `ops/stripe-webhook.live.json`.

| Campo | Valore |
| --- | --- |
| Tipo | Snapshot events, account corrente; non Connect e non thin events |
| URL | `https://orvex-guard-staging.onrender.com/api/guard/stripe/webhook` |
| Versione API | `2026-11-18.endive`, fissata anche nei client server |
| Eventi | `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted` |
| Signing secret | Valore del nuovo endpoint → variabile Render `STRIPE_GUARD_WEBHOOK_SECRET`, mai nel frontend o nella PR |
| Ambiente | Live solo dopo DB/proxy/AI verificati; il nome “staging” del servizio non isola automaticamente i dati |

Prima leggere gli endpoint esistenti per evitare doppioni, poi creare/configurare quello previsto solo quando il backend è pronto. Non cambiare versione API dell'intero account e non sostituire endpoint condivisi di altri prodotti. Il secret di Stripe CLI non sostituisce quello dell'endpoint Dashboard. Il runtime necessita lettura Checkout Sessions/line items, Payment Links/line items, Subscriptions, Invoices/line items e prezzi correlati; la chiave operativa esistente già legge i Payment Links. Il permesso **Webhook Endpoints Read/Write** serve alla configurazione, non va aggiunto per forza alla chiave runtime se si usa una credenziale amministrativa temporanea separata.

È stato corretto il controllo obsolete `invoice.paid`: dalle API moderne la fattura riletta viene verificata tramite `status='paid'`, senza affidarsi al booleano rimosso; un saldo residuo non nullo o un vecchio `paid=false` sono rifiutati. I test includono `parent.subscription_details` e `pricing.price_details`.

Per il collaudo Stripe esterno usare Sandbox distinta, chiavi/prezzi/link di test e database separato. Non indirizzare eventi Test all'endpoint Live. Il ramo blocca ancora `STRIPE_GUARD_MODE=test` sul DB condiviso: servono accessi alla Sandbox e alla copia DB per predisporre il deployment di test con controlli di isolamento, prima di usare test clock. Nessun pagamento Live è richiesto.

## Configurazione esatta Render

Riferimento completo: `ops/render-staging.yaml`; non importato, nessun servizio creato. Aggiornare il servizio **esistente**, preservando le altre variabili e integrazioni. `autoDeployTrigger: off` evita che l'applicazione delle configurazioni preceda le migrazioni. Un cambiamento a un environment group può avviare deploy: evitare gruppi condivisi col pubblico.

- Repository `orvexintelligence/orvex-website`, branch `guard-migration-test`, root `orvex-breach-shield`, runtime Node 24, build `npm ci --omit=dev`, start `npm start`, health `/api/guard/health`. Usare `PORT` assegnata da Render.
- `NODE_ENV=production`; `VITE_APP_URL=https://orvexintelligence.com`; `GUARD_AI_ENABLED=true`; `GUARD_PREMIUM_DAILY_LIMIT=10`, `GUARD_SMALL_B2B_DAILY_LIMIT=20`, `GUARD_AI_DAILY_CAP=20` sono valori conservativi di collaudo, non prova della promessa commerciale “illimitate”.
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` dello **stesso** progetto previsto; `OPENAI_API_KEY`; `GUARD_IP_HASH_SECRET` esistente di almeno 32 caratteri. Non rigenerare il segreto ospiti durante il collaudo: cambierebbe l'identità dei contatori.
- `GUARD_TRUST_PROXY=one-hop` è una configurazione candidata, non una certificazione della catena Render. Mantenere `GUARD_GUEST_IP_VERIFIED=false` fino a prova automatica con ingressi noti e header falsificati. Il test Express dimostra il comportamento di un hop, non la topologia remota. Con accesso Render, l'assistente raccoglierà i log temporanei, effettuerà le richieste di controllo e configurerà la fiducia corretta; non serve che il proprietario provi lo scanner.
- `STRIPE_GUARD_MODE=live`, chiave runtime e signing secret dell'endpoint corretto. Quattro price ID esatti nel YAML e in `.env.guard.example`; non sono segreti. Nessuna chiave `VITE_*` per Supabase service role, Stripe o OpenAI.

## Interventi del proprietario ridotti agli accessi

1. **Supabase**: rendere disponibile un accesso PostgreSQL amministrativo con backup/restore e una destinazione isolata autorizzata (oppure accesso console per predisporla). La service role REST già disponibile non consente catalogo SQL completo, DDL o backup. Occorre un canale sicuro per connessione/password, non un messaggio in chat.
2. **Render**: concedere accesso al servizio `orvex-guard-staging` per configurazione, log e deploy controllato (sessione amministrativa o API key tramite canale sicuro). Nessun accesso aggiuntivo al sito pubblico richiesto.
3. **Stripe**: concedere Webhook Endpoints Read/Write per la configurazione e accesso amministrativo/chiave della Sandbox per il collaudo esterno. Non occorre modificare i Payment Links Live né concedere permessi per incassare denaro reale.

Dopo questi accessi l'assistente può eseguire backup, verifica SQL, configurazioni e test esterni, fermandosi prima del merge/pubblicazione. Restano fuori da questa richiesta decisioni commerciali e implementazioni non provate (illimitate, screenshot/team/NIS2), recupero utenti AWS e onboarding email: il loro stato è esplicito in `MIGRATION.md`, non richiedono ora al proprietario altri test manuali. Nessun via libera alla dismissione AWS viene dedotto da questo collaudo.

Riferimenti ufficiali: [Stripe endpoint](https://docs.stripe.com/api/webhook_endpoints/create), [Invoice corrente](https://docs.stripe.com/api/invoices/object), [backup e ripristino Supabase](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), [Blueprint Render](https://render.com/docs/blueprint-spec), [variabili Render](https://render.com/docs/configure-environment-variables).
