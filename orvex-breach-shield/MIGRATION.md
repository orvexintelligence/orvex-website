# Orvex Guard — verifica e passaggio da AWS

Verifica del 23 novembre 2026. Ramo `guard-migration-test`, base di lavoro `5edf9b7`.
**Non pronto per spegnere AWS o pubblicare il frontend.** Questa PR prepara e verifica il codice; non sostituisce il collaudo dei servizi operativi.

## Evidenze raccolte, senza pagamenti o modifiche operative

| Componente | Evidenza | Esito |
| --- | --- | --- |
| Pagina pubblica | `API_URL=https://i1l5qitfsa.execute-api.eu-south-1.amazonaws.com/prod`; `runLiveAnalysis` esegue `fetch(API_URL+'/analyze/text')` | Lo scanner usa AWS, non una simulazione locale né Render. Il contatore ospiti nel browser è aggirabile. La demo statica è distinta dallo scanner. |
| Repository iniziale | API URL `orvex-server.onrender.com`, autenticazione Supabase, checkout autenticato obbligatorio | Divergente dal pubblico. Le due modifiche locali già presenti puntavano allo staging corretto e sono conservate. |
| Staging Render | `GET /api/guard/health` 200; preflight scanner 204 con origine pubblica ammessa | Servizio raggiungibile, CORS corretto per il sito. |
| Scanner remoto | testo vuoto 400; JWT inventato 401; ospite con testo innocuo 503 `Analisi ospiti temporaneamente non disponibile` | Gate proxy non abilitato; AI completa remota non dimostrata. Nessun testo sensibile inviato. |
| Profilo remoto | senza JWT 401 | Autorizzazione base verificata. |
| Supabase | Lettura OpenAPI tramite service role: tabelle profili, abbonamenti, eventi, intenti e contatori; 9 RPC Guard presenti | Schema già operativo, ma definizioni SQL precedenti non presenti in Git e non esportabili tramite questo accesso REST. Nessuna riga cliente letta o modificata. |
| Stripe | GET dei quattro Payment Links e relativi prezzi | Tutti Live, attivi, URL esattamente quelli pubblici; conferma ospitata Stripe, nessun redirect dopo pagamento. |
| Webhook Stripe | tentativo di elenco endpoint | Chiave ristretta: `more_permissions_required`. Destinazione, secret ed eventi del webhook operativo non verificabili con questa chiave. |
| AWS | sorgente pubblica + inventario fornito | Nessun accesso alla console AWS o cancellazione; inventario completo da acquisire. |

Markup e CSS prima dello script della pagina pubblica coincidono byte per byte dopo normalizzazione LF. SHA256: `74c68fd920f4daa7135465c5cb04e390fa142fb17882640423e8294d20f46636`. Un test impedisce variazioni. Non è un confronto screenshot completo degli stati dinamici: il ramo precedente aveva già un renderer risultati differente dal pubblico.

## Correzioni incluse

- Ripristinati i quattro URL Stripe Live originali e l'apertura diretta senza login o chiamate preliminari. Nessun Payment Link riconfigurato.
- Conservati messaggio «Registrati per continuare», offerta FREE e aspetto statico. Il messaggio ospiti viene mostrato quando il server esaurisce la quota, senza affidarsi a localStorage.
- Acquisti diretti: il webhook rilegge checkout, prodotto, quantità, Payment Link, cliente e abbonamento da Stripe. Ignora `client_reference_id` per l'attribuzione degli acquisti diretti, perché modificabile nel link pubblico.
- L'acquisto viene salvato senza assegnare un account. Il periodo pagato viene ricavato dalla fattura verificata. Rinnovi e annullamenti funzionano anche prima dell'associazione dell'account.
- Al login/lettura profilo, una RPC verifica direttamente `auth.users.email_confirmed_at` e associa gli acquisti all'email confermata corrispondente alla fotografia `customer_details.email` del checkout. Il browser non invia email, piano, customer ID o proprietario da considerare attendibili. Un acquisto già assegnato non passa a un altro account, neppure dopo cambio/riuso email.
- Non si usa la sola email inserita al checkout come prova di identità: occorre confermarla con Supabase. Il controllo di quella casella è il criterio di titolarità del nuovo acquisto. Non viene applicato automaticamente agli account storici AWS.
- Eventi Test respinti prima di scrivere nel database Live; Sandbox resta bloccata finché non esiste un ambiente separato. Gestito anche `checkout.session.async_payment_succeeded`.
- Prima fattura riconciliata con una nuova transazione SQL: non riduce la scadenza di un rinnovo successivo e non riattiva una cancellazione concorrente.
- Autenticazione Supabase inizializzata dopo il caricamento dell'ambiente; email confermata richiesta allo scanner autenticato.
- Antiabuso: 30 richieste Guard/minuto per IP pseudonimizzato con contatore SQL condiviso; normalizzazione IPv4/IPv6 e quota per /64 IPv6; indisponibilità della protezione blocca le richieste. Webhook escluso dal limite per non interrompere i retry Stripe.
- AI: timeout già presente, validazione dei campi restituiti, errori 503 senza risultati inventati; quota individuale e tetto globale già presenti conservati. Corpi JSON limitati a 16 KB e messaggi di errore senza stack o segreti.
- Aggiornamenti compatibili delle dipendenze, test ripetibili e workflow CI senza deploy.

