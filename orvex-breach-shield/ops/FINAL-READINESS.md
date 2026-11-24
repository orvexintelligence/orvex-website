# Stato finale verificabile — 24 novembre 2026

**NO-GO alla pubblicazione e alla dismissione AWS.** I risultati locali non dimostrano un servizio Render completamente funzionante.

## Correzioni dopo e452fdf

- Preflight compatibile con `guard_refresh_user_plan(uuid) RETURNS text` e con la precedente fixture `void`. Le nuove funzioni usano `PERFORM`: il valore restituito non è necessario. Non viene sostituita, alterata o eseguita la funzione operativa. Test di regressione verificano che il corpo della funzione text resti identico, le due wrapper funzionino e i profili preesistenti restino presenti; tipi incompatibili sono respinti.
- Bundle SQL rigenerato con checksum e controlli invariati di RLS/grant. Nessun SQL eseguito sul DB operativo; backup/ripristino non ancora disponibili e quindi applicazione vietata.
- `.node-version=24` e `engines.node=24.x` nel progetto. Un eventuale `NODE_VERSION` esplicito in Render può avere precedenza: la configurazione dichiarata non equivale a runtime verificato. Health ora espone solo versione major e revisione, senza segreti, per controllare il deploy. **Verificato dopo il push: Node 24 effettivo, revisione `69faf86ab64c4ab88f61a5aaaef47e3dcd0d51f9`.**
- Diagnostica proxy in sola lettura, con HMAC distinto e scadenza 60 secondi. Non restituisce IP grezzi e non accede al database. `scripts/check-render-proxy.mjs` confronta richieste normali e header falsificati senza modificare quote o flag. L'uguaglianza di un'identità non dimostra che utenti su reti differenti siano distinti: non abilita automaticamente gli ospiti.

## Validazione locale

54/54 test superati (conservati i 51 precedenti), build riuscita, audit delle dipendenze di produzione: zero vulnerabilità. Anche GitHub Actions ha concluso con successo sulla revisione `69faf86`. Inclusi PostgreSQL isolato PGlite, rollback atomico, autorizzazioni su fixture, account FREE, quote scanner, webhook firmati e ciclo abbonamenti simulato. Nessun pagamento Sandbox reale eseguito.

## Servizi reali: verifiche di questa sessione

Fonte: `ops/evidence/service-audit.json` e `ops/evidence/final-api-checks.json`.

- Supabase REST service role: schema pubblico e firme RPC ancora leggibili; nuove tabelle non installate. Auth email attiva e conferma richiesta. Richiesta OpenAPI con chiave publishable restituisce 401: **non** permette di dedurre grant/RLS dal fatto che non restituisce funzioni.
- Nessun accesso SQL/PostgreSQL o backup verificato disponibile qui. Non sono stati ispezionati i corpi di tutte le vecchie RPC né le policy reali. Nessuna correzione ipotetica applicata ai 14 profili riportati dal proprietario.
- OpenAI: effettuata una richiesta reale con testo sintetico non personale; risultato valido, score 95, livello danger. È una verifica diretta del provider, **non** una scansione tramite Render.
- Render: Node 24 verificato sul nuovo deploy, health 200 e CORS 204. Scanner/profilo ancora 503 (`Protezione richieste non configurata`). Tre richieste alla diagnostica firmata con la credenziale locale restituiscono 403: firma/configurazione non accettata, causa precisa non determinabile senza accesso amministrativo. Non e una prova della correttezza del proxy. Evidenze: `render-runtime.json` e `render-proxy.json`. La riuscita del provider AI non aggira questo blocco.
- Stripe Live in sola lettura: esaminate tutte le 67 sessioni Checkout restituite dall'API disponibile; 27 fanno riferimento ai quattro Payment Links Guard, zero risultano complete e pagate. L'elenco abbonamenti restituisce zero sottoscrizioni. Nessuna associazione/backfill eseguita. Non è una prova sull'assenza di vendite manuali, dati archiviati, prodotti migrati o altri account Stripe.
- La chiave Stripe locale non può leggere i webhook (403). Il risultato **zero endpoint**, ottenuto nell'altra sessione e fornito dal proprietario, è registrato separatamente in `ops/evidence/user-verified-handoff.json`; non viene presentato come una lettura effettuata qui.
- Sito pubblico ancora su AWS; grafica statica e quattro link Stripe invariati. Nessuna pubblicazione, pagamento reale o modifica AWS.

## Accessi: differenza fra installato e utilizzabile

La ricerca plugin conferma Supabase, Render e Stripe installati e abilitati nell'account, ma questa sessione non espone i loro strumenti operativi. Non occorre reinstallarli né autorizzarli nuovamente alla cieca. Il tentativo di usare le console browser è stato fermato dal controllo di sicurezza perché non poteva determinare l'URL corrente: non è stato aggirato. Le chiavi locali disponibili coprono REST Supabase, provider OpenAI e parte delle letture Stripe, non la gestione Render/PostgreSQL/Sandbox.

## Verifiche ancora bloccanti

1. Backup ripristinabile e catalogo SQL completo: RPC, policy RLS, grant, vincoli, trigger e gestione utente NULL. Il tipo text è stato corretto nel preflight, ma non certifica il resto del database.
2. Copia Supabase isolata senza costi nuovi non autorizzati. I test PostgreSQL locali sono già isolati e gratuiti, ma non sostituiscono il collaudo sullo schema reale ripristinato.
3. Node 24 ora verificato. Restano disattivazione auto-deploy nello staging, proxy verificato e scanner Render reale per ospiti e FREE. Non impostare `GUARD_GUEST_IP_VERIFIED=true` senza prova.
4. Webhook configurato e Sandbox separata: acquisto senza account, associazione dopo verifica email, Premium/Small B2B, rinnovo, mancato pagamento e cancellazione. Il payload Live è pronto; non è stato creato un endpoint verso un backend non ancora pronto. La modalità Test resta bloccata sul database condiviso.
5. Recupero utenti AWS: il backend preserva il blocco 409 per profili storici; manca una procedura di recupero effettivamente collaudata con prova di titolarità. Non concedere piani a pagamento dal solo campo storico `plan` o da un'email non verificata. Le letture Stripe non provano il recupero dei 14 profili.

Occorre rendere utilizzabili in **questa sessione** le connessioni amministrative già installate, oppure proseguire in una sessione che le esponga. Con gli accessi si può completare il lavoro senza test manuali del proprietario. Se l'unico ambiente isolato/ripristino disponibile comportasse un costo, chiedere prima il consenso indicando importo e risorsa; non è stato assunto alcun costo nuovo per infrastrutture.

Il passaggio pubblico resta una decisione successiva esplicita, dopo tutti i controlli. AWS dovrà rimanere disponibile per osservazione e rollback. Non è richiesto modificare i Payment Links Live per effettuare il collaudo.