## Test e limiti della prova

Da `orvex-breach-shield`: `npm ci`, `npm test`, `npm run build`, `npm audit --omit=dev`.

40 test superati alla preparazione della PR. API Stripe/Supabase/OpenAI simulate; verifica crittografica reale delle firme Stripe sintetiche; migrazioni nuove eseguite in PostgreSQL locale PGlite con fixture del contratto precedente. Nessun pagamento reale, nessuna registrazione di utenti operativi, nessuna chiamata AI a pagamento durante la suite. Test: quattro piani mensili/annuali, acquisti senza account, pagamento non effettuato, cliente/prezzo/quantità errati, eventi differiti, fatture, annullamenti, concorrenza e risposta SQL persa, proprietà account, permessi SQL, limiti, email non verificata, JWT errati, abbonamento scaduto/cancellato e indisponibilità AI/database.

Le RPC **preesistenti** di rinnovo, lease, cancellazione, aggiornamento piano e quota sono simulate nei test Node, non esportate né eseguite dal database operativo. La fixture SQL non è un backup di produzione. Prima del passaggio è obbligatorio esportare e collaudare le loro definizioni effettive, incluso il caso `auth_user_id IS NULL` dei nuovi acquisti. Il build Vite passa con avviso di bundle grande. Audit produzione: zero vulnerabilità; audit completo conserva due segnalazioni Vite/esbuild di sviluppo, risolvibili con aggiornamento major separato. `npm run lint` non è eseguibile: nel repository manca la configurazione ESLint; non viene dichiarato superato.

## Operazioni ancora necessarie prima del passaggio

1. **Accesso amministrativo a Render e Supabase SQL**: esportare schema/RLS/RPC correnti e backup cifrato. Non pubblicare backup o righe clienti in Git. Verificare vincoli univoci `guard_profiles.auth_user_id`, permessi service-role-only delle RPC mutanti e RLS dei profili. Il solo REST service role non consente esportazione SQL o applicazione DDL.
2. **Staging isolato**: applicare in ordine le due migrazioni in `supabase/migrations/` su una copia di collaudo dello schema corrente. Sono additive e transazionali, non sono un bootstrap completo e non vanno rieseguite senza tracking delle migrazioni. Conservare i record dei nuovi acquisti anche in caso di rollback applicativo.
3. **Configurare Render** con root `orvex-breach-shield`, Node 24, `npm ci --omit=dev`, `npm start`, health `/api/guard/health`, variabili in `.env.guard.example`. Nessuna chiave nel frontend. Non cambiare l'ambiente del servizio pubblico con queste istruzioni. Per locale: `node --env-file=.env.guard.local server/index.js`, completando le variabili mancanti nel file privato.
4. **Verificare proxy prima di abilitare gli ospiti**: confrontare in log temporanei protetti `socket.remoteAddress`, `req.ip`, `req.ips` su richieste da due reti note, poi ripetere con `X-Forwarded-For` inventato e catene multiple. Non conservare IP grezzi oltre il collaudo. `one-hop` è corretto soltanto se l'ultimo hop attendibile identifica il client e impedisce spoofing, su tutti i percorsi d'ingresso. Non impostare `trust proxy=true`. Adattare a CIDR attendibili se necessario, quindi `GUARD_GUEST_IP_VERIFIED=true`. Al momento questo controllo remoto manca; non aggirare il blocco 503 impostando semplicemente il flag.
5. **Collaudare Auth/AI**: account di prova con email confermata e profilo FREE, refresh token, password, doppio IP ospiti, 2 analisi ospiti e 3 FREE al giorno UTC; testo senza URL e con URL; errore provider, concorrenza, limiti, CORS. Verificare SMTP e redirect di conferma Supabase verso le pagine appropriate. Le credenziali dei vecchi account AWS non sono password Supabase.
6. **Webhook**: ottenere permesso di lettura/gestione endpoint Stripe (non cambiare pulsanti o Payment Links). Endpoint previsto `/api/guard/stripe/webhook`; eventi `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`. Installare il suo signing secret solo sul backend. La chiave disponibile non permette di verificare o impostare gli endpoint. Non inviare eventi Test al database condiviso.
7. **Collaudo Stripe esterno senza denaro reale**: Sandbox e Supabase separati, prezzi e link di test separati, supporto esplicito della modalità test su quel deployment. Il backend conserva intenzionalmente il blocco Sandbox condivisa. Verificare con test clock prima fattura, rinnovo, mancato pagamento, cancellazione a fine periodo, annullamento immediato e ordine invertito dei webhook. Verificare che le RPC esistenti non diano accesso senza `paid_through` futuro.
8. **Acquisti pregressi**: riconciliare con un job amministrativo gli acquisti diretti precedentemente rifiutati/mancanti, rileggendo checkout e fatture da Stripe con le stesse verifiche. Non basta reinviare un evento già marcato `rejected`, perché la lease lo considera terminale. Nessun backfill operativo è stato eseguito. Utenti storici AWS restano soggetti a recupero verificato; non collegarli per semplice coincidenza email.
9. **Onboarding dopo acquisto**: i link attuali mostrano solo la conferma ospitata Stripe, senza ritorno al sito. Il cliente può registrarsi/accedere con l'email usata per l'acquisto e riceve il piano al caricamento del profilo. Un invito email/istruzioni automatiche dopo l'acquisto resta da configurare; nessuna email inviata in questa attività e nessun link modificato. Gli acquisti con email errata richiedono recupero assistito verificato.
10. **Parità commerciale**: i limiti Premium 10 e Small B2B 20/giorno e il cap AI 20/giorno sono valori conservativi già presenti, non dimostrano l'offerta pubblica «illimitate». Funzioni screenshot, team da 25 utenti, training/report NIS2 e feed pubblicizzati non sono provate da questa migrazione dello scanner. Non presentare l'intero prodotto come collaudato finché questi punti non sono verificati.
11. Solo dopo evidenze firmate dei punti precedenti: approvare pubblicazione del frontend e passaggio del traffico. Questa PR resta draft e non va unita automaticamente. Nessun deploy pubblico è stato eseguito.

## Dismissione AWS: inventario e procedura reversibile

Dipendenze oggi ancora necessarie: API Gateway `i1l5qitfsa` stage `prod` in `eu-south-1` per lo scanner pubblico; Lambda `analyzeText`, `register`, `login`, `getProfile`, `activate`; DynamoDB `orvex-guard-guest-limits-prod`. Gli account storici, password/attivazioni, token e dati profilo devono avere un percorso di recupero verificato prima della dismissione.

Non ci sono riferimenti eseguibili AWS nel codice Guard tracciato del ramo aggiornato. Questo **non** dimostra che il resto dell'account AWS sia inutilizzato. Inventariare in sola lettura: integrazioni API Gateway, tutte le Lambda e variabili, tabelle utenti/profili/abbonamenti oltre alla tabella ospiti, stream/TTL/PITR, CloudWatch, EventBridge, code/DLQ, IAM, Secrets Manager/SSM, SES/email di attivazione, DNS Route53, CloudFront/S3 e eventuali webhook Stripe verso AWS. Verificare anche script esterni, pagine pubblicate fuori Git e client che conservano la vecchia API. Nessuna di queste risorse aggiuntive è stata confermata via console.

Sequenza dopo il collaudo:

1. Esportare configurazioni, codice Lambda e dati con backup cifrati, retention concordata e prova di ripristino. Annotare conteggi, hash e orari di ultimo aggiornamento; non loggare password/token.
2. Riconciliare utenti e abbonamenti con prove di proprietà e fatture; non convertire automaticamente il campo piano storico in entitlement pagato. Definire reset password, attivazioni pendenti e ultima sincronizzazione dati.
3. Pubblicare solo con autorizzazione successiva; mantenere AWS funzionante come rollback. Controllare nel browser richieste effettive a Render e assenza di chiamate AWS in tutti i flussi; svuotare cache/CDN solo quando previsto.
4. Osservare errori, quote, AI, webhook e rinnovi per almeno un ciclo mensile; usare test clock per cicli annuali senza aspettare un anno. Confrontare CloudWatch/API Gateway per richieste residue e clienti vecchi. Zero richieste per una giornata non basta.
5. Rollback: ripristinare gli HTML precedenti e l'API AWS, mantenendo invariati i link Stripe. Conservare acquisti/webhook già ricevuti su Supabase e riconciliare i delta; non reimpostare ownership o scadenze tramite vecchi snapshot.
6. Presentare inventario finale con evidenze e piano di recupero, chiedere autorizzazione esplicita alla dismissione. **Non cancellare alcuna risorsa come parte di questa PR.** La successiva rimozione deve rispettare retention fiscale, contrattuale e privacy applicabile.

Manutenzione contatori: pianificare una pulizia protetta di `guard_request_windows` con `window_start < now() - interval '7 days'` e dei contatori giornalieri secondo retention concordata; non cancellare eventi/acquisti necessari a retry e riconciliazione.

Riferimenti tecnici: [Express e proxy](https://expressjs.com/en/guide/behind-proxies/), [eventi Stripe](https://docs.stripe.com/api/events/types), [firma webhook](https://docs.stripe.com/webhooks/signature), [sito pubblico verificato](https://orvexintelligence.com/orvex-guard.html).
