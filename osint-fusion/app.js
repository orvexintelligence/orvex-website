const IS_LOCAL_FRONTEND = ["127.0.0.1", "localhost"].includes(window.location.hostname);
const DEFAULT_PUBLIC_API_BASE_URL = "https://orvex-osint-fusion-api.onrender.com";

function safeSavedApiBaseUrl() {
  let saved = "";
  try {
    saved = localStorage.getItem("ORVEX_API_BASE_URL") || "";
  } catch {
    saved = "";
  }
  if (!saved) return "";
  if (IS_LOCAL_FRONTEND) return saved;

  try {
    const savedUrl = new URL(saved);
    const allowedHosts = new Set(["orvex-osint-fusion-api.onrender.com"]);
    return allowedHosts.has(savedUrl.hostname) ? savedUrl.origin : "";
  } catch {
    return "";
  }
}

const API_BASE_URL =
  window.ORVEX_API_BASE_URL ||
  safeSavedApiBaseUrl() ||
  (IS_LOCAL_FRONTEND ? "http://127.0.0.1:8000" : DEFAULT_PUBLIC_API_BASE_URL);
const ANALYZE_ENDPOINT = API_BASE_URL.endsWith("/api/v1/analyze")
  ? API_BASE_URL
  : `${API_BASE_URL.replace(/\/$/, "")}/api/v1/analyze`;
const CASES_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/api/v1/cases`;
const ME_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/api/v1/me`;
const SESSION_LOCATION_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/api/v1/session/location`;
const LEGAL_ACCEPT_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/api/v1/legal/accept`;
const BILLING_CHECKOUT_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/api/v1/billing/checkout`;
const BILLING_PORTAL_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/api/v1/billing/portal`;
const STRIPE_PAYMENT_LINKS = {
  starter: {
    monthly: "https://buy.stripe.com/9B628r3wXgXo7xI69qbEA09",
    annual: "https://buy.stripe.com/14A7sL5F58qSdW669qbEA0a"
  },
  pro: {
    monthly: "https://buy.stripe.com/aFa7sLgjJePg5pAgO4bEA0b",
    annual: "https://buy.stripe.com/14A9AT9Vl9uWcS255mbEA0c"
  }
};
const FREE_ANALYSIS_LIMIT = 1;
const PASSWORD_RESET_COOLDOWN_SECONDS = 60;
const FREE_ANALYSIS_COUNT_KEY = "ORVEX_FREE_ANALYSIS_COUNT";
const LAST_ANALYSIS_KEY = "ORVEX_LAST_ANALYSIS_REPORT";
const CLIENT_ID_KEY = "ORVEX_CLIENT_ID";
const LEGAL_ACCEPTANCE_KEY = "ORVEX_LEGAL_ACCEPTED_2026_06_19";
const DEBUG_ENABLED = new URLSearchParams(window.location.search).get("debug") === "1";
const BASE_TO_IT = {
  "Orvex Intelligence Platform": "Piattaforma Orvex Intelligence",
  "OSINT Fusion for domain risk intelligence": "OSINT Fusion per intelligence sul rischio domini",
  "ORVEX INTELLIGENCE ENGINE": "MOTORE ORVEX INTELLIGENCE",
  "ORVEX / OSINT FUSION": "ORVEX / OSINT FUSION",
  "PUBLIC-SOURCE RISK INTELLIGENCE": "INTELLIGENCE DEL RISCHIO DA FONTI PUBBLICHE",
  "Domain trust map": "Mappa fiducia dominio",
  "Live OSINT checks for DNS, RDAP, HTTP security posture, AI risk briefing, and branded PDF reports.":
    "Controlli OSINT reali su DNS, RDAP, postura HTTP, briefing AI e report PDF brandizzati.",
  "Global risk intelligence": "Intelligence globale del rischio",
  "Operational intelligence": "Intelligence operativa",
  "Turn public signals into defensible domain, identity, company, and wallet risk decisions.":
    "Trasforma i segnali pubblici in valutazioni documentate del rischio per domini, identita, aziende e wallet.",
  "Transform fragmented public data into explainable risk intelligence for domains, identities, companies, and digital assets.":
    "Trasforma dati pubblici frammentati in intelligence del rischio spiegabile per domini, identita, aziende e asset digitali.",
  "Correlate public signals across domains, identities, companies, and digital assets with explainable risk scoring and audit-ready reports.":
    "Correli segnali pubblici su domini, identita, aziende e asset digitali con punteggi di rischio spiegabili e report pronti per audit.",
  "SOURCES": "FONTI",
  "Live OSINT": "OSINT live",
  "OUTPUT": "RISULTATO",
  "Risk memo": "Memo rischio",
  "CONTROL": "CONTROLLO",
  "Audit ready": "Pronto audit",
  "LIVE SIGNAL MAP": "MAPPA SEGNALI LIVE",
  "Session location": "Localita sessione",
  "Location unavailable": "Localita non disponibile",
  "Unavailable": "Non disponibile",
  "Local network": "Rete locale",
  "Approximate city and country from the connection IP. No GPS tracking.":
    "Citta e Paese approssimativi ricavati dall'IP di connessione. Nessun tracciamento GPS.",
  "Entity lookup": "Ricerca entita",
  "Company": "Azienda",
  "Email - Identity Shield": "Email - Identity Shield",
  "Wallet": "Wallet",
  "Identity Review": "Identity Review",
  "Run analysis": "Analizza",
  "Run Analysis": "Analizza",
  "Stop": "Stop",
  "Backend target:": "Backend:",
  "Confidence": "Affidabilita",
  "Backend debug": "Debug backend",
  "Analyze response": "Risposta analisi",
  "Endpoint": "Endpoint",
  "Status HTTP": "Stato HTTP",
  "JS Error": "Errore JS",
  "Export PDF": "Esporta PDF",
  "Request access": "Richiedi accesso",
  "Sign in": "Accedi",
  "Sign in / Create account": "Accedi / Crea account",
  "Create new account": "Crea nuovo account",
  "Sign out": "Esci",
  "Account": "Account",
  "Client dashboard": "Dashboard cliente",
  "Account & subscription": "Account e abbonamento",
  "Current plan": "Piano attuale",
  "No active subscription": "Nessun abbonamento attivo",
  "Usage": "Utilizzo",
  "Billing": "Fatturazione",
  "View plans": "Vedi piani",
  "Refresh": "Aggiorna",
  "Create an account to save cases and activate a plan.": "Crea un account per salvare i casi e attivare un piano.",
  "One free live scan included": "Una analisi live gratuita inclusa",
  "Choose Starter or Pro to activate paid access.": "Scegli Starter o Pro per attivare l'accesso a pagamento.",
  "Orvex account": "Account Orvex",
  "Access OSINT Fusion": "Accesso a OSINT Fusion",
  "Email": "Email",
  "Password": "Password",
  "Forgot password?": "Password dimenticata?",
  "Back to sign in": "Torna al login",
  "Full name": "Nome completo",
  "Company": "Azienda",
  "Create an account to save investigations, track usage, and activate paid plans.":
    "Crea un account per salvare indagini, monitorare utilizzo e attivare piani a pagamento.",
  "New case": "Nuovo caso",
  "Overview": "Panoramica",
  "Analyze": "Analizza",
  "Pricing": "Prezzi",
  "Dashboard": "Dashboard",
  "Cases": "Casi",
  "Investigations": "Indagini",
  "Sources": "Fonti",
  "Audit Log": "Registro audit",
  "Case history": "Storico casi",
  "Saved investigations": "Indagini salvate",
  "DNS intelligence": "Intelligence DNS",
  "Resolution & mail posture": "Risoluzione e postura email",
  "HTTP/S security": "Sicurezza HTTP/S",
  "Headers & transport": "Header e trasporto",
  "RDAP registry": "Registro RDAP",
  "Registration data": "Dati registrazione",
  "Live modules": "Moduli attivi",
  "Linked signals": "Segnali collegati",
  "Risk score": "Punteggio rischio",
  "Sources checked": "Fonti controllate",
  "Current dossier": "Dossier corrente",
  "Relationship graph": "Grafo relazioni",
  "Entity network": "Rete entita",
  "Analyst timeline": "Timeline analista",
  "Signals and events": "Segnali ed eventi",
  "Risk model": "Modello rischio",
  "Indicators": "Indicatori",
  "Report preview": "Anteprima report",
  "Briefing memo": "Memo briefing",
  "Compliance": "Compliance",
  "Audit trail": "Traccia audit",
  "Map": "Mappa",
  "Table": "Tabella",
  "Commercial access": "Accesso commerciale",
  "Plans for OSINT Fusion": "Piani per OSINT Fusion",
  "Start with domain risk reports, then scale into monitoring, team workflows, and API access.":
    "Parti dai report rischio dominio, poi scala verso monitoraggio, workflow team e accesso API.",
  "Monthly": "Mensile",
  "Annual - save 15%": "Annuale - risparmia 15%",
  "For solo analysts and early validation.": "Per analisti singoli e prime validazioni.",
  "Domain OSINT analysis": "Analisi OSINT domini",
  "Risk score and AI memo": "Risk score e memo AI",
  "PDF export": "Export PDF",
  "Saved case history": "Storico casi salvato",
  "For teams that need supplier and domain due diligence.": "Per team che fanno due diligence su fornitori e domini.",
  "Everything in Starter": "Tutto in Starter",
  "Priority report generation": "Generazione report prioritaria",
  "Saved cases with Supabase": "Casi salvati con Supabase",
  "Brandable PDF reports": "Report PDF brandizzabili",
  "For security teams, compliance, and vendor risk workflows.":
    "Per security team, compliance e workflow vendor risk.",
  "Team dashboard": "Dashboard team",
  "Domain Watch integration": "Integrazione Domain Watch",
  "API access roadmap": "Roadmap accesso API",
  "Custom onboarding": "Onboarding personalizzato",
  "Activate": "Attiva",
  "Contact me": "Contattami",
  "Custom": "Su richiesta",
  "/ analyst": "/ analista",
  "/ month": "/ mese",
  "/ year": "/ anno",
  "Run an analysis to populate DNS records.": "Avvia un'analisi per popolare i record DNS.",
  "Run an analysis to inspect HTTP security headers.": "Avvia un'analisi per ispezionare gli header HTTP.",
  "Run an analysis to inspect RDAP registration data.": "Avvia un'analisi per ispezionare i dati RDAP.",
  "Run an analysis to populate saved investigations.": "Avvia un'analisi per popolare le indagini salvate.",
  "Report package prepared": "Pacchetto report preparato",
  "Backend response received": "Risposta backend ricevuta",
  "Entity rendered": "Entita renderizzata",
  "Risk findings": "Finding di rischio",
  "Source capture": "Acquisizione fonti",
  "Model review": "Revisione modello",
  "Report draft": "Bozza report",
  "Analyst guidance": "Guida analista",
  "Recommendations": "Raccomandazioni",
  "Run an analysis to generate operational recommendations.": "Avvia un'analisi per generare raccomandazioni operative.",
  "OSINT Fusion provides lawful open-source intelligence and security posture analysis. It does not perform unauthorized access, exploitation, surveillance, or private-data collection.":
    "OSINT Fusion fornisce analisi OSINT lecita e postura di sicurezza. Non esegue accessi non autorizzati, exploit, sorveglianza o raccolta di dati privati.",
  "I confirm lawful OSINT use only and accept the Privacy Policy, Terms, and Acceptable Use Policy.":
    "Confermo l'uso OSINT lecito e accetto Privacy Policy, Termini e Acceptable Use Policy.",
  "Legal protection": "Protezione legale",
  "Lawful OSINT operating terms": "Condizioni operative OSINT lecite",
  "Orvex OSINT Fusion is provided for lawful cybersecurity, supplier due diligence, fraud-risk review, compliance support, and defensive intelligence workflows only. Reports are analytical outputs from public sources and third-party providers; they are not legal proof, private investigation reports, surveillance services, or automated decisions.":
    "Orvex OSINT Fusion e fornito solo per cybersecurity lecita, due diligence fornitori, revisione rischio frode, supporto compliance e workflow di intelligence difensiva. I report sono output analitici da fonti pubbliche e provider terzi; non sono prove legali, investigazioni private, servizi di sorveglianza o decisioni automatizzate.",
  "Orvex OSINT Fusion is provided for lawful cybersecurity, supplier due diligence, fraud-risk review, compliance support, and defensive intelligence workflows only. Reports are analytical outputs from public sources and third-party providers; they are not legal proof, private investigation reports, surveillance services, automated decisions, legal advice, credit decisions, employment screening, or a substitute for human verification. Users are responsible for having a lawful basis, authorization, and compliance with applicable privacy, data-protection, cybersecurity, and platform-use laws before running any analysis.":
    "Orvex OSINT Fusion e fornito solo per cybersecurity lecita, due diligence fornitori, revisione rischio frode, supporto compliance e workflow di intelligence difensiva. I report sono output analitici da fonti pubbliche e provider terzi; non sono prove legali, investigazioni private, servizi di sorveglianza, decisioni automatizzate, consulenza legale, decisioni creditizie, screening lavorativo o sostituti della verifica umana. Gli utenti sono responsabili di avere una base giuridica, autorizzazione e conformita alle leggi applicabili su privacy, protezione dati, cybersecurity e uso delle piattaforme prima di avviare analisi.",
  "Privacy Policy": "Privacy Policy",
  "Explains account data, audit logs, IP addresses, reports, payment processors, retention, and user rights.":
    "Spiega dati account, audit log, indirizzi IP, report, processori di pagamento, conservazione e diritti utente.",
  "Explains account data, audit logs, IP addresses, OSINT reports, third-party providers, payment processors, retention, security controls, and user privacy rights.":
    "Spiega dati account, audit log, indirizzi IP, report OSINT, provider terzi, processori di pagamento, conservazione, controlli di sicurezza e diritti privacy degli utenti.",
  "Terms and Conditions": "Termini e condizioni",
  "Defines subscription access, acceptable use, limitations, refunds, service availability, and liability limits.":
    "Definisce accesso abbonamento, uso accettabile, limiti, rimborsi, disponibilita servizio e limiti di responsabilita.",
  "Defines subscription access, payment renewal, cancellation, acceptable use, service availability, report limitations, refunds, and liability limits.":
    "Definisce accesso all'abbonamento, rinnovo pagamenti, cancellazione, uso accettabile, disponibilita del servizio, limiti dei report, rimborsi e limiti di responsabilita.",
  "Acceptable Use Policy": "Acceptable Use Policy",
  "Prohibits stalking, doxxing, harassment, unauthorized access, exploitation, illegal profiling, and misuse of personal data.":
    "Vieta stalking, doxxing, molestie, accessi non autorizzati, exploit, profilazione illecita e abuso di dati personali.",
  "Prohibits stalking, doxxing, harassment, unauthorized access, exploitation, credential abuse, unlawful profiling, surveillance, and misuse of personal data.":
    "Vieta stalking, doxxing, molestie, accessi non autorizzati, exploit, abuso di credenziali, profilazione illecita, sorveglianza e uso improprio di dati personali.",
  "Report Disclaimer": "Disclaimer report",
  "Requires human review and source verification before operational, legal, HR, credit, or compliance decisions.":
    "Richiede revisione umana e verifica delle fonti prima di decisioni operative, legali, HR, credito o compliance."
  ,
  "Requires human review, source verification, and professional judgment before operational, legal, HR, credit, security, or compliance decisions.":
    "Richiede revisione umana, verifica delle fonti e giudizio professionale prima di decisioni operative, legali, HR, creditizie, di sicurezza o compliance."
};
const I18N = {
  en: {
    runAnalysis: "Run Analysis",
    analyzing: "Analyzing...",
    activate: "Activate",
    contactMe: "Contact me",
    annual: "Annual pricing selected",
    monthly: "Monthly pricing selected",
    year: "/ year",
    month: "/ month",
    invalidDomain: "Enter a valid domain before running analysis",
    reportRendered: "Report rendered from backend response",
    newCase: "Ready for a new domain analysis",
    stripeMissing: "Stripe payment link is not configured yet for this plan.",
    stripeOpening: "Opening secure Stripe checkout",
    noActiveAnalysis: "No active analysis to stop",
    stopped: "Analysis stopped. You can start a new search.",
    trialUsed: "Free analysis used",
    trialLimit: "Free scan used. Choose a monthly or annual Starter/Pro plan to continue."
  },
  it: {
    runAnalysis: "Analizza",
    analyzing: "Analisi in corso...",
    activate: "Attiva",
    contactMe: "Contattami",
    annual: "Prezzo annuale selezionato",
    monthly: "Prezzo mensile selezionato",
    year: "/ anno",
    month: "/ mese",
    invalidDomain: "Inserisci un dominio valido prima di avviare l'analisi",
    reportRendered: "Report generato dalla risposta del backend",
    newCase: "Pronto per una nuova analisi dominio",
    stripeMissing: "Il link di pagamento Stripe non e ancora configurato per questo piano.",
    stripeOpening: "Apro il checkout sicuro Stripe",
    noActiveAnalysis: "Nessuna analisi attiva da fermare",
    stopped: "Analisi fermata. Puoi avviare una nuova ricerca.",
    trialUsed: "Analisi gratuita usata",
    trialLimit: "Analisi gratuita usata. Scegli un piano Starter/Pro mensile o annuale per continuare."
  }
};
let currentLanguage = localStorage.getItem("ORVEX_LANG") || "en";

function t(key) {
  return I18N[currentLanguage]?.[key] || I18N.en[key] || key;
}

const cases = [
  {
    name: "orvexintelligence.com",
    type: "Domain",
    confidence: 82,
    risk: 42,
    linked: 31,
    riskLabel: "Moderate risk",
    summary:
      "Public-facing intelligence domain selected for live OSINT due-diligence analysis through the Orvex FastAPI backend.",
    tags: ["Domain intelligence", "Live backend", "Due diligence", "Public OSINT"],
    nodes: [
      ["orvexintelligence.com", "Domain", 50, 48, "core"],
      ["DNS records", "Source", 28, 28, ""],
      ["Certificate logs", "Source", 72, 26, ""],
      ["Brand surface", "Signal", 24, 68, ""],
      ["Risk briefing", "AI report", 68, 68, "warning"],
      ["Audit trail", "Compliance", 51, 82, ""]
    ],
    edges: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [3, 5],
      [4, 2]
    ],
    indicators: [
      ["Domain posture", 48, ""],
      ["Public footprint", 54, ""],
      ["Source readiness", 76, "high"],
      ["Report confidence", 82, ""]
    ],
    timeline: [
      ["LIVE", "Backend endpoint armed", "Run Analysis will call POST /api/v1/analyze and persist audit/report records in Supabase."],
      ["QUEUE", "OpenAI briefing", "The backend requests a JSON risk briefing and returns risk_score plus summary."],
      ["LOG", "Compliance event", "The request IP is captured from X-Forwarded-For and stored in audit_logs."]
    ],
    memo:
      "Awaiting live analysis. Enter a domain and run the backend pipeline to generate an intelligence memo, update risk score, save the report, and create an audit trail."
  },
  {
    name: "arclight-systems.io",
    type: "Domain",
    confidence: 76,
    risk: 61,
    linked: 27,
    riskLabel: "Moderate risk",
    summary:
      "Technology domain with fast-changing infrastructure, overlapping DNS patterns, and possible impersonation risk against defense-adjacent suppliers.",
    tags: ["DNS", "Brand impersonation", "Infrastructure", "Supplier risk"],
    nodes: [
      ["arclight-systems.io", "Domain", 48, 50, "core"],
      ["198.51.100.42", "Host", 24, 32, ""],
      ["mail-arclight.com", "Domain", 70, 30, "warning"],
      ["ArcLight Systems LLC", "Company", 26, 70, ""],
      ["TLS cert cluster", "Certificate", 70, 70, ""]
    ],
    edges: [
      [0, 1],
      [0, 2],
      [0, 3],
      [2, 4],
      [1, 4]
    ],
    indicators: [
      ["Infrastructure volatility", 78, "high"],
      ["Brand similarity", 69, "high"],
      ["Mail security posture", 48, ""],
      ["Source reliability", 76, ""]
    ],
    timeline: [
      ["2026-06-01", "MX records changed", "Mail routing moved to a provider commonly seen in short-lived campaigns."],
      ["2026-05-25", "Certificate issued", "Certificate transparency logs show a related domain with similar naming."],
      ["2026-05-20", "Supplier mention", "Public procurement pages reference a similarly named legitimate supplier."]
    ],
    memo:
      "The domain should be treated as a monitoring priority. Signals do not confirm malicious activity, but infrastructure behavior and naming overlap justify brand-protection review and supplier outreach."
  },
  {
    name: "helios-meridian.example",
    type: "Domain",
    confidence: 82,
    risk: 74,
    linked: 43,
    riskLabel: "Elevated risk",
    summary:
      "Demo domain representing a cross-border holding company with opaque beneficial ownership and procurement-linked infrastructure.",
    tags: ["Beneficial ownership", "Supply chain", "Sanctions proximity", "Domain cluster"],
    nodes: [
      ["helios-meridian.example", "Domain", 50, 48, "core"],
      ["Vatrax Logistics", "Vendor", 28, 28, "warning"],
      ["meridian-procure.net", "Domain", 72, 26, ""],
      ["Northline Trust", "Beneficial owner", 24, 68, ""],
      ["Wallet 0x8A...19F", "Crypto", 68, 68, "warning"],
      ["Port registry file", "Public record", 51, 82, ""]
    ],
    edges: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [3, 5],
      [4, 2]
    ],
    indicators: [
      ["Ownership opacity", 86, "critical"],
      ["Sanctions proximity", 71, "high"],
      ["Procurement anomaly", 64, "high"],
      ["Source reliability", 82, ""]
    ],
    timeline: [
      ["2026-05-29", "Domain cluster appeared", "Three procurement-themed domains registered through the same privacy-protected registrar within 22 minutes."],
      ["2026-05-18", "Beneficial owner mismatch", "Corporate registry filings list a trust structure that conflicts with vendor onboarding documents."],
      ["2026-04-30", "Wallet exposure identified", "A linked wallet received funds from an address marked by commercial risk feeds as mixer-adjacent."]
    ],
    memo:
      "Assessment indicates elevated counterparty risk. The strongest signals are ownership opacity, domain behavior consistent with front-office setup, and indirect exposure to high-risk financial rails."
  }
];

const state = {
  case: cases[0],
  analyzing: false,
  lastReportId: null,
  lastCaseId: null,
  progressTimer: null,
  progressValue: 0,
  activeController: null,
  lastAnalysis: null,
  authUser: null,
  authSession: null,
  authMode: "signin",
  accountData: null,
  serverUsage: null,
  passwordResetCooldownTimer: null,
  passwordResetCooldownRemaining: 0
};

const byId = (id) => document.getElementById(id);
const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const supabaseClient = null;

function hasSupabaseBrowserConfig() {
  return false;
}

function ensureSupabaseConfigPanel() {
  return null;
}

function revealSupabaseConfigPanel() {
  const panel = ensureSupabaseConfigPanel();
  if (!panel || !DEBUG_ENABLED) return;
  populateSupabaseConfigFields();
  panel.hidden = false;
  byId("supabaseUrlInput")?.focus();
}

function getClientId() {
  let clientId = localStorage.getItem(CLIENT_ID_KEY);
  if (!clientId) {
    clientId = crypto.randomUUID ? crypto.randomUUID() : `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  }
  return clientId;
}

function legalAccepted() {
  return localStorage.getItem(LEGAL_ACCEPTANCE_KEY) === "true" || byId("lawfulUseConsent")?.checked === true;
}

async function authHeaders(extra = {}) {
  const headers = {
    "Accept": "application/json",
    "x-orvex-client-id": getClientId(),
    ...extra
  };
  if (legalAccepted()) headers["x-orvex-legal-accepted"] = "true";

  const token = state.authSession?.access_token;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function riskLabel(score) {
  if (score >= 80) return "High risk";
  if (score >= 60) return "Elevated risk";
  if (score >= 35) return "Moderate risk";
  return "Low risk";
}

function riskTone(score) {
  if (score >= 80) return "high";
  if (score >= 60) return "elevated";
  return "";
}

function normalizeDomain(value) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0].split("?")[0];
}

function selectedEntityType() {
  const raw = byId("entityType")?.value || "domain";
  if (raw.toLowerCase().includes("company")) return "company";
  if (raw.toLowerCase().includes("wallet")) return "wallet";
  if (raw.toLowerCase().includes("person") || raw.toLowerCase().includes("identity review")) return "person";
  return raw.toLowerCase().includes("email") ? "email" : "domain";
}

function currentEntityInputValue(entityType = selectedEntityType()) {
  const mainValue = byId("entityInput")?.value || "";
  if (entityType !== "company") return mainValue;

  const companyName = mainValue.trim();
  const companyDomain = byId("companyDomainInput")?.value?.trim() || "";
  const companyVat = normalizeVatInput(byId("companyVatInput")?.value?.trim() || "");
  return [companyName, companyDomain, companyVat].filter(Boolean).join(" | ");
}

function normalizeVatInput(value) {
  const cleaned = value.replace(/[^a-z0-9]/gi, "").toUpperCase();
  if (/^\d{11}$/.test(cleaned)) return `IT${cleaned}`;
  return cleaned;
}

function normalizeEntityValue(value, entityType) {
  if (entityType === "email") return value.trim().toLowerCase();
  if (entityType === "company") return value.trim().replace(/\s+/g, " ");
  if (entityType === "wallet") return value.trim();
  if (entityType === "person") return value.trim().replace(/\s+/g, " ");
  return normalizeDomain(value);
}

function isValidEntity(value, entityType) {
  if (entityType === "email") return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(value);
  if (entityType === "company") {
    const trimmed = value.trim();
    return trimmed.length >= 2 || /^[A-Z]{2}[A-Z0-9]{8,12}$/i.test(trimmed) || /^\d{11}$/.test(trimmed);
  }
  if (entityType === "wallet") return /^0x[a-fA-F0-9]{40}(?:\s*\|\s*[a-zA-Z0-9_-]+)?$/.test(value.trim());
  if (entityType === "person") return value.trim().length >= 2;
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(value);
}

function entityValidationMessage(entityType) {
  if (entityType === "company") return "Enter a company name or official domain before running analysis";
  if (entityType === "wallet") return "Enter a valid EVM wallet address before running analysis";
  if (entityType === "person") return "Enter a name, email, domain, or public link for Identity Review";
  return entityType === "email"
    ? "Enter a valid email address before running analysis"
    : t("invalidDomain");
}

function render() {
  const c = state.case;
  byId("entityType").value = (c.type || "domain").toLowerCase();
  byId("confidenceValue").textContent = `${c.confidence}%`;
  document.querySelector(".meter i").style.width = `${c.confidence}%`;
  byId("linkedCount").textContent = c.linked;
  renderRiskScore(c.risk);
  byId("dossierName").textContent = c.name;
  byId("riskPill").textContent = c.riskLabel;
  byId("dossierSummary").textContent = c.summary;
  byId("tags").innerHTML = c.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  renderGraph(c);
  renderIndicators(c);
  renderTimeline(c);
  renderMemo(c);
  renderAudit(c);
  byId("apiTarget").textContent = API_BASE_URL.replace(/^https?:\/\//, "");
}

function renderRiskScore(score) {
  const orb = byId("riskOrb");
  byId("riskScore").textContent = score;
  orb.style.setProperty("--risk", score);
  orb.classList.toggle("elevated", score >= 60 && score < 80);
  orb.classList.toggle("high", score >= 80);
}

function renderGraph(c) {
  const graph = byId("graph");
  graph.innerHTML = "";
  c.edges.forEach(([a, b]) => {
    const from = c.nodes[a];
    const to = c.nodes[b];
    const dx = to[2] - from[2];
    const dy = to[3] - from[3];
    const edge = document.createElement("div");
    edge.className = "edge";
    edge.style.left = `${from[2]}%`;
    edge.style.top = `${from[3]}%`;
    edge.style.width = `${Math.sqrt(dx * dx + dy * dy)}%`;
    edge.style.transform = `rotate(${Math.atan2(dy, dx) * (180 / Math.PI)}deg)`;
    graph.appendChild(edge);
  });
  c.nodes.forEach(([name, type, x, y, tone]) => {
    const node = document.createElement("div");
    node.className = `node ${tone}`;
    node.style.left = `${x}%`;
    node.style.top = `${y}%`;
    node.innerHTML = `<strong>${escapeHtml(name)}</strong><span>${escapeHtml(type)}</span>`;
    graph.appendChild(node);
  });
}

function renderIndicators(c) {
  byId("indicators").innerHTML = c.indicators
    .map(
      ([label, value, tone]) => `
        <div class="indicator">
          <div class="indicator-row"><span>${escapeHtml(label)}</span><span>${value}/100</span></div>
          <div class="bar ${tone}"><i style="width:${value}%"></i></div>
        </div>
      `
    )
    .join("");
}

function renderTimeline(c) {
  byId("timeline").innerHTML = c.timeline
    .map(
      ([date, title, body]) => `
        <article class="event">
          <time>${escapeHtml(date)}</time>
          <div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(body)}</p></div>
        </article>
      `
    )
    .join("");
}

function renderMemo(c) {
  byId("memo").innerHTML = `
    <p><strong>SUBJECT:</strong> ${escapeHtml(c.name)}</p>
    <p><strong>CONFIDENCE:</strong> ${c.confidence}% based on cited public records, commercial risk signals, and analyst review.</p>
    <p><strong>BRIEFING:</strong> ${escapeHtml(c.memo)}</p>
  `;
}

function renderAudit(c) {
  const auditItems = [
    ["Source capture", "Public records and risk-feed references indexed"],
    ["Model review", `${c.riskLabel} assigned with analyst override available`],
    ["Report draft", state.lastReportId ? `Report ${state.lastReportId} saved to Supabase` : "Briefing memo generated with source citations pending"]
  ];
  byId("audit").innerHTML = auditItems.map(([title, body]) => `<li><strong>${escapeHtml(title)}</strong>${escapeHtml(body)}</li>`).join("");
}

function setAnalysisState(active) {
  state.analyzing = active;
  const runButton = byId("runSearch");
  document.body.classList.toggle("analysis-active", active);
  if (runButton) {
    runButton.classList.toggle("loading", active);
    runButton.textContent = active ? t("analyzing") : t("runAnalysis");
    runButton.disabled = active;
  }
  document.querySelector(".memo")?.classList.toggle("updating", active);
  document.querySelector(".dossier")?.classList.toggle("updating", active);
  document.querySelector(".risk-panel")?.classList.toggle("updating", active);
  try {
    window.dispatchEvent(new CustomEvent("orvex-analysis-state", { detail: { active } }));
  } catch (error) {
    console.warn("Orvex 3D state event skipped:", error);
  }
}

function forceResetLoading() {
  state.analyzing = false;
  document.body.classList.remove("analysis-active");
  const runButton = byId("runSearch");
  if (runButton) {
    runButton.classList.remove("loading");
    runButton.textContent = t("runAnalysis");
    runButton.disabled = false;
  }
  document.querySelector(".memo")?.classList.remove("updating");
  document.querySelector(".dossier")?.classList.remove("updating");
  document.querySelector(".risk-panel")?.classList.remove("updating");
  try {
    window.dispatchEvent(new CustomEvent("orvex-analysis-state", { detail: { active: false } }));
  } catch (error) {
    console.warn("Orvex 3D reset event skipped:", error);
  }
}

function startProgress() {
  stopProgress(false);
  state.progressValue = 5;
  updateProgress(5, "Contacting backend");
  byId("analysisProgress")?.classList.add("active");
  byId("analysisProgress")?.setAttribute("aria-hidden", "false");

  state.progressTimer = window.setInterval(() => {
    const current = state.progressValue;
    let next = current;
    let label = "Collecting OSINT data";

    if (current < 25) {
      next = current + 4;
      label = "Contacting backend";
    } else if (current < 68) {
      next = current + 2;
      label = "DNS / HTTP / RDAP collection";
    } else if (current < 90) {
      next = current + 1;
      label = "Generating intelligence briefing";
    } else {
      next = 90;
      label = "Awaiting backend response";
    }

    updateProgress(next, label);
  }, 850);
}

function completeProgress() {
  updateProgress(100, "Report ready");
  window.setTimeout(() => stopProgress(true), 900);
}

function stopProgress(keepComplete) {
  if (state.progressTimer) {
    window.clearInterval(state.progressTimer);
    state.progressTimer = null;
  }

  if (!keepComplete) {
    updateProgress(0, "Standby");
    byId("analysisProgress")?.classList.remove("active");
    byId("analysisProgress")?.setAttribute("aria-hidden", "true");
  }
}

function updateProgress(value, label) {
  state.progressValue = Math.max(0, Math.min(100, Math.round(value)));
  const bar = byId("progressBar");
  const percent = byId("progressPercent");
  const labelEl = byId("progressLabel");
  if (bar) bar.style.width = `${state.progressValue}%`;
  if (percent) percent.textContent = `${state.progressValue}%`;
  if (labelEl) labelEl.textContent = label;
}

function setStopButton(active) {
  const stopButton = byId("stopAnalysis");
  if (!stopButton) return;
  stopButton.classList.toggle("active", active);
  stopButton.disabled = false;
}

function stopActiveAnalysis() {
  if (!state.activeController && !state.analyzing) {
    showToast(t("noActiveAnalysis"));
    setDebug({
      endpoint: "http://127.0.0.1:8000/api/v1/analyze",
      status: "idle",
      error: "-",
      raw: { state: "idle", message: t("noActiveAnalysis") }
    });
    return;
  }

  if (state.activeController) {
    state.activeController.abort();
  }
  state.activeController = null;
  setStopButton(false);
  stopProgress(false);
  forceResetLoading();
  setDebug({
    endpoint: "http://127.0.0.1:8000/api/v1/analyze",
    status: "stopped",
    error: "User stopped the analysis",
    raw: { state: "stopped_by_user" }
  });
  showToast(t("stopped"));
}

function revealResults() {
  [".memo", ".dossier", ".risk-panel"].forEach((selector) => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.remove("updating", "revealed");
    void el.offsetWidth;
    el.classList.add("revealed");
  });
}

async function runBackendAnalysis() {
  if (state.analyzing) return;
  const domain = normalizeDomain(byId("entityInput").value);
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    showToast("Enter a valid domain before running analysis", "error");
    byId("apiStatus").classList.add("error");
    byId("apiTarget").textContent = "invalid domain";
    return;
  }

  setAnalysisState(true);
  const loadingWatchdog = window.setTimeout(() => {
    if (state.analyzing) {
      console.warn("Orvex analysis watchdog reset loading state");
      forceResetLoading();
      showToast("Analysis timeout: loading state reset", "error");
    }
  }, 90000);
  showToast("Orvex analysis pipeline started");
  byId("apiStatus").classList.remove("error");
  byId("apiTarget").textContent = ANALYZE_ENDPOINT.replace(/^https?:\/\//, "");

  try {
    const response = await fetch(ANALYZE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(
        state.lastCaseId
          ? { entity_value: domain, case_id: state.lastCaseId }
          : { entity_value: domain }
      )
    });

    const data = await parseBackendJson(response);
    console.log("Analyze response", data);

    if (!response.ok) {
      throw new Error(readBackendError(data, response.status));
    }

    const normalized = normalizeBackendPayload(domain, data);
    applyBackendReport(domain, normalized);
    showToast("Live intelligence report generated");
  } catch (error) {
    console.error("Orvex analysis failed:", error);
    showToast(`Analysis failed: ${error.message}`, "error");
    byId("apiStatus").classList.add("error");
    byId("apiTarget").textContent = error.name === "SyntaxError" ? "invalid JSON response" : "backend offline or request rejected";
  } finally {
    window.clearTimeout(loadingWatchdog);
    forceResetLoading();
  }
}

async function parseBackendJson(response) {
  const rawText = await response.text();
  if (!rawText.trim()) {
    return {};
  }

  try {
    return JSON.parse(rawText);
  } catch (error) {
    showToast("Analysis failed: backend returned invalid JSON", "error");
    byId("apiStatus").classList.add("error");
    byId("apiTarget").textContent = "invalid JSON response";
    throw new SyntaxError(`Invalid backend JSON: ${rawText.slice(0, 180)}`);
  }
}

function readBackendError(payload, status) {
  if (!payload || typeof payload !== "object") return `Backend returned ${status}`;
  if (typeof payload.detail === "string") return payload.detail;
  if (Array.isArray(payload.detail)) return payload.detail.map((item) => item.msg || JSON.stringify(item)).join("; ");
  if (payload.detail && typeof payload.detail === "object") return payload.detail.message || JSON.stringify(payload.detail);
  if (typeof payload.error === "string") return payload.error;
  if (typeof payload.message === "string") return payload.message;
  return `Backend returned ${status}`;
}

function normalizeBackendPayload(domain, payload) {
  const source = payload && typeof payload === "object" ? payload : {};
  const osintData = source.osint_data || source.osint || source.content_json?.osint || {};
  const riskFromOsint = osintData?.risk?.risk_score;
  const rawScore = source.risk_score ?? source.riskScore ?? source.score ?? riskFromOsint ?? 0;
  const riskScore = Number.isFinite(Number(rawScore)) ? Math.max(0, Math.min(100, Math.round(Number(rawScore)))) : 0;
  const summary =
    source.summary ||
    source.ai_summary ||
    source.aiSummary ||
    source.content_json?.summary ||
    "Backend completed the analysis but did not return a briefing summary.";

  return {
    entity_value: source.entity_value || source.domain || osintData.domain || domain,
    case_id: source.case_id || source.caseId || null,
    report_id: source.report_id || source.reportId || null,
    risk_score: riskScore,
    summary,
    osint_data: osintData,
    sources_cited: source.sources_cited || source.sourcesCited || osintData.sources_cited || [],
    indicators: source.indicators || osintData.risk?.findings || []
  };
}

function applyBackendReport(domain, payload) {
  const score = Number.isFinite(Number(payload.risk_score)) ? Number(payload.risk_score) : 0;
  const osintData = payload.osint_data || {};
  const modules = osintData.modules || {};
  const findings = Array.isArray(payload.indicators) ? payload.indicators : [];
  const dnsOk = modules.dns?.ok ? 92 : 35;
  const httpOk = modules.http?.ok ? 88 : 30;
  const rdapOk = modules.rdap?.ok ? 84 : 35;
  state.lastReportId = payload.report_id || null;
  state.lastCaseId = payload.case_id || state.lastCaseId;
  state.case = {
    ...state.case,
    name: payload.entity_value || domain,
    type: "Domain",
    risk: score,
    confidence: Math.max(58, Math.min(94, 100 - Math.abs(score - 55))),
    riskLabel: riskLabel(score),
    summary: payload.summary || "Backend completed the analysis without a summary field.",
    tags: ["Live analysis", "OpenAI briefing", "Supabase audit", "Domain due diligence"],
    indicators: [
      ["Domain risk score", score, riskTone(score)],
      ["DNS collection", dnsOk, dnsOk < 50 ? "high" : ""],
      ["HTTP/S posture", httpOk, httpOk < 50 ? "high" : ""],
      ["RDAP coverage", rdapOk, rdapOk < 50 ? "high" : ""],
      ["Report persistence", payload.report_id ? 88 : 45, payload.report_id ? "" : "high"],
    ],
    timeline: [
      [new Date().toISOString().slice(0, 10), "Live analysis completed", "FastAPI returned a risk score and briefing summary for the submitted domain."],
      ["SUPABASE", "Report persisted", payload.report_id ? `Report ID ${payload.report_id} saved in intelligence_reports.` : "Report persistence did not return an ID."],
      ["OSINT", "Sources collected", `Sources: ${(payload.sources_cited || ["DNS", "RDAP", "HTTP headers"]).join(", ")}.`],
      ["FINDINGS", "Deterministic indicators", findings.length ? findings.slice(0, 3).join("; ") : "No deterministic indicators returned."]
    ],
    memo: payload.summary || "No briefing summary returned."
  };
  render();
  revealResults();
}

document.addEventListener("orvex-debug-report", (event) => {
  applyBackendReport(event.detail.domain, event.detail.payload);
});

function maybeRunMockSuccess() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("mock") !== "success") return;
  window.setTimeout(() => {
    applyBackendReport("orvexintelligence.com", {
      entity_value: "orvexintelligence.com",
      case_id: "11111111-1111-4111-8111-111111111111",
      report_id: "22222222-2222-4222-8222-222222222222",
      risk_score: 67,
      summary:
        "Preliminary OSINT assessment indicates elevated exposure. Public domain posture requires DNS, certificate transparency, sanctions proximity, vendor footprint, and brand impersonation review before operational trust is assigned."
    });
  }, 600);
}

async function handleCheckoutReturn() {
  const params = new URLSearchParams(window.location.search);
  const checkout = params.get("checkout");
  if (!checkout) return;

  if (checkout === "cancelled") {
    showToast("Checkout cancelled. You can choose a plan when ready.", "error");
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (checkout === "success") {
    showToast("Payment completed. Orvex will activate or follow up on your access.");
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  params.delete("checkout");
  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash || ""}`;
  window.history.replaceState({}, "", nextUrl);
}

function findCase() {
  const input = byId("entityInput").value.trim().toLowerCase();
  const selected = cases.find((item) => item.name.toLowerCase().includes(input) || input.includes(item.name.toLowerCase()));
  state.case = selected || cases[Math.floor(Math.random() * cases.length)];
  state.lastCaseId = null;
  state.lastReportId = null;
  render();
  showToast(selected ? "Dossier refreshed" : "Demo entity matched to nearest profile");
}

function showToast(message, type = "info") {
  const toast = byId("toast");
  toast.textContent = message;
  toast.classList.toggle("error", type === "error");
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), type === "error" ? 4200 : 2200);
}

function translateStaticText(lang) {
  const reverseMap = Object.fromEntries(Object.entries(BASE_TO_IT).map(([en, it]) => [it, en]));
  const textMap = lang === "it" ? BASE_TO_IT : reverseMap;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (["SCRIPT", "STYLE", "PRE", "TEXTAREA"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest("#debugRaw")) return NodeFilter.FILTER_REJECT;
      return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const current = node.nodeValue.trim();
    if (!textMap[current]) return;
    node.nodeValue = node.nodeValue.replace(current, textMap[current]);
  });
}

function updateLegalCopy(lang) {
  const copy = {
    en: {
      legalNoticeBadge:
        "Lawful use notice",
      legalIntro:
        "Use only for lawful cybersecurity, supplier due diligence, fraud-risk review, compliance, and defensive intelligence.",
      legalReviewNote:
        "Reports are analytical OSINT briefings from public/configured sources. They require human review before operational, legal, security, credit, HR, or compliance decisions.",
      legalPrivacyDesc:
        "Explains account data, audit logs, IP addresses, OSINT reports, third-party providers, payment processors, retention, security controls, and user privacy rights.",
      legalTermsDesc:
        "Defines subscription access, payment renewal, cancellation, acceptable use, service availability, report limitations, refunds, and liability limits.",
      legalUseDesc:
        "Prohibits stalking, doxxing, harassment, unauthorized access, exploitation, credential abuse, unlawful profiling, surveillance, and misuse of personal data.",
      legalDisclaimerDesc:
        "Requires human review, source verification, and professional judgment before operational, legal, HR, credit, security, or compliance decisions."
    },
    it: {
      legalNoticeBadge:
        "Avviso uso lecito",
      legalIntro:
        "Usa la piattaforma solo per cybersecurity lecita, due diligence fornitori, rischio frode, compliance e intelligence difensiva.",
      legalReviewNote:
        "I report sono briefing OSINT analitici da fonti pubbliche/configurate e richiedono revisione umana prima di decisioni operative, legali, sicurezza, credito, HR o compliance.",
      legalPrivacyDesc:
        "Spiega dati account, audit log, indirizzi IP, report OSINT, provider terzi, processori di pagamento, conservazione, controlli di sicurezza e diritti privacy degli utenti.",
      legalTermsDesc:
        "Definisce accesso all'abbonamento, rinnovo pagamenti, cancellazione, uso accettabile, disponibilita del servizio, limiti dei report, rimborsi e limiti di responsabilita.",
      legalUseDesc:
        "Vieta stalking, doxxing, molestie, accessi non autorizzati, exploit, abuso di credenziali, profilazione illecita, sorveglianza e uso improprio di dati personali.",
      legalDisclaimerDesc:
        "Richiede revisione umana, verifica delle fonti e giudizio professionale prima di decisioni operative, legali, HR, creditizie, di sicurezza o compliance."
    }
  };
  Object.entries(copy[lang === "it" ? "it" : "en"]).forEach(([id, text]) => {
    const element = byId(id);
    if (element) element.textContent = text;
  });
}

function applyLanguage(lang) {
  currentLanguage = lang === "it" ? "it" : "en";
  localStorage.setItem("ORVEX_LANG", currentLanguage);
  document.documentElement.lang = currentLanguage;
  document.title =
    currentLanguage === "it"
      ? "Orvex OSINT Fusion | Console intelligence"
      : "Orvex OSINT Fusion | Intelligence Console";
  translateStaticText(currentLanguage);
  updateLegalCopy(currentLanguage);

  document.querySelectorAll(".language-switch button").forEach((button) => {
    button.classList.toggle("selected", button.dataset.lang === currentLanguage);
  });
  document.querySelectorAll(".activate-plan").forEach((button) => {
    button.textContent = t("activate");
  });
  document.querySelectorAll(".price-card .access-button").forEach((button) => {
    button.textContent = t("contactMe");
  });
  const runButton = byId("runSearch");
  if (runButton && !state.analyzing) runButton.textContent = t("runAnalysis");
  const selectedBilling = document.querySelector(".billing-toggle .selected")?.dataset.billing || "monthly";
  updateBilling(selectedBilling, false);
  if (byId("authModal")) setAuthMode(state.authMode);
}

function setupLanguageSwitch() {
  document.querySelectorAll(".language-switch button").forEach((button) => {
    button.addEventListener("click", () => applyLanguage(button.dataset.lang || "en"));
  });
}

async function openStripeCheckout(plan) {
  const billing = document.querySelector(".billing-toggle .selected")?.dataset.billing || "monthly";
  const url = STRIPE_PAYMENT_LINKS[plan]?.[billing];
  if (!url) {
    showToast(t("stripeMissing"), "error");
    return;
  }
  showToast(t("stripeOpening"));
  window.location.assign(url);
}

async function openBillingManagement() {
  const plan = state.accountData?.plan || "free";
  if (plan === "free" || !state.accountData?.subscription) {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  try {
    const response = await fetch(BILLING_PORTAL_ENDPOINT, {
      method: "POST",
      cache: "no-store",
      headers: await authHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) {
      throw new Error(data?.detail || "Billing management is unavailable.");
    }
    window.location.assign(data.url);
  } catch (error) {
    showToast(`Billing error: ${error.message}`, "error");
  }
}

function setupStripeButtons() {
  document.querySelectorAll(".activate-plan").forEach((button) => {
    button.addEventListener("click", () => openStripeCheckout(button.dataset.plan || ""));
  });
}

async function refreshAccountStatus() {
  if (supabaseClient) {
    const { data } = await supabaseClient.auth.getSession();
    state.authSession = data?.session || null;
    state.authUser = data?.session?.user || null;
  }

  try {
    const response = await fetch(ME_ENDPOINT, {
      method: "GET",
      cache: "no-store",
      headers: await authHeaders()
    });
    if (response.ok) {
      const data = await response.json();
      state.serverUsage = data.usage ? { ...data.usage, plan: data.plan || "free" } : null;
      renderAccountStatus(data);
      await refreshSessionLocation(Boolean(data.authenticated || state.authUser));
      return data;
    }
  } catch {
    // Account status is advisory locally; analysis still shows explicit backend errors.
  }
  renderAccountStatus({
    authenticated: Boolean(state.authUser),
    email: state.authUser?.email || null,
    plan: "local",
    usage: null
  });
  await refreshSessionLocation(Boolean(state.authUser));
  return null;
}

function renderSessionLocation(data = null, authenticated = false) {
  const chip = byId("sessionLocation");
  const accountLocation = byId("accountLocation");
  const accountLocationNote = byId("accountLocationNote");

  let label = "";
  if (data?.available && !data?.local) {
    let country = data.country_code || "";
    try {
      country = new Intl.DisplayNames([currentLanguage === "it" ? "it" : "en"], { type: "region" }).of(country) || country;
    } catch {
      // Keep the ISO country code when Intl.DisplayNames is unavailable.
    }
    label = [data.city, data.region, country].filter(Boolean).join(", ");
  }

  if (chip) {
    chip.textContent = label;
    chip.hidden = !label;
  }
  if (accountLocation) accountLocation.textContent = label;
  if (accountLocationNote) {
    accountLocationNote.textContent = currentLanguage === "it"
      ? "Citta e Paese approssimativi ricavati dall'IP di connessione. Nessun tracciamento GPS."
      : "Approximate city and country from the connection IP. No GPS tracking.";
  }
}

async function refreshSessionLocation(authenticated = Boolean(state.authUser)) {
  if (!authenticated) {
    renderSessionLocation(null, false);
    return;
  }
  try {
    const response = await fetch(SESSION_LOCATION_ENDPOINT, {
      method: "GET",
      cache: "no-store",
      headers: await authHeaders()
    });
    if (!response.ok) throw new Error("Location lookup unavailable");
    renderSessionLocation(await response.json(), true);
  } catch {
    renderSessionLocation(null, true);
  }
}

function renderAccountStatus(data = {}) {
  const status = byId("authStatus");
  const signIn = byId("signInButton");
  const createTop = byId("createAccountTopButton");
  const signOut = byId("signOutButton");
  const accountEmail = byId("accountEmail");
  const accountState = byId("accountState");
  const accountPlan = byId("accountPlan");
  const accountSubscription = byId("accountSubscription");
  const accountUsage = byId("accountUsage");
  const accountRemaining = byId("accountRemaining");
  const accountNextBilling = byId("accountNextBilling");
  const accountCreateButton = byId("accountCreateButton");
  const accountManagePlan = byId("accountManagePlan");

  const plan = data.plan || "free";
  const authenticated = Boolean(data.authenticated || state.authUser);
  const email = data.email || state.authUser?.email || null;
  const usage = data.usage ? ` · ${data.usage.used}/${data.usage.limit} scans` : "";
  const subscription = data.subscription || null;
  state.accountData = data;

  if (status) {
    status.hidden = !authenticated;
    status.textContent = authenticated ? `${email || "Signed in"} · ${plan}${usage}` : "";
  }
  if (signIn) signIn.hidden = Boolean(data.authenticated || state.authUser);
  if (createTop) createTop.hidden = Boolean(data.authenticated || state.authUser);
  if (signOut) signOut.hidden = !Boolean(data.authenticated || state.authUser);
  if (accountEmail) accountEmail.textContent = email || "";
  if (accountState) {
    accountState.textContent = authenticated
      ? "Signed in. Investigations and plan status are tied to this account."
      : "Create an account to save cases and activate a plan.";
  }
  if (accountPlan) accountPlan.textContent = plan.charAt(0).toUpperCase() + plan.slice(1);
  if (accountManagePlan) {
    accountManagePlan.textContent = subscription
      ? (currentLanguage === "it" ? "Gestisci fatturazione" : "Manage billing")
      : (currentLanguage === "it" ? "Vedi piani" : "View plans");
  }
  if (accountSubscription) {
    accountSubscription.textContent = subscription
      ? `${subscription.status || "active"} · ${subscription.plan_code || plan}`
      : "No active subscription";
  }
  if (accountUsage) {
    accountUsage.textContent = data.usage ? `${data.usage.used} / ${data.usage.limit} scans` : `${getFreeAnalysisCount()} / ${FREE_ANALYSIS_LIMIT} scans`;
  }
  if (accountRemaining) {
    accountRemaining.textContent = data.usage
      ? `${data.usage.remaining} remaining on ${plan}`
      : `${Math.max(0, FREE_ANALYSIS_LIMIT - getFreeAnalysisCount())} remaining on free trial`;
  }
  if (accountNextBilling) {
    accountNextBilling.textContent = subscription?.current_period_end
      ? `Renews or ends ${new Date(subscription.current_period_end).toLocaleDateString()}`
      : "Choose Starter or Pro to activate paid access.";
  }
  if (accountCreateButton) {
    accountCreateButton.textContent = authenticated ? "Account connected" : "Create new account";
    accountCreateButton.disabled = authenticated;
  }
}

function setAuthMode(mode) {
  state.authMode = mode === "signup" ? "signup" : mode === "forgot" ? "forgot" : mode === "recovery" ? "recovery" : "signin";
  const isForgot = state.authMode === "forgot";
  const isRecovery = state.authMode === "recovery";
  document.querySelector(".auth-tabs")?.toggleAttribute("hidden", isForgot || isRecovery);
  byId("signupFields")?.toggleAttribute("hidden", state.authMode !== "signup");
  byId("forgotPassword")?.toggleAttribute("hidden", state.authMode !== "signin");
  byId("backToSignIn")?.toggleAttribute("hidden", !(isForgot || isRecovery));
  byId("resendConfirmation")?.toggleAttribute("hidden", state.authMode !== "signin");
  byId("authPasswordLabel")?.toggleAttribute("hidden", isForgot);
  const emailInput = byId("authEmail");
  if (emailInput) {
    emailInput.disabled = isRecovery;
    emailInput.required = !isRecovery;
    emailInput.placeholder = isRecovery ? "Password recovery session" : "you@company.com";
  }
  const passwordInput = byId("authPassword");
  if (passwordInput) {
    passwordInput.autocomplete = state.authMode === "signin" ? "current-password" : "new-password";
    passwordInput.placeholder = isRecovery ? "New password" : "Minimum 6 characters";
    passwordInput.required = !isForgot;
    if (isForgot) passwordInput.value = "";
  }
  byId("authSubmit").textContent = isForgot
    ? (currentLanguage === "it" ? "Invia email recupero" : "Send recovery email")
    : isRecovery
    ? (currentLanguage === "it" ? "Aggiorna password" : "Update password")
    : state.authMode === "signup"
    ? (currentLanguage === "it" ? "Crea nuovo account" : "Create new account")
    : (currentLanguage === "it" ? "Accedi" : "Sign in");
  byId("authTitle").textContent = isForgot
    ? (currentLanguage === "it" ? "Recupera password" : "Recover password")
    : isRecovery
    ? (currentLanguage === "it" ? "Imposta nuova password" : "Set a new password")
    : state.authMode === "signup"
    ? (currentLanguage === "it" ? "Crea il tuo account Orvex" : "Create your Orvex account")
    : (currentLanguage === "it" ? "Accesso a OSINT Fusion" : "Access OSINT Fusion");
  byId("authNote").textContent =
    isForgot
      ? (currentLanguage === "it"
        ? "Inserisci il tuo indirizzo email. Ti invieremo un link sicuro per reimpostare la password."
        : "Enter your email address. We will send a secure link to reset your password.")
      : isRecovery
      ? (currentLanguage === "it"
        ? "Inserisci una nuova password per completare il recupero account."
        : "Enter a new password to complete account recovery.")
      : state.authMode === "signup"
      ? (currentLanguage === "it"
        ? "Il tuo account collega indagini salvate, utilizzo e abbonamenti."
        : "Your account lets Orvex connect saved investigations, usage, and future subscriptions.")
      : (currentLanguage === "it"
        ? "Accedi per recuperare indagini salvate e stato dell'abbonamento."
        : "Sign in to recover your saved investigations and subscription status.");
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.authMode === state.authMode);
    button.disabled = isRecovery;
  });
  const error = byId("authError");
  if (error) error.textContent = "";
  updatePasswordResetCooldownButton();
}

function openAuthModal(mode = "signin") {
  if (!supabaseClient) {
    showToast("Account login is disabled for this launch. Use Stripe checkout to activate access.", "error");
    return;
  }
  setAuthMode(mode);
  const modal = byId("authModal");
  if (!modal) return;
  modal.hidden = false;
  window.setTimeout(() => byId("authEmail")?.focus(), 60);
}

function closeAuthModal() {
  const modal = byId("authModal");
  if (modal) modal.hidden = true;
}

async function upsertUserProfile(user, fullName = "", companyName = "") {
  if (!supabaseClient || !user?.id) return;
  try {
    await supabaseClient.from("user_profiles").upsert({
      user_id: user.id,
      email: user.email || "",
      full_name: fullName || user.user_metadata?.full_name || "",
      company_name: companyName || user.user_metadata?.company_name || "",
      updated_at: new Date().toISOString()
    });
  } catch {
    // Profile creation is optional; Auth and backend account status still work.
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  if (!supabaseClient) return;
  const email = byId("authEmail")?.value.trim();
  const password = byId("authPassword")?.value;
  const fullName = byId("authFullName")?.value.trim() || "";
  const companyName = byId("authCompany")?.value.trim() || "";
  const errorEl = byId("authError");
  const submit = byId("authSubmit");
  if (errorEl) errorEl.textContent = "";
  if (state.authMode === "forgot") {
    await sendPasswordResetEmail();
    return;
  }
  if (state.authMode === "recovery") {
    if (!password || password.length < 6) {
      if (errorEl) {
        errorEl.textContent = currentLanguage === "it"
          ? "Inserisci una nuova password di almeno 6 caratteri."
          : "Enter a new password with at least 6 characters.";
      }
      return;
    }
    if (submit) submit.disabled = true;
    const result = await supabaseClient.auth.updateUser({ password });
    if (submit) submit.disabled = false;
    if (result.error) {
      if (errorEl) errorEl.textContent = result.error.message;
      showToast(`Password update error: ${result.error.message}`, "error");
      return;
    }
    showToast(currentLanguage === "it" ? "Password aggiornata. Puoi continuare." : "Password updated. You can continue.");
    closeAuthModal();
    setAuthMode("signin");
    await refreshAccountStatus();
    return;
  }
  if (!email || !password) {
    if (errorEl) errorEl.textContent = "Email and password are required.";
    return;
  }
  if (submit) submit.disabled = true;

  const result =
    state.authMode === "signup"
      ? await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
            data: { full_name: fullName, company_name: companyName }
          }
        })
      : await supabaseClient.auth.signInWithPassword({ email, password });

  if (submit) submit.disabled = false;
  if (result.error) {
    if (errorEl) errorEl.textContent = result.error.message;
    showToast(`Account error: ${result.error.message}`, "error");
    return;
  }

  if (result.data?.user) await upsertUserProfile(result.data.user, fullName, companyName);
  await refreshAccountStatus();
  closeAuthModal();
  showToast(state.authMode === "signup" && !result.data?.session ? "Account created. Check your email to confirm access." : "Account connected");
}

async function resendConfirmationEmail() {
  if (!supabaseClient) return;
  const email = byId("authEmail")?.value.trim();
  const errorEl = byId("authError");
  if (!email) {
    if (errorEl) errorEl.textContent = currentLanguage === "it" ? "Inserisci prima la tua email." : "Insert your email first.";
    return;
  }
  const result = await supabaseClient.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` }
  });
  if (result.error) {
    if (errorEl) errorEl.textContent = result.error.message;
    showToast(`Confirmation email failed: ${result.error.message}`, "error");
    return;
  }
  if (errorEl) {
    errorEl.textContent = currentLanguage === "it"
      ? "Email di conferma inviata. Controlla posta in arrivo e spam."
      : "Confirmation email sent. Check inbox and spam.";
  }
  showToast(currentLanguage === "it" ? "Email di conferma inviata" : "Confirmation email sent");
}

function updatePasswordResetCooldownButton() {
  const submit = byId("authSubmit");
  if (!submit || state.authMode !== "forgot") return;
  const remaining = Math.max(0, state.passwordResetCooldownRemaining || 0);
  if (remaining > 0) {
    submit.disabled = true;
    submit.textContent = currentLanguage === "it"
      ? `Riprova tra ${remaining}s`
      : `Retry in ${remaining}s`;
  } else {
    submit.disabled = false;
    submit.textContent = currentLanguage === "it" ? "Invia email recupero" : "Send recovery email";
  }
}

function startPasswordResetCooldown(seconds = PASSWORD_RESET_COOLDOWN_SECONDS) {
  window.clearInterval(state.passwordResetCooldownTimer);
  state.passwordResetCooldownRemaining = seconds;
  updatePasswordResetCooldownButton();
  state.passwordResetCooldownTimer = window.setInterval(() => {
    state.passwordResetCooldownRemaining = Math.max(0, state.passwordResetCooldownRemaining - 1);
    updatePasswordResetCooldownButton();
    if (state.passwordResetCooldownRemaining <= 0) {
      window.clearInterval(state.passwordResetCooldownTimer);
      state.passwordResetCooldownTimer = null;
    }
  }, 1000);
}

async function sendPasswordResetEmail() {
  if (!supabaseClient) return;
  if (state.passwordResetCooldownRemaining > 0) {
    updatePasswordResetCooldownButton();
    return;
  }
  const email = byId("authEmail")?.value.trim();
  const errorEl = byId("authError");
  const submit = byId("authSubmit");
  if (errorEl) errorEl.textContent = "";
  if (!email) {
    if (errorEl) errorEl.textContent = currentLanguage === "it" ? "Inserisci prima la tua email." : "Insert your email first.";
    return;
  }
  if (submit) {
    submit.disabled = true;
    submit.textContent = currentLanguage === "it" ? "Invio in corso..." : "Sending...";
  }
  const result = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${window.location.pathname}`
  });
  if (result.error) {
    const isRateLimit = String(result.error.message || "").toLowerCase().includes("rate limit");
    if (errorEl) {
      errorEl.textContent = isRateLimit
        ? (currentLanguage === "it"
          ? "Troppe richieste email. Attendi un minuto prima di riprovare."
          : "Too many email requests. Wait one minute before trying again.")
        : result.error.message;
    }
    startPasswordResetCooldown();
    showToast(`Password reset error: ${result.error.message}`, "error");
    return;
  }
  if (errorEl) {
    errorEl.textContent = currentLanguage === "it"
      ? "Controlla la tua email per reimpostare la password."
      : "Check your email to reset your password.";
  }
  showToast(currentLanguage === "it" ? "Email recupero password inviata" : "Password reset email sent");
  startPasswordResetCooldown();
}

async function signInOrCreateAccount() {
  openAuthModal("signin");
}

async function signOutAccount() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  state.authSession = null;
  state.authUser = null;
  await refreshAccountStatus();
  showToast("Signed out");
}

function populateSupabaseConfigFields() {
  const panel = DEBUG_ENABLED ? ensureSupabaseConfigPanel() : byId("supabaseConfigPanel");
  if (panel) panel.hidden = !DEBUG_ENABLED;
  const urlInput = byId("supabaseUrlInput");
  const anonInput = byId("supabaseAnonInput");
  const note = byId("supabaseConfigNote");
  const currentUrl = window.ORVEX_SUPABASE_URL || localStorage.getItem("ORVEX_SUPABASE_URL") || "";
  const currentAnon = window.ORVEX_SUPABASE_ANON_KEY || localStorage.getItem("ORVEX_SUPABASE_ANON_KEY") || "";
  if (urlInput) urlInput.value = currentUrl;
  if (anonInput) anonInput.value = currentAnon;
  if (note) {
    note.textContent = currentUrl && currentAnon
      ? "Supabase config found. Save again only if you changed project keys."
      : "Only paste the anon public key here. Never paste the service role key in the browser.";
  }
}

function saveSupabaseConfig() {
  const url = byId("supabaseUrlInput")?.value.trim() || "";
  const anonKey = byId("supabaseAnonInput")?.value.trim() || "";
  const note = byId("supabaseConfigNote");
  if (!url || !anonKey) {
    if (note) note.textContent = "Authentication settings are required.";
    showToast("Authentication settings are required.", "error");
    return;
  }
  if (!/^https:\/\/.+\.supabase\.co\/?$/.test(url)) {
    if (note) note.textContent = "Authentication settings are invalid.";
    showToast("Invalid authentication settings.", "error");
    return;
  }
  localStorage.setItem("ORVEX_SUPABASE_URL", url.replace(/\/$/, ""));
  localStorage.setItem("ORVEX_SUPABASE_ANON_KEY", anonKey);
  if (note) note.textContent = "Saved. Reloading OSINT Fusion...";
  showToast("Supabase config saved. Reloading...");
  window.setTimeout(() => window.location.reload(), 650);
}

function clearSupabaseConfig() {
  localStorage.removeItem("ORVEX_SUPABASE_URL");
  localStorage.removeItem("ORVEX_SUPABASE_ANON_KEY");
  populateSupabaseConfigFields();
  showToast("Supabase config cleared");
  window.setTimeout(() => window.location.reload(), 650);
}

function setupAuthControls() {
  byId("signInButton")?.addEventListener("click", signInOrCreateAccount);
  byId("createAccountTopButton")?.addEventListener("click", () => openAuthModal("signup"));
  byId("signOutButton")?.addEventListener("click", signOutAccount);
  populateSupabaseConfigFields();
  if (DEBUG_ENABLED) {
    byId("saveSupabaseConfig")?.addEventListener("click", saveSupabaseConfig);
    byId("clearSupabaseConfig")?.addEventListener("click", clearSupabaseConfig);
  }
  byId("accountCreateButton")?.addEventListener("click", () => openAuthModal("signup"));
  byId("accountRefresh")?.addEventListener("click", () => refreshAccountStatus());
  byId("accountManagePlan")?.addEventListener("click", openBillingManagement);
  byId("authClose")?.addEventListener("click", closeAuthModal);
  byId("forgotPassword")?.addEventListener("click", () => setAuthMode("forgot"));
  byId("backToSignIn")?.addEventListener("click", () => setAuthMode("signin"));
  byId("resendConfirmation")?.addEventListener("click", resendConfirmationEmail);
  byId("authModal")?.addEventListener("click", (event) => {
    if (event.target?.id === "authModal") closeAuthModal();
  });
  byId("authForm")?.addEventListener("submit", handleAuthSubmit);
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => setAuthMode(button.dataset.authMode || "signin"));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !byId("authModal")?.hidden) closeAuthModal();
  });
  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      state.authSession = session || null;
      state.authUser = session?.user || null;
      if (_event === "PASSWORD_RECOVERY") {
        window.setTimeout(() => openAuthModal("recovery"), 50);
      }
      refreshAccountStatus();
    });
  }
  byId("lawfulUseConsent")?.addEventListener("change", (event) => {
    if (event.target.checked) localStorage.setItem(LEGAL_ACCEPTANCE_KEY, "true");
    else localStorage.removeItem(LEGAL_ACCEPTANCE_KEY);
  });
  if (legalAccepted() && byId("lawfulUseConsent")) byId("lawfulUseConsent").checked = true;
  refreshAccountStatus();
}

async function persistLegalAcceptance() {
  if (!legalAccepted()) {
    throw new Error("You must accept the lawful-use, privacy, and terms confirmation before running analysis.");
  }

  const response = await fetch(LEGAL_ACCEPT_ENDPOINT, {
    method: "POST",
    cache: "no-store",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      document_version: "2026-06-19",
      accepted_terms: true,
      accepted_privacy: true,
      accepted_lawful_use: true
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail || "Could not record legal acceptance.");
  }
  if (state.authUser && data.persistence === "pending_schema") {
    throw new Error("Legal acceptance could not be stored. Please contact support.");
  }
  localStorage.setItem(LEGAL_ACCEPTANCE_KEY, "true");
}

function requestAccess() {
  const subject = encodeURIComponent("Request access to Orvex OSINT Fusion");
  const body = encodeURIComponent(
    "Hello Orvex Intelligence,\n\nI would like to request access to Orvex OSINT Fusion.\n\nUse case:\nCompany:\nPlan of interest:\n\n"
  );
  window.location.href = `mailto:contact@orvexintelligence.com?subject=${subject}&body=${body}`;
}

function updateBilling(mode, notify = true) {
  document.querySelectorAll(".price-card strong").forEach((price) => {
    price.textContent = price.dataset[mode] || price.dataset.monthly || price.textContent;
  });
  document.querySelectorAll(".price-card em").forEach((suffix) => {
    suffix.textContent = mode === "annual" ? t("year") : t("month");
  });
  if (notify) showToast(mode === "annual" ? t("annual") : t("monthly"));
}

function getFreeAnalysisCount() {
  const value = Number(localStorage.getItem(FREE_ANALYSIS_COUNT_KEY) || "0");
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function hasReachedFreeAnalysisLimit() {
  const plan = state.serverUsage?.plan || null;
  if (plan && !["free", "local"].includes(plan)) return false;
  return getFreeAnalysisCount() >= FREE_ANALYSIS_LIMIT;
}

function recordFreeAnalysis(responseData = null) {
  const plan = responseData?.plan || state.serverUsage?.plan || "free";
  if (!["free", "local"].includes(plan)) return 0;
  const nextCount = getFreeAnalysisCount() + 1;
  localStorage.setItem(FREE_ANALYSIS_COUNT_KEY, String(nextCount));
  return nextCount;
}

function saveLastAnalysisReport(report) {
  if (!report) return;
  try {
    localStorage.setItem(LAST_ANALYSIS_KEY, JSON.stringify(report));
  } catch {
    // Large raw OSINT payloads can exceed browser storage. PDF export still works in-session.
  }
}

function restoreLastAnalysisReport() {
  if (state.lastAnalysis) return state.lastAnalysis;
  try {
    const raw = localStorage.getItem(LAST_ANALYSIS_KEY);
    if (!raw) return null;
    const report = JSON.parse(raw);
    if (!report?.entityValue || !Number.isFinite(Number(report?.riskScore))) return null;
    state.lastAnalysis = report;
    updatePdfExportButtons(true);
    return report;
  } catch {
    localStorage.removeItem(LAST_ANALYSIS_KEY);
    return null;
  }
}

function showUpgradeRequired() {
  showToast(t("trialLimit"), "error");
  setDebug({
    endpoint: "local trial gate",
    status: "payment required",
    error: t("trialLimit"),
    raw: {
      free_analysis_limit: FREE_ANALYSIS_LIMIT,
      free_analysis_used: getFreeAnalysisCount(),
      action: "choose_starter_or_pro"
    }
  });
  document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

setupSimpleAnalyzeButton();
setupLanguageSwitch();
setupStripeButtons();
setupAuthControls();
restoreLastAnalysisReport();
byId("debugPanel")?.toggleAttribute("hidden", !DEBUG_ENABLED);
byId("stopAnalysis")?.addEventListener("click", stopActiveAnalysis);
byId("entityInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") simpleAnalyze();
});
byId("companyDomainInput")?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") simpleAnalyze();
});
byId("companyVatInput")?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") simpleAnalyze();
});
byId("entityType")?.addEventListener("change", () => {
  const input = byId("entityInput");
  const companyDomainInput = byId("companyDomainInput");
  const companyVatInput = byId("companyVatInput");
  const row = input?.closest(".input-row");
  if (!input) return;
  const entityType = selectedEntityType();
  row?.classList.toggle("company-mode", entityType === "company");
  if (companyDomainInput) companyDomainInput.hidden = entityType !== "company";
  if (companyVatInput) companyVatInput.hidden = entityType !== "company";

  if (entityType === "email") {
    input.value = input.value.includes("@") ? input.value : "";
    input.placeholder = "name@company.com";
  } else if (entityType === "company") {
    const parts = input.value.split("|").map((item) => item.trim()).filter(Boolean);
    const currentDomain = input.value.includes(".") ? normalizeDomain(input.value) : "";
    input.value = parts[0] && !parts[0].includes(".") ? parts[0] : "";
    input.placeholder = "Company name";
    if (companyDomainInput) {
      companyDomainInput.value = parts[1] || currentDomain || "";
      companyDomainInput.placeholder = "official-domain.com";
    }
    if (companyVatInput) {
      companyVatInput.value = parts[2] || "";
      companyVatInput.placeholder = "VAT / P.IVA es. IT12345678901";
    }
  } else if (entityType === "wallet") {
    if (companyDomainInput) companyDomainInput.value = "";
    if (companyVatInput) companyVatInput.value = "";
    input.value = "";
    input.placeholder = "0x...";
  } else if (entityType === "person") {
    if (companyDomainInput) companyDomainInput.value = "";
    if (companyVatInput) companyVatInput.value = "";
    input.value = "";
    input.placeholder = "Name | email@domain.com | domain.com | public link";
  } else {
    if (companyDomainInput) companyDomainInput.value = "";
    if (companyVatInput) companyVatInput.value = "";
    input.value = input.value.includes("@") || !input.value.includes(".") ? "" : input.value;
    input.placeholder = "example.com";
  }
});
setupPdfExportButtons();
byId("refreshCases")?.addEventListener("click", loadCaseHistory);
byId("newCase").addEventListener("click", () => {
  byId("entityInput").value = "";
  byId("entityInput").focus();
  state.lastCaseId = null;
  state.lastReportId = null;
  state.lastAnalysis = null;
  updatePdfExportButtons(false);
  showToast(t("newCase"));
});

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((button) => button.classList.remove("active"));
    item.classList.add("active");
    const target = document.getElementById(item.dataset.target || "");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

document.querySelectorAll(".access-button").forEach((button) => {
  button.addEventListener("click", requestAccess);
});

document.querySelectorAll(".billing-toggle button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".billing-toggle button").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    updateBilling(button.dataset.billing || "monthly");
  });
});

render();
maybeRunMockSuccess();
applyLanguage(currentLanguage);
handleCheckoutReturn();
loadCaseHistory();

function setupSimpleAnalyzeButton() {
  const oldButton = byId("runSearch");
  if (!oldButton) return;

  const cleanButton = oldButton.cloneNode(true);
  cleanButton.textContent = t("runAnalysis");
  cleanButton.classList.remove("loading");
  cleanButton.disabled = false;
  oldButton.replaceWith(cleanButton);
  cleanButton.addEventListener("click", simpleAnalyze);
}

async function simpleAnalyze() {
  const button = byId("runSearch");
  const endpoint = ANALYZE_ENDPOINT;
  const entityType = selectedEntityType();
  const entityValue = normalizeEntityValue(currentEntityInputValue(entityType), entityType);
  const startedAt = Date.now();
  const controller = new AbortController();
  state.activeController = controller;
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, 120000);

  setDebug({
    endpoint,
    status: "pending",
    error: "-",
    raw: { state: "request_started", entity_type: entityType, entity_value: entityValue }
  });

  if (!isValidEntity(entityValue, entityType)) {
    setDebug({
      endpoint,
      status: "-",
      error: "Invalid entity",
      raw: { error: "Invalid entity", entity_type: entityType, entity_value: entityValue }
    });
    showToast(entityValidationMessage(entityType), "error");
    return;
  }

  if (hasReachedFreeAnalysisLimit()) {
    showUpgradeRequired();
    return;
  }

  try {
    await persistLegalAcceptance();
  } catch (legalError) {
    showToast(legalError.message, "error");
    byId("legalGuard")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  if (button) {
    button.textContent = t("analyzing");
    button.disabled = true;
    button.classList.add("loading");
  }
  state.analyzing = true;
  document.body.classList.add("analysis-active");
  setStopButton(true);
  startProgress();

  try {
    console.log("Analyze request started", { endpoint, entity_type: entityType, entity_value: entityValue });
    const response = await fetch(endpoint, {
      method: "POST",
      mode: "cors",
      cache: "no-store",
      signal: controller.signal,
      headers: await authHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        entity_type: entityType,
        entity_value: entityValue,
        language: currentLanguage
      })
    });

    const elapsedMs = Date.now() - startedAt;
    setDebug({
      endpoint,
      status: `${response.status} ${response.statusText || ""}`.trim(),
      error: "-",
      raw: { state: "response_received", elapsed_ms: elapsedMs }
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error(`JSON parse failed: ${parseError.message}`);
    }

    console.log("Analyze response", data);
    setDebug({
      endpoint,
      status: `${response.status} ${response.statusText}`,
      error: response.ok ? "-" : "HTTP error",
      raw: { elapsed_ms: elapsedMs, response: data }
    });

    if (!response.ok) {
      throw new Error(readBackendError(data, response.status));
    }

    renderSimpleReport(entityValue, data);
    if (data?.usage) state.serverUsage = { ...data.usage, plan: data.plan || "free" };
    const used = recordFreeAnalysis(data);
    loadCaseHistory();
    completeProgress();
    const usageText = used === FREE_ANALYSIS_LIMIT ? ` · ${t("trialLimit")}` : "";
    showToast(`${t("reportRendered")}${usageText}`);
  } catch (error) {
    console.error("Simple analyze failed", error);
    const message =
      error.name === "AbortError"
        ? "Analysis stopped or timed out before the backend response completed."
        : error.message === "Failed to fetch" || error.message.includes("NetworkError")
          ? "Orvex API is not reachable from this device. On mobile, use the deployed API URL instead of 127.0.0.1, then refresh the page."
        : error.message;
    setDebug({
      endpoint,
      status: "request failed",
      error: message,
      raw: { error: message, elapsed_ms: Date.now() - startedAt }
    });
    showToast(`Analysis failed: ${message}`, "error");
    stopProgress(false);
  } finally {
    window.clearTimeout(timeoutId);
    state.activeController = null;
    setStopButton(false);
    if (button) {
      button.textContent = t("runAnalysis");
      button.disabled = false;
      button.classList.remove("loading");
    }
    state.analyzing = false;
    document.body.classList.remove("analysis-active");
    if (state.progressValue < 100) {
      stopProgress(false);
    }
  }
}

function normalizeFindingText(item) {
  const text = String(item || "").trim();
  if (!text) return "";
  if (/rdap/i.test(text) && /(failed|error|not found|404)/i.test(text)) {
    return "Registry data was not returned by the RDAP provider; treat this as a collection gap, not a negative finding.";
  }
  if (/missing hsts/i.test(text)) return "HSTS is not currently detected on the web surface.";
  if (/missing content-security-policy/i.test(text)) return "Content-Security-Policy is not currently detected on the web surface.";
  if (/missing x-frame-options/i.test(text)) return "X-Frame-Options or an equivalent frame-ancestors policy is not currently detected.";
  if (/missing x-content-type-options/i.test(text)) return "X-Content-Type-Options is not currently detected.";
  return text;
}

function buildCustomerFindings(entityType, modules, findings) {
  const output = [];
  const add = (item) => {
    const text = normalizeFindingText(item);
    if (text && !output.includes(text)) output.push(text);
  };

  if (entityType === "domain") {
    const dns = modules.dns || {};
    const http = modules.http || {};
    const rdap = modules.rdap || {};
    if (http.checks?.has_https) add("HTTPS is available and the target responded successfully.");
    if (dns.spf?.length && dns.dmarc?.length) add("SPF and DMARC records are present for mail authentication.");
    if (http.page_metadata?.html_language) add(`Page metadata detected language: ${http.page_metadata.html_language}.`);
    if (!rdap.ok) add("Registry verification remains open because the RDAP provider did not return registration data.");
  }

  if (entityType === "email") {
    const identity = modules.identity || {};
    const breach = modules.breach_exposure || {};
    if (identity.syntax_valid) add("Email syntax is valid.");
    if (breach.ok && breach.breach_count > 0) add(`Breach intelligence detected ${breach.breach_count} exposure record(s).`);
    if (breach.ok && breach.breach_count === 0) add("No breach exposure was returned by the configured breach intelligence source.");
  }

  if (entityType === "company") {
    const profile = modules.company_profile || {};
    const vat = modules.vat_vies || {};
    if (profile.company_name) add(`Company profile parsed as ${profile.company_name}.`);
    if (vat.vat_provided && vat.valid === true) add("VAT validation returned a valid result.");
    if (modules.domain_posture?.ok) add("Official-domain technical posture was collected.");
  }

  if (entityType === "wallet") {
    const account = modules.etherscan_account || {};
    if (account.ok) add("On-chain account data was collected through the configured blockchain source.");
    if (account.configured && !account.ok) add("On-chain lookup was attempted but did not return complete account data.");
  }

  if (entityType === "person") {
    add("Identity Review uses only user-provided/public technical context and does not verify legal identity ownership.");
  }

  (findings || []).forEach(add);
  return output.slice(0, 6);
}

function renderBulletList(items, emptyText) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!safeItems.length) return `<li>${escapeHtml(emptyText)}</li>`;
  return safeItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderSimpleReport(inputDomain, data) {
  const score = Number.isFinite(Number(data?.risk_score)) ? Math.round(Number(data.risk_score)) : 0;
  const summary = data?.summary || "Backend returned 200 OK, but no summary field was provided.";
  const entityType = data?.entity_type || data?.osint_data?.entity_type || selectedEntityType();
  const osintDomain = data?.osint_data?.domain || data?.osint_data?.wallet || data?.entity_value || inputDomain;
  const displayEntity = data?.entity_value || data?.osint_data?.email || data?.osint_data?.wallet || inputDomain;
  const osintModules = data?.osint_data?.modules || {};
  const findings = data?.osint_data?.risk?.findings || [];
  const customerFindings = buildCustomerFindings(entityType, osintModules, findings);
  const reportDraft = {
    inputDomain,
    entityType,
    entityValue: displayEntity,
    riskScore: score,
    summary,
    osintDomain,
    osintData: data?.osint_data || {},
    caseId: data?.case_id || null,
    reportId: data?.report_id || null,
    generatedAt: new Date().toISOString()
  };
  const recommendations = buildRecommendations(reportDraft, osintModules, findings);
  state.lastAnalysis = {
    ...reportDraft,
    customerFindings,
    recommendations
  };
  saveLastAnalysisReport(state.lastAnalysis);
  updatePdfExportButtons(true, true);

  renderRiskScore(score);
  byId("riskScoreLabel").textContent = riskLabel(score).replace(" risk", "");
  byId("dossierName").textContent = displayEntity;
  byId("riskPill").textContent = riskLabel(score);
  byId("dossierSummary").textContent = summary;
  byId("tags").innerHTML = [
    "Backend 200 OK",
    entityType === "email" ? "Identity Shield" : entityType === "company" ? "Company Due Diligence" : entityType === "wallet" ? "Wallet Risk" : entityType === "person" ? "Identity Review" : "Live OSINT",
    entityType === "email" ? "Email DNS / Domain posture" : entityType === "company" ? "Company / VAT / Domain posture" : entityType === "wallet" ? "EVM address / on-chain posture" : entityType === "person" ? "User-provided identity surface" : "DNS/RDAP/HTTP",
    `Entity: ${displayEntity}`
  ]
    .map((tag) => `<span>${escapeHtml(tag)}</span>`)
    .join("");

  const memoLabels =
    currentLanguage === "it"
      ? {
          score: "PUNTEGGIO_RISCHIO",
          type: "TIPO_ENTITA",
          value: "VALORE_ENTITA",
          summary: "SINTESI_ESECUTIVA",
          findings: "EVIDENZE_CHIAVE",
          actions: "AZIONI_CONSIGLIATE"
        }
      : {
          score: "RISK_SCORE",
          type: "ENTITY_TYPE",
          value: "ENTITY_VALUE",
          summary: "EXECUTIVE_SUMMARY",
          findings: "KEY_FINDINGS",
          actions: "ANALYST_RECOMMENDATIONS"
        };
  byId("memo").innerHTML = `
    <div class="memo-section">
      <span>${memoLabels.summary}</span>
      <p>${escapeHtml(summary)}</p>
    </div>
    <div class="memo-section memo-meta">
      <p><strong>${memoLabels.score}:</strong> ${score}/100</p>
      <p><strong>${memoLabels.type}:</strong> ${escapeHtml(entityType)}</p>
      <p><strong>${memoLabels.value}:</strong> ${escapeHtml(displayEntity)}</p>
    </div>
    <div class="memo-section">
      <span>${memoLabels.findings}</span>
      <ul class="memo-list">${renderBulletList(customerFindings, "No deterministic findings returned.")}</ul>
    </div>
    <div class="memo-section">
      <span>${memoLabels.actions}</span>
      <ul class="memo-list">${renderBulletList(recommendations.slice(0, 5), "Maintain periodic monitoring and preserve source snapshots.")}</ul>
    </div>
  `;
  const recommendationsPanel = byId("recommendations");
  if (recommendationsPanel) {
    recommendationsPanel.innerHTML = renderBulletList(recommendations, "Maintain periodic monitoring and preserve source snapshots.");
  }

  const moduleIndicators =
    entityType === "email"
      ? [
          ["Identity module", osintModules.identity?.ok ? 95 : 35, osintModules.identity?.ok ? "" : "high"],
          ["Mail DNS module", osintModules.mail_dns?.ok ? 92 : 35, osintModules.mail_dns?.ok ? "" : "high"],
          ["Breach exposure", osintModules.breach_exposure?.ok ? 92 : 35, osintModules.breach_exposure?.ok ? "" : "high"]
        ]
      : entityType === "company"
        ? [
            ["Company profile", osintModules.company_profile?.ok ? 88 : 35, osintModules.company_profile?.ok ? "" : "high"],
            ["Domain posture", osintModules.domain_posture?.ok ? 82 : 35, osintModules.domain_posture?.ok ? "" : "high"],
            ["Business coverage", osintModules.sanctions_screening?.configured ? 85 : 42, osintModules.sanctions_screening?.configured ? "" : "high"]
          ]
        : entityType === "wallet"
          ? [
              ["Wallet format", osintModules.wallet_profile?.ok ? 92 : 35, osintModules.wallet_profile?.ok ? "" : "high"],
              ["On-chain lookup", osintModules.etherscan_account?.ok ? 88 : 40, osintModules.etherscan_account?.ok ? "" : "high"],
              ["Risk feed", osintModules.risk_feed?.configured ? 85 : 35, osintModules.risk_feed?.configured ? "" : "high"]
            ]
          : entityType === "person"
            ? [
                ["Identity profile", osintModules.identity_profile?.ok ? 90 : 35, osintModules.identity_profile?.ok ? "" : "high"],
                ["Email posture", osintModules.email_posture?.ok ? 82 : 42, osintModules.email_posture?.ok ? "" : "high"],
                ["Domain posture", osintModules.domain_posture?.ok ? 82 : 42, osintModules.domain_posture?.ok ? "" : "high"]
              ]
      : [
          ["DNS module", osintModules.dns?.ok ? 92 : 35, osintModules.dns?.ok ? "" : "high"],
          ["HTTP module", osintModules.http?.ok ? 92 : 35, osintModules.http?.ok ? "" : "high"],
          ["RDAP module", osintModules.rdap?.ok ? 92 : 35, osintModules.rdap?.ok ? "" : "high"]
        ];

  byId("indicators").innerHTML = [["Risk score", score, riskTone(score)], ...moduleIndicators]
    .map(
      ([label, value, tone]) => `
        <div class="indicator">
          <div class="indicator-row"><span>${escapeHtml(label)}</span><span>${value}/100</span></div>
          <div class="bar ${tone}"><i style="width:${value}%"></i></div>
        </div>
      `
    )
    .join("");

  byId("timeline").innerHTML = [
    ["HTTP", "Backend response received", "POST /api/v1/analyze returned 200 OK and was parsed in the browser."],
    ["OSINT", "Entity rendered", `entity_type: ${entityType}; entity_value: ${displayEntity}`],
    ["FINDINGS", "Risk findings", customerFindings.length ? customerFindings.slice(0, 4).join("; ") : "No deterministic findings returned."]
  ]
    .map(
      ([date, title, body]) => `
        <article class="event">
          <time>${escapeHtml(date)}</time>
          <div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(body)}</p></div>
        </article>
      `
    )
    .join("");

  renderLiveKpis(entityType, score, osintModules, findings);
  renderEntityGraph(entityType, displayEntity, osintDomain, osintModules);
  renderLiveAudit(entityType, displayEntity, score, data?.report_id || null);
  renderOsintPanels(osintDomain, data?.osint_data || {});
}

function renderLiveKpis(entityType, score, modules, findings) {
  if (entityType === "email") {
    const breachCount = modules.breach_exposure?.breach_count ?? 0;
    byId("liveModuleCount").textContent = "4";
    byId("liveModuleLabel").textContent = "Identity / DNS / Breach Intel / HTTPS";
    byId("linkedCount").textContent = Math.max(3, findings.length + breachCount + 3);
    byId("sourceCount").textContent = modules.breach_exposure?.ok ? String(3 + breachCount) : "3";
    byId("sourceLabel").textContent = modules.breach_exposure?.ok ? "Breach intel + DNS" : "DNS cited";
  } else if (entityType === "company") {
    byId("liveModuleCount").textContent = "5";
    byId("liveModuleLabel").textContent = "Profile / Domain / VIES / Registry / Sanctions";
    byId("linkedCount").textContent = Math.max(5, findings.length + 5);
    byId("sourceCount").textContent = modules.vat_vies?.vat_provided ? "5" : modules.domain_posture?.ok ? "4" : "1";
    byId("sourceLabel").textContent = modules.vat_vies?.vat_provided ? "Company + VIES + domain OSINT" : modules.domain_posture?.ok ? "Company + domain OSINT" : "Company input";
  } else if (entityType === "wallet") {
    byId("liveModuleCount").textContent = "3";
    byId("liveModuleLabel").textContent = "Wallet / Etherscan / Risk feed";
    byId("linkedCount").textContent = Math.max(3, findings.length + 3);
    byId("sourceCount").textContent = modules.etherscan_account?.configured ? "2" : "1";
    byId("sourceLabel").textContent = modules.etherscan_account?.configured ? "Wallet + Etherscan" : "Wallet format";
  } else if (entityType === "person") {
    byId("liveModuleCount").textContent = "4";
    byId("liveModuleLabel").textContent = "Profile / Email / Domain / Links";
    byId("linkedCount").textContent = Math.max(4, findings.length + 4);
    byId("sourceCount").textContent = modules.email_posture?.ok || modules.domain_posture?.ok ? "3" : "1";
    byId("sourceLabel").textContent = "User-provided + public technical OSINT";
  } else {
    byId("liveModuleCount").textContent = "3";
    byId("liveModuleLabel").textContent = "DNS / HTTP / RDAP";
    byId("linkedCount").textContent = Math.max(3, findings.length + 3);
    byId("sourceCount").textContent = "3";
    byId("sourceLabel").textContent = "All cited in PDF";
  }
  byId("riskScoreLabel").textContent = riskLabel(score).replace(" risk", "");
}

function renderEntityGraph(entityType, entityValue, domain, modules) {
  const breachCount = modules.breach_exposure?.breach_count || 0;
  const graphCase =
    entityType === "email"
      ? {
          nodes: [
            [entityValue, "Email", 50, 48, "core"],
            [domain, "Mail domain", 26, 28, ""],
            ["MX / SPF / DMARC", "Mail DNS", 74, 28, ""],
            ["Breach exposure", breachCount ? `${breachCount} breach` : "No breach", 25, 70, breachCount ? "warning" : ""],
            ["Risk briefing", "AI memo", 72, 70, "warning"],
            ["Audit trail", "Compliance", 50, 84, ""]
          ],
          edges: [
            [0, 1],
            [1, 2],
            [0, 3],
            [0, 4],
            [3, 5],
            [4, 5]
          ]
        }
      : entityType === "company"
        ? {
            nodes: [
              [entityValue, "Company", 50, 48, "core"],
              [domain || "Domain gap", "Official domain", 26, 28, domain ? "" : "warning"],
              ["Web posture", "HTTP/DNS", 74, 28, ""],
              ["Registry check", "Business plan", 25, 70, "warning"],
              ["Sanctions screen", "Business plan", 72, 70, "warning"],
              ["Risk briefing", "AI memo", 50, 84, ""]
            ],
            edges: [
              [0, 1],
              [1, 2],
              [0, 3],
              [0, 4],
              [3, 5],
              [4, 5]
            ]
          }
        : entityType === "wallet"
          ? {
              nodes: [
                [entityValue, "Wallet", 50, 48, "core"],
                [modules.wallet_profile?.chain || "EVM", "Chain", 28, 28, ""],
                ["Balance / txs", modules.etherscan_account?.configured ? "Etherscan" : "API key needed", 72, 28, modules.etherscan_account?.ok ? "" : "warning"],
                ["Risk feed", "Business module", 26, 70, "warning"],
                ["Risk briefing", "AI memo", 72, 70, ""],
                ["Audit trail", "Compliance", 50, 84, ""]
              ],
              edges: [
                [0, 1],
                [0, 2],
                [0, 3],
                [2, 4],
                [3, 4],
                [4, 5]
              ]
            }
          : entityType === "person"
            ? {
                nodes: [
                  [entityValue, "Identity", 50, 48, "core"],
                  [modules.identity_profile?.email || "Email gap", "Email", 26, 28, modules.identity_profile?.email ? "" : "warning"],
                  [modules.identity_profile?.domain || "Domain gap", "Domain", 72, 28, modules.identity_profile?.domain ? "" : "warning"],
                  ["Public links", `${modules.public_links?.links_provided || 0} provided`, 26, 70, modules.public_links?.links_provided ? "" : "warning"],
                  ["Risk briefing", "AI memo", 72, 70, ""],
                  ["Audit trail", "Compliance", 50, 84, ""]
                ],
                edges: [
                  [0, 1],
                  [0, 2],
                  [0, 3],
                  [1, 4],
                  [2, 4],
                  [4, 5]
                ]
              }
      : {
          nodes: [
            [entityValue, "Domain", 50, 48, "core"],
            ["DNS records", "Source", 28, 28, ""],
            ["HTTP headers", "Security", 72, 26, ""],
            ["RDAP registry", "Source", 24, 68, ""],
            ["Risk briefing", "AI report", 68, 68, "warning"],
            ["Audit trail", "Compliance", 51, 82, ""]
          ],
          edges: [
            [0, 1],
            [0, 2],
            [0, 3],
            [0, 4],
            [3, 5],
            [4, 5]
          ]
        };
  renderGraph(graphCase);
}

function renderLiveAudit(entityType, entityValue, score, reportId) {
  const label = riskLabel(score);
  const items = [
    ["Source capture", `${entityType === "email" ? "Email identity, DNS, HTTPS, and breach exposure modules" : entityType === "company" ? "Company profile, domain posture, VAT, and compliance modules" : entityType === "wallet" ? "Wallet profile, on-chain account, and risk-feed modules" : entityType === "person" ? "User-provided identity, email, domain, and public-link modules" : "DNS, HTTP, and RDAP modules"} collected for ${entityValue}`],
    ["Model review", `${label} assigned from deterministic OSINT signals plus AI briefing`],
    ["Report draft", reportId ? `Report ${reportId} saved to Supabase` : "Briefing memo generated locally with source citations pending persistence"]
  ];
  byId("audit").innerHTML = items.map(([title, body]) => `<li><strong>${escapeHtml(title)}</strong>${escapeHtml(body)}</li>`).join("");
}

function renderOsintPanels(domain, osintData) {
  const modules = osintData.modules || {};
  if ((osintData.entity_type || "").toLowerCase() === "email") {
    setOsintPanelTitles([
      ["Identity Shield", "Email profile"],
      ["Mail DNS posture", "MX / SPF / DMARC"],
      ["Breach exposure", "Orvex Breach Intelligence"]
    ]);
    renderEmailPanels(osintData.email || domain, modules);
    return;
  }
  if ((osintData.entity_type || "").toLowerCase() === "company") {
    setOsintPanelTitles([
      ["Company profile", "Entity input"],
      ["Domain posture", "Web / DNS / RDAP"],
      ["Business coverage", "Registry / sanctions"]
    ]);
    renderCompanyPanels(osintData.company || domain, modules);
    return;
  }
  if ((osintData.entity_type || "").toLowerCase() === "wallet") {
    setOsintPanelTitles([
      ["Wallet profile", "Address format"],
      ["On-chain activity", "Balance / transactions"],
      ["Risk coverage", "Abuse / sanctions feed"]
    ]);
    renderWalletPanels(osintData.wallet || domain, modules);
    return;
  }
  if ((osintData.entity_type || "").toLowerCase() === "person") {
    setOsintPanelTitles([
      ["Identity Review", "User-provided fields"],
      ["Email posture", "Identity Shield subset"],
      ["Context coverage", "Domain / public links"]
    ]);
    renderPersonPanels(osintData.person || osintData.email || domain, modules);
    return;
  }
  setOsintPanelTitles([
    ["DNS intelligence", "Resolution & mail posture"],
    ["HTTP/S security", "Headers & transport"],
    ["RDAP registry", "Registration data"]
  ]);
  renderDnsPanel(modules.dns || {});
  renderHttpPanel(modules.http || {});
  renderRdapPanel(domain, modules.rdap || {});
}

function setOsintPanelTitles(items) {
  document.querySelectorAll(".osint-card").forEach((card, index) => {
    const [eyebrow, heading] = items[index] || [];
    if (eyebrow) card.querySelector(".eyebrow").textContent = eyebrow;
    if (heading) card.querySelector("h2").textContent = heading;
  });
}

function renderEmailPanels(email, modules) {
  renderIdentityPanel(modules.identity || {});
  renderMailDnsPanel(modules.mail_dns || {});
  renderBreachExposurePanel(email, modules.breach_exposure || {});
}

function renderCompanyPanels(company, modules) {
  renderCompanyProfilePanel(company, modules.company_profile || {});
  renderCompanyDomainPanel(modules.domain_posture || {});
  renderCompanyCompliancePanel(modules.registry_screening || {}, modules.sanctions_screening || {}, modules.vat_vies || {});
}

function renderWalletPanels(wallet, modules) {
  renderWalletProfilePanel(wallet, modules.wallet_profile || {});
  renderWalletActivityPanel(modules.etherscan_account || {});
  renderWalletRiskPanel(modules.risk_feed || {});
}

function renderWalletProfilePanel(wallet, profile) {
  const rows = [];
  if (!profile.ok) {
    rows.push(rowHtml("Status", badgeHtml("Failed", "fail")));
    rows.push(rowHtml("Error", profile.error || "Wallet profile module did not return data."));
  } else {
    rows.push(rowHtml("Address", profile.address || wallet));
    rows.push(rowHtml("Format", profile.format || "n/a"));
    rows.push(rowHtml("Chain", profile.chain || "ethereum"));
    rows.push(rowHtml("Chain ID", profile.chain_id || "1"));
    rows.push(rowHtml("Checksum", profile.checksum_verified ? badgeHtml("Verified") : badgeHtml("Not enforced", "warn")));
  }
  byId("dnsResults").innerHTML = rows.join("");
}

function renderWalletActivityPanel(account) {
  const rows = [];
  rows.push(rowHtml("Provider", account.provider || "Etherscan V2"));
  rows.push(rowHtml("Status", account.configured ? (account.ok ? badgeHtml("Connected") : badgeHtml("Failed", "fail")) : badgeHtml("API key needed", "warn")));
  if (account.configured && account.ok) {
    rows.push(rowHtml("Balance", `${account.native_balance_eth ?? 0} ETH`));
    rows.push(rowHtml("Tx sample", String(account.transaction_count_sample ?? 0)));
    rows.push(rowHtml("First seen", account.first_seen || "n/a"));
    rows.push(rowHtml("Last seen", account.last_seen || "n/a"));
  }
  rows.push(rowHtml("Note", account.note || account.error || "n/a"));
  byId("httpResults").innerHTML = rows.join("");
}

function renderWalletRiskPanel(riskFeed) {
  const rows = [];
  rows.push(rowHtml("Risk feed", riskFeed.configured ? badgeHtml("Configured") : badgeHtml("Business plan", "warn")));
  rows.push(rowHtml("Provider", riskFeed.provider || "Wallet risk feed"));
  rows.push(rowHtml("Coverage", riskFeed.configured ? "Sanctions / abuse screening" : "Available with licensed provider"));
  rows.push(rowHtml("Note", riskFeed.note || riskFeed.error || "n/a"));
  byId("rdapResults").innerHTML = rows.join("");
}

function renderPersonPanels(person, modules) {
  renderPersonProfilePanel(person, modules.identity_profile || {});
  renderPersonEmailPanel(modules.email_posture || {});
  renderPersonContextPanel(modules.domain_posture || {}, modules.public_links || {});
}

function renderPersonProfilePanel(person, profile) {
  const rows = [];
  if (!profile.ok) {
    rows.push(rowHtml("Status", badgeHtml("Failed", "fail")));
    rows.push(rowHtml("Error", profile.error || "Identity profile module did not return data."));
  } else {
    rows.push(rowHtml("Name", profile.name || person || "Not provided"));
    rows.push(rowHtml("Email", profile.email || "Not provided"));
    rows.push(rowHtml("Domain", profile.domain || "Not provided"));
    rows.push(rowHtml("Private data", profile.private_data_collected ? badgeHtml("Collected", "fail") : badgeHtml("No")));
  }
  byId("dnsResults").innerHTML = rows.join("");
}

function renderPersonEmailPanel(emailPosture) {
  const rows = [];
  rows.push(rowHtml("Status", emailPosture.ok ? badgeHtml("Collected") : badgeHtml("Gap", "warn")));
  if (emailPosture.ok) {
    const identity = emailPosture.modules?.identity || {};
    const breach = emailPosture.modules?.breach_exposure || {};
    rows.push(rowHtml("Email", identity.email || emailPosture.email || "n/a"));
    rows.push(rowHtml("Domain", identity.domain || emailPosture.domain || "n/a"));
    rows.push(rowHtml("Breaches", breach.ok ? String(breach.breach_count || 0) : "n/a"));
    rows.push(rowHtml("Risk", `${emailPosture.risk?.risk_score ?? 0}/100`));
  } else {
    rows.push(rowHtml("Note", emailPosture.note || emailPosture.error || "Add an email to enable this check."));
  }
  byId("httpResults").innerHTML = rows.join("");
}

function renderPersonContextPanel(domainPosture, publicLinks) {
  const rows = [];
  rows.push(rowHtml("Domain posture", domainPosture.ok ? badgeHtml("Collected") : badgeHtml("Gap", "warn")));
  if (domainPosture.ok) {
    rows.push(rowHtml("Domain risk", `${domainPosture.risk?.risk_score ?? 0}/100`));
    rows.push(rowHtml("HTTPS", domainPosture.modules?.http?.checks?.has_https ? badgeHtml("Confirmed") : badgeHtml("Missing", "warn")));
  }
  rows.push(rowHtml("Public links", String(publicLinks.links_provided || 0)));
  rows.push(rowHtml("Link list", formatList(publicLinks.links)));
  rows.push(rowHtml("Note", publicLinks.note || domainPosture.note || domainPosture.error || "n/a"));
  byId("rdapResults").innerHTML = rows.join("");
}

function renderCompanyProfilePanel(company, profile) {
  const rows = [];
  if (!profile.ok) {
    rows.push(rowHtml("Status", badgeHtml("Failed", "fail")));
    rows.push(rowHtml("Error", profile.error || "Company profile module did not return data."));
  } else {
    rows.push(rowHtml("Company", profile.company_name || company));
    rows.push(rowHtml("Domain", profile.domain || "Not provided"));
    rows.push(rowHtml("VAT / P.IVA", profile.vat_number || "Not provided"));
    rows.push(rowHtml("Legal suffix", profile.has_legal_suffix ? badgeHtml("Detected") : badgeHtml("Not detected", "warn")));
    rows.push(rowHtml("Suffixes", formatList(profile.legal_suffixes_detected)));
  }
  byId("dnsResults").innerHTML = rows.join("");
}

function renderCompanyDomainPanel(domainPosture) {
  const rows = [];
  if (!domainPosture.ok) {
    rows.push(rowHtml("Status", badgeHtml("Gap", "warn")));
    rows.push(rowHtml("Error", domainPosture.error || "Official domain was not provided."));
  } else {
    const modules = domainPosture.modules || {};
    const http = modules.http || {};
    const dns = modules.dns || {};
    rows.push(rowHtml("Domain risk", `${domainPosture.risk?.risk_score ?? 0}/100`));
    rows.push(rowHtml("A records", formatList(dns.a)));
    rows.push(rowHtml("HTTPS", http.checks?.has_https ? badgeHtml("Confirmed") : badgeHtml("Missing", "fail")));
    rows.push(rowHtml("HSTS", http.checks?.has_hsts ? badgeHtml("Present") : badgeHtml("Missing", "warn")));
    rows.push(rowHtml("DMARC", dns.dmarc?.length ? badgeHtml("Present") : badgeHtml("Missing", "warn")));
  }
  byId("httpResults").innerHTML = rows.join("");
}

function renderCompanyCompliancePanel(registry, sanctions, vatVies = {}) {
  const rows = [];
  rows.push(rowHtml("VIES VAT", vatVies.vat_provided ? (vatVies.ok ? (vatVies.valid ? badgeHtml("Valid") : badgeHtml("Invalid", "fail")) : badgeHtml("Unavailable", "warn")) : badgeHtml("Not provided", "warn")));
  if (vatVies.vat_provided) {
    rows.push(rowHtml("VAT number", vatVies.vat_number || "n/a"));
    rows.push(rowHtml("VIES name", vatVies.name || "n/a"));
    rows.push(rowHtml("Request date", vatVies.request_date || "n/a"));
  }
  rows.push(rowHtml("Registry", registry.configured ? (registry.ok ? badgeHtml("Matched") : badgeHtml("No match", "warn")) : badgeHtml("Business plan", "warn")));
  rows.push(rowHtml("Provider", registry.provider || "n/a"));
  if (registry.configured) {
    rows.push(rowHtml("Matches", String(registry.match_count ?? 0)));
    rows.push(rowHtml("Best match", registry.best_match?.name || "n/a"));
    rows.push(rowHtml("Jurisdiction", registry.best_match?.jurisdiction_code || "n/a"));
    rows.push(rowHtml("Status", registry.best_match?.current_status || "n/a"));
  }
  rows.push(rowHtml("Sanctions", sanctions.configured ? badgeHtml("Configured") : badgeHtml("Business plan", "warn")));
  rows.push(rowHtml("Registry note", registry.note || registry.error || "n/a"));
  rows.push(rowHtml("Sanctions note", sanctions.note || sanctions.error || "n/a"));
  byId("rdapResults").innerHTML = rows.join("");
}

function renderIdentityPanel(identity) {
  const rows = [];
  if (!identity.ok) {
    rows.push(rowHtml("Status", badgeHtml("Failed", "fail")));
    rows.push(rowHtml("Error", identity.error || "Identity module did not return data."));
  } else {
    rows.push(rowHtml("Email", identity.email || "n/a"));
    rows.push(rowHtml("Domain", identity.domain || "n/a"));
    rows.push(rowHtml("Role mailbox", identity.is_role_account ? badgeHtml("Yes", "warn") : badgeHtml("No")));
    rows.push(rowHtml("Disposable", identity.is_disposable_domain ? badgeHtml("Detected", "fail") : badgeHtml("No")));
    rows.push(rowHtml("Plus tag", identity.has_plus_tag ? badgeHtml("Present", "warn") : badgeHtml("No")));
  }
  byId("dnsResults").innerHTML = rows.join("");
}

function renderMailDnsPanel(mailDns) {
  const rows = [];
  if (!mailDns.ok) {
    rows.push(rowHtml("Status", badgeHtml("Failed", "fail")));
    rows.push(rowHtml("Error", mailDns.error || "Mail DNS module did not return data."));
  } else {
    rows.push(rowHtml("MX", formatList(mailDns.mx)));
    rows.push(rowHtml("A", formatList(mailDns.a)));
    rows.push(rowHtml("SPF", mailDns.spf?.length ? badgeHtml("Present") : badgeHtml("Missing", "warn")));
    rows.push(rowHtml("DMARC", mailDns.dmarc?.length ? badgeHtml("Present") : badgeHtml("Missing", "warn")));
  }
  byId("httpResults").innerHTML = rows.join("");
}

function renderEmailDomainPanel(email, domainHttp) {
  const rows = [];
  if (!domainHttp.ok) {
    rows.push(rowHtml("Status", badgeHtml("Gap", "warn")));
    rows.push(rowHtml("Email", email));
    rows.push(rowHtml("Error", domainHttp.error || "Domain HTTPS module did not return data."));
  } else {
    rows.push(rowHtml("Code", domainHttp.status_code ?? "n/a"));
    rows.push(rowHtml("Final URL", domainHttp.final_url || "n/a"));
    rows.push(rowHtml("HTTPS", domainHttp.has_https ? badgeHtml("Confirmed") : badgeHtml("Missing", "fail")));
    rows.push(rowHtml("HSTS", domainHttp.security_headers?.hsts ? badgeHtml("Present") : badgeHtml("Missing", "warn")));
    rows.push(rowHtml("CSP", domainHttp.security_headers?.content_security_policy ? badgeHtml("Present") : badgeHtml("Missing", "warn")));
    if (domainHttp.security_headers?.server) rows.push(rowHtml("Server", domainHttp.security_headers.server));
  }
  byId("rdapResults").innerHTML = rows.join("");
}

function renderBreachExposurePanel(email, breachExposure) {
  const rows = [];
  if (!breachExposure.configured) {
    rows.push(rowHtml("Status", badgeHtml("Business plan", "warn")));
    rows.push(rowHtml("Provider", "Orvex Breach Intelligence"));
    rows.push(rowHtml("Note", "Configure the breach intelligence provider in the backend .env to enable exposure checks."));
  } else if (!breachExposure.ok) {
    rows.push(rowHtml("Status", badgeHtml("Failed", "fail")));
    rows.push(rowHtml("Provider", "Orvex Breach Intelligence"));
    rows.push(rowHtml("Error", breachExposure.error || "Breach intelligence module did not return data."));
  } else {
    const breaches = Array.isArray(breachExposure.breaches) ? breachExposure.breaches : [];
    rows.push(rowHtml("Email", email));
    rows.push(rowHtml("Breaches", breachExposure.breach_count ? badgeHtml(String(breachExposure.breach_count), "fail") : badgeHtml("0")));
    rows.push(rowHtml("Top records", breaches.length ? breaches.slice(0, 5).map((item) => escapeHtml(item.title || item.name || "Unknown breach")).join("<br>") : "No breach records returned"));
    rows.push(rowHtml("Data classes", formatList([...new Set(breaches.flatMap((item) => item.data_classes || []))].slice(0, 10))));
  }
  byId("rdapResults").innerHTML = rows.join("");
}

function renderDnsPanel(dns) {
  const rows = [];
  if (!dns.ok) {
    rows.push(rowHtml("Status", badgeHtml("Failed", "fail")));
    rows.push(rowHtml("Error", dns.error || "DNS module did not return data."));
  } else {
    rows.push(rowHtml("A", formatList(dns.a)));
    rows.push(rowHtml("MX", formatList(dns.mx)));
    rows.push(rowHtml("NS", formatList(dns.ns)));
    rows.push(rowHtml("SPF", dns.spf?.length ? badgeHtml("Present") : badgeHtml("Missing", "warn")));
    rows.push(rowHtml("DMARC", dns.dmarc?.length ? badgeHtml("Present") : badgeHtml("Missing", "warn")));
  }
  byId("dnsResults").innerHTML = rows.join("");
}

function renderHttpPanel(http) {
  const checks = http.checks || {};
  const https = http.https || {};
  const headers = http.security_headers || {};
  const page = http.page_metadata || {};
  const rows = [];
  if (!http.ok) {
    rows.push(rowHtml("Status", badgeHtml("Failed", "fail")));
    rows.push(rowHtml("Error", http.error || "HTTP module did not return data."));
  } else {
    rows.push(rowHtml("Code", https.status_code ?? http.http?.status_code ?? "n/a"));
    rows.push(rowHtml("Final URL", https.final_url || http.http?.final_url || "n/a"));
    rows.push(rowHtml("HTTPS", checks.has_https ? badgeHtml("Confirmed") : badgeHtml("Missing", "fail")));
    rows.push(rowHtml("HSTS", checks.has_hsts ? badgeHtml("Present") : badgeHtml("Missing", "warn")));
    rows.push(rowHtml("CSP", checks.has_content_security_policy ? badgeHtml("Present") : badgeHtml("Missing", "warn")));
    rows.push(rowHtml("X-Frame", checks.has_x_frame_options ? badgeHtml("Present") : badgeHtml("Missing", "warn")));
    rows.push(rowHtml("X-Content", checks.has_x_content_type_options ? badgeHtml("Present") : badgeHtml("Missing", "warn")));
    if (headers.server) rows.push(rowHtml("Server", headers.server));
    rows.push(rowHtml("HTML lang", page.html_language || badgeHtml("Not declared", "warn")));
    if (page.title) rows.push(rowHtml("Page title", page.title));
    if (page.meta_generator) rows.push(rowHtml("Generator", page.meta_generator));
    if (page.ok) {
      rows.push(rowHtml("CSS / JS", `${page.stylesheet_count ?? 0} CSS · ${page.script_count ?? 0} JS`));
    }
  }
  byId("httpResults").innerHTML = rows.join("");
}

function renderRdapPanel(domain, rdap) {
  const rows = [];
  if (!rdap.ok) {
    rows.push(rowHtml("Status", badgeHtml("Provider gap", "warn")));
    rows.push(rowHtml("Domain", domain));
    rows.push(rowHtml("Interpretation", "Registry data was not returned by the RDAP provider. This is a collection gap, not a negative finding."));
    rows.push(rowHtml("Next action", "Verify registration details through registrar WHOIS or national registry sources when needed."));
    if (rdap.error) rows.push(rowHtml("Provider note", escapeHtml(rdap.error)));
  } else {
    rows.push(rowHtml("Registrar", rdap.registrar || "n/a"));
    rows.push(rowHtml("Created", rdap.creation_date || "n/a"));
    rows.push(rowHtml("Expires", rdap.expiration_date || "n/a"));
    rows.push(rowHtml("Age days", rdap.domain_age_days ?? "n/a"));
    rows.push(rowHtml("Status", formatList(rdap.status)));
    rows.push(rowHtml("Nameservers", formatList(rdap.nameservers)));
  }
  byId("rdapResults").innerHTML = rows.join("");
}

function rowHtml(label, value) {
  return `<div class="osint-row"><span>${escapeHtml(label)}</span><strong>${value}</strong></div>`;
}

function badgeHtml(label, tone = "") {
  return `<span class="badge ${tone}">${escapeHtml(label)}</span>`;
}

function formatList(values) {
  if (!Array.isArray(values) || values.length === 0) return "n/a";
  return values.slice(0, 8).map((value) => escapeHtml(value)).join("<br>");
}

function pdfExportButtons() {
  return ["exportReport", "exportReportInline", "exportReportSearch"]
    .map((id) => byId(id))
    .filter(Boolean);
}

function setupPdfExportButtons() {
  pdfExportButtons().forEach((button) => {
    button.addEventListener("click", exportProfessionalPdf);
  });
  updatePdfExportButtons(Boolean(state.lastAnalysis));
}

function updatePdfExportButtons(hasReport = Boolean(state.lastAnalysis), pulse = false) {
  pdfExportButtons().forEach((button) => {
    button.disabled = !hasReport;
    if (button.id === "exportReportSearch") {
      button.hidden = !hasReport;
      button.classList.toggle("is-ready", Boolean(hasReport && pulse));
      if (hasReport && pulse) {
        window.setTimeout(() => button.classList.remove("is-ready"), 3000);
      }
    }
  });
}

function exportProfessionalPdf() {
  const report = state.lastAnalysis || restoreLastAnalysisReport();
  if (!report) {
    updatePdfExportButtons(false);
    showToast("No report available to export. Run one analysis first.", "error");
    return;
  }

  const printWindow = window.open("", "_blank", "width=1100,height=900");
  if (!printWindow) {
    showToast("Popup blocked. Allow popups to export the PDF.", "error");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(buildReportHtml(report));
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => {
    printWindow.print();
  }, 500);
  showToast("PDF report prepared");
}

function buildReportHtml(report) {
  const osint = report.osintData || {};
  const modules = osint.modules || {};
  const dns = modules.dns || {};
  const http = modules.http || {};
  const rdap = modules.rdap || {};
  const pdfLang = currentLanguage === "it" ? "it" : "en";
  const pdfText = getPdfText(pdfLang);
  const reportType = (report.entityType || osint.entity_type || "").toLowerCase();
  const isEmailReport = reportType === "email";
  const isCompanyReport = reportType === "company";
  const isWalletReport = reportType === "wallet";
  const isPersonReport = reportType === "person";
  const findings = osint.risk?.findings || [];
  const customerFindings = report.customerFindings?.length ? report.customerFindings : buildCustomerFindings(reportType || "domain", modules, findings);
  const recommendations = report.recommendations?.length ? report.recommendations : buildRecommendations(report, modules, findings);
  const riskLevel = osint.risk?.risk_level || riskLabel(report.riskScore);
  const reportTitle = isEmailReport
    ? pdfText.emailReport
    : isCompanyReport
    ? pdfText.companyReport
    : isWalletReport
    ? pdfText.walletReport
    : isPersonReport
    ? pdfText.personReport
    : pdfText.domainReport;
  const generatedAt = new Date(report.generatedAt).toLocaleString();
  const sourceCount = Array.isArray(osint.sources_cited) ? osint.sources_cited.length : 0;
  const sourceConfidence = sourceCount >= 4 ? pdfText.high : sourceCount >= 2 ? pdfText.medium : pdfText.limited;
  const classification = pdfText.classification;
  const reportPurpose = isEmailReport
    ? pdfText.emailPurpose
    : isCompanyReport
    ? pdfText.companyPurpose
    : isWalletReport
    ? pdfText.walletPurpose
    : isPersonReport
    ? pdfText.personPurpose
    : pdfText.domainPurpose;
  const productUrl = "https://orvexintelligence.com/osint-fusion";
  const officialUrl = "https://orvexintelligence.com";
  const contactEmail = "contact@orvexintelligence.com";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=132x132&margin=8&data=${encodeURIComponent(productUrl)}`;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Orvex Intelligence Report - ${escapeHtml(report.entityValue)}</title>
    <style>
      @page { size: A4; margin: 10mm; }
      * { box-sizing: border-box; }
      html {
        margin: 0;
        padding: 0;
        background: #ffffff;
      }
      body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #c8d8e8;
        font-family: Inter, Arial, sans-serif;
        line-height: 1.38;
      }
      .report {
        width: 100%;
        max-width: none;
        margin: 0 auto;
        background: #080c14;
      }
      .masthead {
        position: relative;
        overflow: hidden;
        border: 1px solid #1e2d42;
        background:
          linear-gradient(135deg, rgba(42, 127, 255, 0.18), transparent 38%),
          linear-gradient(180deg, #101828, #080c14);
        border-radius: 12px;
        padding: 18px;
        margin-bottom: 12px;
        display: flex;
        justify-content: space-between;
        gap: 18px;
        break-inside: avoid;
      }
      .masthead::after {
        content: none;
      }
      .masthead > * { position: relative; z-index: 1; }
      .brand {
        font-family: "Courier New", monospace;
        color: #2a7fff;
        font-weight: 800;
        letter-spacing: 0.08em;
        font-size: 13px;
        text-transform: uppercase;
      }
      .classification {
        display: inline-block;
        margin-top: 12px;
        border: 1px solid rgba(239,140,0,0.45);
        color: #ffc266;
        background: rgba(239,140,0,0.12);
        border-radius: 6px;
        padding: 6px 10px;
        font-family: "Courier New", monospace;
        font-size: 11px;
        font-weight: 700;
      }
      h1, h2, h3 {
        margin: 0;
        color: #c8d8e8;
      }
      h1 {
        font-family: "Courier New", monospace;
        font-size: 28px;
        line-height: 1.05;
        margin-top: 8px;
        text-transform: uppercase;
      }
      h2 {
        font-family: "Courier New", monospace;
        font-size: 16px;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .meta {
        text-align: right;
        font-family: "Courier New", monospace;
        font-size: 11px;
        color: #90a7bf;
      }
      .product-line {
        margin-top: 12px;
        color: #7a92aa;
        max-width: 520px;
      }
      .product-link {
        color: #00b8d9;
        font-family: "Courier New", monospace;
        font-size: 12px;
        margin-top: 12px;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: 180px 1fr;
        gap: 12px;
        margin-bottom: 12px;
        break-inside: avoid;
      }
      .control-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin: 12px 0;
        break-inside: avoid;
      }
      .control-card {
        border: 1px solid rgba(42,127,255,0.24);
        background: rgba(16,24,40,0.62);
        border-radius: 8px;
        padding: 9px;
      }
      .control-card span {
        display: block;
        color: #90a7bf;
        font-family: "Courier New", monospace;
        font-size: 10px;
        text-transform: uppercase;
        margin-bottom: 5px;
      }
      .control-card strong {
        color: #c8d8e8;
        font-family: "Courier New", monospace;
        font-size: 13px;
      }
      .risk-box {
        border: 1px solid rgba(42,127,255,0.32);
        border-radius: 8px;
        padding: 12px;
        background: rgba(16,24,40,0.82);
      }
      .risk-score {
        font-family: "Courier New", monospace;
        font-size: 40px;
        font-weight: 800;
        color: ${report.riskScore >= 80 ? "#e53935" : report.riskScore >= 60 ? "#ef8c00" : "#2a7fff"};
      }
      .risk-label {
        font-family: "Courier New", monospace;
        color: #90a7bf;
        text-transform: uppercase;
        font-size: 12px;
      }
      .risk-meter {
        position: relative;
        height: 9px;
        margin-top: 10px;
        overflow: hidden;
        border: 1px solid rgba(42,127,255,0.3);
        border-radius: 999px;
        background: #050a12;
      }
      .risk-meter i {
        display: block;
        width: ${Math.max(2, Math.min(100, Number(report.riskScore) || 0))}%;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #2a7fff, #00b8d9, #ef8c00);
        box-shadow: 0 0 16px rgba(0,184,217,0.45);
      }
      .memo {
        border: 1px solid rgba(42,127,255,0.32);
        border-radius: 8px;
        padding: 12px;
        background: rgba(16,24,40,0.72);
      }
      .memo p { margin-bottom: 0; }
      .disclaimer {
        border-color: rgba(239,140,0,0.34);
        background: rgba(239,140,0,0.08);
      }
      .disclaimer p {
        margin: 0;
        color: #d7c4a7;
        font-size: 12px;
      }
      .section {
        break-inside: auto;
        page-break-inside: auto;
        border: 1px solid rgba(42,127,255,0.24);
        background: rgba(16,24,40,0.58);
        border-radius: 10px;
        padding: 12px;
        margin-top: 10px;
      }
      .section + .section {
        padding-top: 12px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }
      th, td {
        text-align: left;
        vertical-align: top;
        border-bottom: 1px solid rgba(122,146,170,0.22);
        padding: 6px 6px;
        word-break: break-word;
      }
      th {
        width: 150px;
        color: #90a7bf;
        font-family: "Courier New", monospace;
        text-transform: uppercase;
        font-size: 11px;
      }
      .badge {
        display: inline-block;
        border-radius: 999px;
        padding: 3px 8px;
        background: rgba(42,127,255,0.18);
        color: #2a7fff;
        font-family: "Courier New", monospace;
        font-size: 11px;
      }
      .badge.warn { background: rgba(239,140,0,0.18); color: #ef8c00; }
      .badge.fail { background: rgba(229,57,53,0.18); color: #ff8a8a; }
      .findings {
        margin: 0;
        padding-left: 18px;
      }
      .recommendations {
        display: grid;
        gap: 8px;
        margin: 0;
        padding-left: 18px;
      }
      .split-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .mini-card {
        border: 1px solid rgba(42,127,255,0.22);
        background: rgba(8,12,20,0.52);
        border-radius: 8px;
        padding: 10px;
        min-height: 80px;
      }
      .mini-card span {
        display: block;
        color: #90a7bf;
        font-family: "Courier New", monospace;
        font-size: 10px;
        text-transform: uppercase;
        margin-bottom: 5px;
      }
      .mini-card strong {
        color: #c8d8e8;
        font-family: "Courier New", monospace;
        font-size: 13px;
      }
      .mini-card p {
        margin: 6px 0 0;
        color: #90a7bf;
        font-size: 11px;
      }
      .source-matrix {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
      .source-tile {
        border: 1px solid rgba(42,127,255,0.24);
        background: linear-gradient(180deg, rgba(42,127,255,0.09), rgba(8,12,20,0.56));
        border-radius: 8px;
        padding: 9px;
      }
      .source-tile span,
      .source-tile strong {
        display: block;
        font-family: "Courier New", monospace;
      }
      .source-tile span {
        color: #90a7bf;
        font-size: 10px;
        text-transform: uppercase;
      }
      .source-tile strong {
        margin-top: 5px;
        color: #00b8d9;
        font-size: 12px;
      }
      .qr-card {
        display: grid;
        grid-template-columns: 138px 1fr;
        gap: 16px;
        align-items: center;
        border: 1px solid rgba(42,127,255,0.28);
        background: rgba(8,12,20,0.72);
        border-radius: 10px;
        padding: 14px;
        margin-top: 16px;
      }
      .qr-card img {
        width: 132px;
        height: 132px;
        background: #ffffff;
        border-radius: 8px;
      }
      .qr-card strong {
        display: block;
        color: #00b8d9;
        font-family: "Courier New", monospace;
        margin-bottom: 6px;
      }
      .appendix {
        white-space: normal;
        word-break: break-word;
        font-size: 12px;
        background: rgba(8,12,20,0.75);
        border: 1px solid rgba(42,127,255,0.22);
        border-radius: 8px;
        padding: 12px;
      }
      .footer {
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid rgba(42,127,255,0.28);
        font-family: "Courier New", monospace;
        color: #90a7bf;
        font-size: 10px;
        break-inside: avoid;
      }
      a { color: #00b8d9; text-decoration: none; }
      @media print {
        html, body {
          width: 210mm;
          min-height: 0;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        .masthead::after {
          content: none !important;
          display: none !important;
        }
        .report > *:last-child {
          margin-bottom: 0 !important;
        }
      }
    </style>
  </head>
  <body>
    <main class="report">
      <header class="masthead">
        <div>
          <div class="brand">ORVEX / INTEL</div>
          <h1>OSINT Fusion<br>${escapeHtml(reportTitle)}</h1>
          <div class="product-line">${escapeHtml(pdfText.productLine(reportPurpose))}</div>
          <div class="classification">${escapeHtml(classification)}</div>
          <div class="product-link">${escapeHtml(productUrl)}</div>
        </div>
        <div class="meta">
          <div>${escapeHtml(pdfText.entity)}: ${escapeHtml(report.entityValue)}</div>
          <div>${escapeHtml(pdfText.entityType)}: ${escapeHtml(report.entityType || osint.entity_type || "domain")}</div>
          <div>${escapeHtml(pdfText.osintDomain)}: ${escapeHtml(report.osintDomain)}</div>
          <div>${escapeHtml(pdfText.generated)}: ${escapeHtml(generatedAt)}</div>
          <div>CASE ID: ${escapeHtml(report.caseId || "local / not persisted")}</div>
          <div>REPORT ID: ${escapeHtml(report.reportId || "local / not persisted")}</div>
          <div>${escapeHtml(pdfText.source)}: ${escapeHtml(officialUrl)}</div>
        </div>
      </header>

      <section class="control-grid">
        <div class="control-card"><span>${escapeHtml(pdfText.reportClass)}</span><strong>${escapeHtml(reportTitle)}</strong></div>
        <div class="control-card"><span>${escapeHtml(pdfText.sourceConfidence)}</span><strong>${escapeHtml(sourceConfidence)}</strong></div>
        <div class="control-card"><span>${escapeHtml(pdfText.sourcesCited)}</span><strong>${sourceCount || "n/a"}</strong></div>
        <div class="control-card"><span>${escapeHtml(pdfText.reviewStatus)}</span><strong>${escapeHtml(pdfText.humanReview)}</strong></div>
      </section>

      <section class="summary-grid">
        <div class="risk-box">
          <div class="risk-label">${escapeHtml(pdfText.riskScore)}</div>
          <div class="risk-score">${report.riskScore}</div>
          <div class="risk-label">${escapeHtml(localizeRiskLevel(riskLevel, pdfLang))}</div>
          <div class="risk-meter"><i></i></div>
        </div>
        <div class="memo">
          <h2>${escapeHtml(pdfText.executiveBriefing)}</h2>
          <p>${escapeHtml(report.summary)}</p>
        </div>
      </section>

      <section class="section">
        <h2>${escapeHtml(pdfText.collectionCoverage)}</h2>
        ${buildSourceMatrixHtml(osint, modules, pdfText)}
      </section>

      <section class="section">
        <h2>${escapeHtml(pdfText.deterministicFindings)}</h2>
        ${customerFindings.length ? `<ul class="findings">${customerFindings.map((item) => `<li>${escapeHtml(localizePdfSentence(item, pdfLang))}</li>`).join("")}</ul>` : `<p>${escapeHtml(pdfText.noFindings)}</p>`}
      </section>

      <section class="section">
        <h2>${escapeHtml(pdfText.recommendedActions)}</h2>
        <ul class="recommendations">
          ${recommendations.map((item) => `<li>${escapeHtml(localizePdfSentence(item, pdfLang))}</li>`).join("")}
        </ul>
      </section>

      <section class="section disclaimer">
        <h2>${escapeHtml(pdfText.reportDisclaimer)}</h2>
        <p>${escapeHtml(pdfText.disclaimer)}</p>
      </section>

      ${buildEvidenceSections(report, modules, pdfText)}

      <section class="section">
        <h2>${escapeHtml(pdfText.technicalAppendix)}</h2>
        <div class="appendix">${buildTechnicalAppendixHtml(osint, modules, pdfText)}</div>
      </section>

      <section class="section">
        <h2>Orvex OSINT Fusion</h2>
        <div class="qr-card">
          <img alt="QR code for Orvex OSINT Fusion" src="${qrUrl}">
          <div>
            <strong>${escapeHtml(pdfText.scanAccess)}</strong>
            <div>${escapeHtml(productUrl)}</div>
            <p>${escapeHtml(pdfText.generatedBy(contactEmail))}</p>
          </div>
        </div>
      </section>

      <footer class="footer">
        ${escapeHtml(pdfText.footer(productUrl, officialUrl, contactEmail))}
      </footer>
    </main>
  </body>
</html>`;
}

function reportTable(rows) {
  return `<table>${rows
    .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${value}</td></tr>`)
    .join("")}</table>`;
}

function getPdfText(lang = "en") {
  if (lang === "it") {
    return {
      domainReport: "Report rischio dominio",
      emailReport: "Report rischio email",
      companyReport: "Report due diligence aziendale",
      walletReport: "Report rischio wallet",
      personReport: "Report revisione identita",
      high: "Alta",
      medium: "Media",
      limited: "Limitata",
      classification: "OSINT LECITO / REVISIONE CLIENTE",
      domainPurpose: "Due diligence dominio",
      emailPurpose: "Analisi identita email ed esposizione breach",
      companyPurpose: "Due diligence rischio azienda/fornitore",
      walletPurpose: "Revisione wallet ed esposizione blockchain",
      personPurpose: "Revisione identita da contesto fornito dall'utente",
      productLine: (purpose) => `Software di cyber intelligence e consulenza enterprise security. ${purpose} generata da Orvex OSINT Fusion.`,
      entity: "ENTITA",
      entityType: "TIPO ENTITA",
      osintDomain: "DOMINIO OSINT",
      generated: "GENERATO",
      source: "FONTE",
      reportClass: "Classe report",
      sourceConfidence: "Affidabilita fonti",
      sourcesCited: "Fonti citate",
      reviewStatus: "Stato revisione",
      humanReview: "Revisione umana richiesta",
      riskScore: "Punteggio rischio",
      executiveBriefing: "Briefing esecutivo",
      collectionCoverage: "Copertura raccolta",
      deterministicFindings: "Finding deterministici",
      recommendedActions: "Azioni consigliate",
      reportDisclaimer: "Disclaimer report",
      disclaimer: "Questo report e un briefing analitico OSINT generato da fonti pubbliche e segnali di provider configurati. Non e prova legale, output investigativo privato, sorveglianza, credit scoring, screening lavorativo o decisione compliance automatizzata. Azioni operative, legali, HR, creditizie, di sicurezza e compliance richiedono revisione umana, verifica delle fonti e giudizio professionale.",
      technicalAppendix: "Appendice tecnica",
      noFindings: "Nessun finding deterministico restituito.",
      scanAccess: "Scansiona per accedere a Orvex OSINT Fusion",
      generatedBy: (email) => `Generato da Orvex Intelligence. Per consulenza enterprise security, incident response e servizi di cyber intelligence, contatta ${email}.`,
      footer: (productUrl, officialUrl, email) => `Generato da Orvex OSINT Fusion - ${productUrl} - ${officialUrl} - ${email} - Report OSINT lecito da fonti pubbliche.`,
      modules: "Moduli",
      sources: "Fonti",
      collected: "Raccolto",
      noModuleList: "Nessuna lista moduli restituita",
      noCitations: "Nessuna citazione restituita",
      timestampNote: "Timestamp dalla pipeline di raccolta OSINT",
      dnsMail: "DNS / Mail",
      httpSecurity: "Sicurezza HTTP",
      registryCompliance: "Registro / Compliance",
      collectedStatus: "Raccolto",
      gapStatus: "Gap",
      partialCollected: "Parziale / raccolto",
      dnsNoteOk: "Evidenze disponibili su risoluzione e autenticazione mail.",
      dnsNoteGap: "Nessuna evidenza DNS/mail restituita.",
      httpNoteOk: "Postura trasporto e header web disponibile.",
      httpNoteGap: "Nessuna evidenza sicurezza HTTP restituita.",
      registryNoteOk: "Copertura registry, RDAP, VAT o compliance presente.",
      registryNoteGap: "Nessuna copertura registry/compliance restituita.",
      modulesExecuted: "Moduli eseguiti",
      rawEvidence: "Evidenza raw",
      rawEvidenceNote: "Conservata nel record caso dell'applicazione/database. Il PDF cliente sintetizza l'evidenza raw per evitare pagine di stampa sovradimensionate.",
      identityShield: "Identity Shield",
      mailDnsPosture: "Postura DNS mail",
      breachExposure: "Esposizione breach",
      domainHttpsPosture: "Postura HTTPS dominio",
      companyProfile: "Profilo azienda",
      domainPosture: "Postura dominio",
      complianceCoverage: "Copertura compliance",
      walletProfile: "Profilo wallet",
      onchainAccount: "Account on-chain",
      riskCoverage: "Copertura rischio",
      identityReview: "Revisione identita",
      emailDomainContext: "Contesto email/dominio",
      dnsIntelligence: "Intelligence DNS",
      httpsSecurity: "Sicurezza HTTP/S",
      rdapRegistry: "Registro RDAP"
    };
  }
  return {
    domainReport: "Domain Risk Report",
    emailReport: "Email Risk Report",
    companyReport: "Company Due Diligence Report",
    walletReport: "Wallet Risk Report",
    personReport: "Identity Review Report",
    high: "High",
    medium: "Medium",
    limited: "Limited",
    classification: "LAWFUL OSINT / CLIENT REVIEW",
    domainPurpose: "Domain due-diligence",
    emailPurpose: "Email identity and breach exposure analysis",
    companyPurpose: "Company/vendor risk due diligence",
    walletPurpose: "Wallet and blockchain exposure review",
    personPurpose: "User-provided identity context review",
    productLine: (purpose) => `Cyber Intelligence Software & Enterprise Security Consulting. ${purpose} generated by Orvex OSINT Fusion.`,
    entity: "ENTITY",
    entityType: "ENTITY TYPE",
    osintDomain: "OSINT DOMAIN",
    generated: "GENERATED",
    source: "SOURCE",
    reportClass: "Report Class",
    sourceConfidence: "Source Confidence",
    sourcesCited: "Sources Cited",
    reviewStatus: "Review Status",
    humanReview: "Human Review Required",
    riskScore: "Risk score",
    executiveBriefing: "Executive Briefing",
    collectionCoverage: "Collection Coverage",
    deterministicFindings: "Deterministic Findings",
    recommendedActions: "Recommended Actions",
    reportDisclaimer: "Report Disclaimer",
    disclaimer: "This report is an analytical OSINT briefing generated from public-source and configured third-party signals. It is not legal proof, private investigation output, surveillance, credit scoring, employment screening, or an automated compliance decision. Operational, legal, HR, credit, security, and compliance actions require human review, source verification, and professional judgment.",
    technicalAppendix: "Technical Appendix",
    noFindings: "No deterministic findings returned.",
    scanAccess: "Scan to access Orvex OSINT Fusion",
    generatedBy: (email) => `Generated by Orvex Intelligence. For enterprise security consulting, incident response, and cyber intelligence services, contact ${email}.`,
    footer: (productUrl, officialUrl, email) => `Generated by Orvex OSINT Fusion - ${productUrl} - ${officialUrl} - ${email} - Lawful public-source intelligence report.`,
    modules: "Modules",
    sources: "Sources",
    collected: "Collected",
    noModuleList: "No module list returned",
    noCitations: "No citations returned",
    timestampNote: "Timestamp from OSINT collection pipeline",
    dnsMail: "DNS / Mail",
    httpSecurity: "HTTP Security",
    registryCompliance: "Registry / Compliance",
    collectedStatus: "Collected",
    gapStatus: "Gap",
    partialCollected: "Partial / Collected",
    dnsNoteOk: "Resolution and mail-authentication evidence available.",
    dnsNoteGap: "No DNS/mail posture evidence returned.",
    httpNoteOk: "Transport and web-header posture available.",
    httpNoteGap: "No HTTP security evidence returned.",
    registryNoteOk: "Registry, RDAP, VAT, or compliance coverage present.",
    registryNoteGap: "No registry/compliance coverage returned.",
    modulesExecuted: "Modules Executed",
    rawEvidence: "Raw Evidence",
    rawEvidenceNote: "Retained in the application/database case record. The client PDF summarizes raw evidence to prevent oversized print pages.",
    identityShield: "Identity Shield",
    mailDnsPosture: "Mail DNS Posture",
    breachExposure: "Breach Exposure",
    domainHttpsPosture: "Domain HTTPS Posture",
    companyProfile: "Company Profile",
    domainPosture: "Domain Posture",
    complianceCoverage: "Compliance Coverage",
    walletProfile: "Wallet Profile",
    onchainAccount: "On-chain Account",
    riskCoverage: "Risk Coverage",
    identityReview: "Identity Review",
    emailDomainContext: "Email / Domain Context",
    dnsIntelligence: "DNS Intelligence",
    httpsSecurity: "HTTP/S Security",
    rdapRegistry: "RDAP Registry"
  };
}

function localizeRiskLevel(value, lang = "en") {
  if (lang !== "it") return value;
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("high")) return "Rischio alto";
  if (normalized.includes("elevated")) return "Rischio elevato";
  if (normalized.includes("moderate")) return "Rischio moderato";
  if (normalized.includes("low")) return "Rischio basso";
  return value;
}

function localizePdfSentence(value, lang = "en") {
  if (lang !== "it") return value;
  return String(value || "")
    .replaceAll("HTTPS is available and the target responded successfully.", "HTTPS disponibile e target raggiunto correttamente.")
    .replaceAll("SPF and DMARC records are present for mail authentication.", "Record SPF e DMARC presenti per l'autenticazione email.")
    .replaceAll("Content-Security-Policy is not currently detected on the web surface.", "Content-Security-Policy non rilevata sulla superficie web.")
    .replaceAll("X-Frame-Options or an equivalent frame-ancestors policy is not currently detected.", "X-Frame-Options o policy frame-ancestors equivalente non rilevata.")
    .replaceAll("X-Content-Type-Options is not currently detected.", "X-Content-Type-Options non rilevato.")
    .replaceAll("Deploy a Content-Security-Policy tailored to the application to reduce script injection exposure.", "Implementa una Content-Security-Policy adatta all'applicazione per ridurre l'esposizione a script injection.")
    .replaceAll("Add X-Frame-Options or CSP frame-ancestors to reduce clickjacking exposure.", "Aggiungi X-Frame-Options o CSP frame-ancestors per ridurre il rischio di clickjacking.")
    .replaceAll("Add X-Content-Type-Options: nosniff to prevent MIME type confusion.", "Aggiungi X-Content-Type-Options: nosniff per prevenire confusione MIME.")
    .replaceAll("Track deterministic findings in the case file and preserve source snapshots for auditability.", "Traccia i finding deterministici nel fascicolo e conserva snapshot delle fonti per auditabilita.");
}

function buildSourceMatrixHtml(osint, modules, text = getPdfText("en")) {
  const moduleNames = Object.keys(modules || {});
  const sources = Array.isArray(osint.sources_cited) ? osint.sources_cited : [];
  const sourceTiles = [
    [text.modules, moduleNames.length || "n/a", moduleNames.slice(0, 8).join(" / ") || text.noModuleList],
    [text.sources, sources.length || "n/a", sources.slice(0, 8).join(" / ") || text.noCitations],
    [text.collected, osint.collected_at ? new Date(osint.collected_at).toLocaleString() : "n/a", text.timestampNote]
  ];

  const hasDns = Boolean(modules.dns || modules.mail_dns || modules.domain_posture?.modules?.dns);
  const hasHttp = Boolean(modules.http || modules.domain_http || modules.domain_posture?.modules?.http);
  const hasRegistry = Boolean(modules.rdap || modules.domain_posture?.modules?.rdap || modules.registry_screening || modules.vat_vies);
  const coverageCards = [
    [text.dnsMail, hasDns ? text.collectedStatus : text.gapStatus, hasDns ? text.dnsNoteOk : text.dnsNoteGap],
    [text.httpSecurity, hasHttp ? text.collectedStatus : text.gapStatus, hasHttp ? text.httpNoteOk : text.httpNoteGap],
    [text.registryCompliance, hasRegistry ? text.partialCollected : text.gapStatus, hasRegistry ? text.registryNoteOk : text.registryNoteGap]
  ];

  return `
    <div class="source-matrix">
      ${sourceTiles
        .map(([label, value, note]) => `<div class="source-tile"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong><p>${escapeHtml(note)}</p></div>`)
        .join("")}
    </div>
    <div class="split-grid" style="margin-top:10px;">
      ${coverageCards
        .map(([label, value, note]) => `<div class="mini-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><p>${escapeHtml(note)}</p></div>`)
        .join("")}
    </div>
  `;
}

function buildTechnicalAppendixHtml(osint, modules, text = getPdfText("en")) {
  const moduleNames = Object.keys(modules || {});
  const sources = Array.isArray(osint.sources_cited) ? osint.sources_cited : [];
  return `
    ${reportTable([
      ["Entity", osint.email || osint.domain || osint.entity_value || "n/a"],
      [text.entityType, osint.entity_type || "domain"],
      [text.collected, osint.collected_at ? escapeHtml(new Date(osint.collected_at).toLocaleString()) : "n/a"],
      [text.modulesExecuted, moduleNames.length ? moduleNames.map(escapeHtml).join("<br>") : "n/a"],
      [text.sourcesCited, sources.length ? sources.map(escapeHtml).join("<br>") : "n/a"],
      [text.rawEvidence, text.rawEvidenceNote]
    ])}
  `;
}

function buildEvidenceSections(report, modules, text = getPdfText("en")) {
  const isEmailReport = (report.entityType || "").toLowerCase() === "email";
  const isCompanyReport = (report.entityType || "").toLowerCase() === "company";
  const isWalletReport = (report.entityType || "").toLowerCase() === "wallet";
  const isPersonReport = (report.entityType || "").toLowerCase() === "person";
  if (isEmailReport) {
    const identity = modules.identity || {};
    const mailDns = modules.mail_dns || {};
    const domainHttp = modules.domain_http || {};
    const breach = modules.breach_exposure || {};
    const breaches = Array.isArray(breach.breaches) ? breach.breaches : [];
    return `
      <section class="section">
        <h2>${escapeHtml(text.identityShield)}</h2>
        ${reportTable([
          ["Email", identity.email || report.entityValue || "n/a"],
          ["Domain", identity.domain || "n/a"],
          ["Syntax", identity.syntax_valid ? badgePlain("Valid syntax") : badgePlain("Invalid", "fail")],
          ["Role Mailbox", identity.is_role_account ? badgePlain("Yes", "warn") : badgePlain("No")],
          ["Disposable", identity.is_disposable_domain ? badgePlain("Detected", "fail") : badgePlain("No")],
          ["Consumer Provider", identity.is_consumer_email_domain ? badgePlain("Yes", "warn") : badgePlain("No")],
          ["Mailbox Exists", identity.mailbox_existence_verified ? badgePlain("Verified") : badgePlain("Not verified", "warn")],
          ["Ownership", identity.ownership_verified ? badgePlain("Verified") : badgePlain("Not verified", "warn")]
        ])}
      </section>

      <section class="section">
        <h2>${escapeHtml(text.mailDnsPosture)}</h2>
        ${reportTable([
          ["MX Records", formatPlainList(mailDns.mx)],
          ["A Records", formatPlainList(mailDns.a)],
          ["SPF", mailDns.spf?.length ? badgePlain("Present") : badgePlain("Missing", "warn")],
          ["DMARC", mailDns.dmarc?.length ? badgePlain("Present") : badgePlain("Missing", "warn")],
          ["Module Status", mailDns.ok ? badgePlain("OK") : badgePlain("Failed", "fail")]
        ])}
      </section>

      <section class="section">
        <h2>${escapeHtml(text.breachExposure)}</h2>
        ${reportTable([
          ["Source", "Have I Been Pwned"],
          ["Module Status", !breach.configured ? badgePlain("Not configured", "warn") : breach.ok ? badgePlain("OK") : badgePlain("Failed", "fail")],
          ["Breach Count", breach.ok ? String(breach.breach_count || 0) : "n/a"],
          ["Top Breaches", breaches.length ? breaches.slice(0, 8).map((item) => escapeHtml(item.title || item.name || "Unknown breach")).join("<br>") : "n/a"],
          ["Data Classes", formatPlainList([...new Set(breaches.flatMap((item) => item.data_classes || []))])],
          ["Error", breach.error || "n/a"]
        ])}
      </section>

      <section class="section">
        <h2>${escapeHtml(text.domainHttpsPosture)}</h2>
        ${reportTable([
          ["Status Code", domainHttp.status_code ?? "n/a"],
          ["Final URL", domainHttp.final_url || "n/a"],
          ["HTTPS", domainHttp.has_https ? badgePlain("Confirmed") : badgePlain("Missing", "fail")],
          ["HSTS", domainHttp.security_headers?.hsts ? badgePlain("Present") : badgePlain("Missing", "warn")],
          ["CSP", domainHttp.security_headers?.content_security_policy ? badgePlain("Present") : badgePlain("Missing", "warn")],
          ["Server", domainHttp.security_headers?.server || "n/a"]
        ])}
      </section>
    `;
  }

  if (isCompanyReport) {
    const profile = modules.company_profile || {};
    const domainPosture = modules.domain_posture || {};
    const vatVies = modules.vat_vies || {};
    const registry = modules.registry_screening || {};
    const sanctions = modules.sanctions_screening || {};
    const domainModules = domainPosture.modules || {};
    return `
      <section class="section">
        <h2>${escapeHtml(text.companyProfile)}</h2>
        ${reportTable([
          ["Company", profile.company_name || report.entityValue || "n/a"],
          ["Official Domain", profile.domain || "Not provided"],
          ["VAT / P.IVA", profile.vat_number || "Not provided"],
          ["Legal Suffix", profile.has_legal_suffix ? badgePlain("Detected") : badgePlain("Not detected", "warn")],
          ["Suffixes", formatPlainList(profile.legal_suffixes_detected)]
        ])}
      </section>

      <section class="section">
        <h2>${escapeHtml(text.domainPosture)}</h2>
        ${reportTable([
          ["Module Status", domainPosture.ok ? badgePlain("OK") : badgePlain("Collection Gap", "warn")],
          ["Domain Risk", `${domainPosture.risk?.risk_score ?? "n/a"}/100`],
          ["A Records", formatPlainList(domainModules.dns?.a)],
          ["MX Records", formatPlainList(domainModules.dns?.mx)],
          ["HTTPS", domainModules.http?.checks?.has_https ? badgePlain("Confirmed") : badgePlain("Missing", "warn")],
          ["DMARC", domainModules.dns?.dmarc?.length ? badgePlain("Present") : badgePlain("Missing", "warn")],
          ["RDAP Registrar", domainModules.rdap?.registrar || "n/a"],
          ["Error", domainPosture.error || "n/a"]
        ])}
      </section>

      <section class="section">
        <h2>${escapeHtml(text.complianceCoverage)}</h2>
        ${reportTable([
          ["VIES VAT", vatVies.vat_provided ? (vatVies.ok ? (vatVies.valid ? badgePlain("Valid") : badgePlain("Invalid", "fail")) : badgePlain("Unavailable", "warn")) : badgePlain("Not provided", "warn")],
          ["VIES Name", vatVies.name || "n/a"],
          ["VIES Request Date", vatVies.request_date || "n/a"],
          ["Registry Verification", registry.configured ? (registry.ok ? badgePlain("Matched") : badgePlain("No match", "warn")) : badgePlain("Business plan", "warn")],
          ["Registry Provider", registry.provider || "n/a"],
          ["Registry Matches", registry.match_count ?? "n/a"],
          ["Best Registry Match", registry.best_match?.name || "n/a"],
          ["Jurisdiction", registry.best_match?.jurisdiction_code || "n/a"],
          ["Registry Status", registry.best_match?.current_status || "n/a"],
          ["Sanctions Screening", sanctions.configured ? badgePlain("Configured") : badgePlain("Business plan", "warn")],
          ["Registry Note", registry.note || registry.error || "n/a"],
          ["Sanctions Note", sanctions.note || sanctions.error || "n/a"]
        ])}
      </section>
    `;
  }

  if (isWalletReport) {
    const profile = modules.wallet_profile || {};
    const account = modules.etherscan_account || {};
    const riskFeed = modules.risk_feed || {};
    return `
      <section class="section">
        <h2>${escapeHtml(text.walletProfile)}</h2>
        ${reportTable([
          ["Address", profile.address || report.entityValue || "n/a"],
          ["Format", profile.format || "n/a"],
          ["Chain", profile.chain || "ethereum"],
          ["Chain ID", profile.chain_id || "1"],
          ["Checksum", profile.checksum_verified ? badgePlain("Verified") : badgePlain("Not enforced", "warn")]
        ])}
      </section>

      <section class="section">
        <h2>${escapeHtml(text.onchainAccount)}</h2>
        ${reportTable([
          ["Provider", account.provider || "Etherscan V2"],
          ["Module Status", account.configured ? (account.ok ? badgePlain("OK") : badgePlain("Failed", "fail")) : badgePlain("API key needed", "warn")],
          ["Native Balance", `${account.native_balance_eth ?? "n/a"} ETH`],
          ["Transaction Sample", account.transaction_count_sample ?? "n/a"],
          ["First Seen", account.first_seen || "n/a"],
          ["Last Seen", account.last_seen || "n/a"],
          ["Error", account.error || "n/a"]
        ])}
      </section>

      <section class="section">
        <h2>${escapeHtml(text.riskCoverage)}</h2>
        ${reportTable([
          ["Risk Feed", riskFeed.configured ? badgePlain("Configured") : badgePlain("Business plan", "warn")],
          ["Provider", riskFeed.provider || "Wallet risk feed"],
          ["Coverage", riskFeed.configured ? "Sanctions / abuse screening" : "Available with licensed provider"],
          ["Note", riskFeed.note || riskFeed.error || "n/a"]
        ])}
      </section>
    `;
  }

  if (isPersonReport) {
    const profile = modules.identity_profile || {};
    const emailPosture = modules.email_posture || {};
    const domainPosture = modules.domain_posture || {};
    const publicLinks = modules.public_links || {};
    return `
      <section class="section">
        <h2>${escapeHtml(text.identityReview)}</h2>
        ${reportTable([
          ["Name", profile.name || report.entityValue || "n/a"],
          ["Email", profile.email || "Not provided"],
          ["Domain", profile.domain || "Not provided"],
          ["Private Data", profile.private_data_collected ? badgePlain("Collected", "fail") : badgePlain("No")]
        ])}
      </section>

      <section class="section">
        <h2>${escapeHtml(text.emailDomainContext)}</h2>
        ${reportTable([
          ["Email Posture", emailPosture.ok ? badgePlain("Collected") : badgePlain("Gap", "warn")],
          ["Email Risk", `${emailPosture.risk?.risk_score ?? "n/a"}/100`],
          ["Domain Posture", domainPosture.ok ? badgePlain("Collected") : badgePlain("Gap", "warn")],
          ["Domain Risk", `${domainPosture.risk?.risk_score ?? "n/a"}/100`],
          ["Public Links", publicLinks.links_provided ?? 0],
          ["Link List", formatPlainList(publicLinks.links)]
        ])}
      </section>
    `;
  }

  const dns = modules.dns || {};
  const http = modules.http || {};
  const rdap = modules.rdap || {};
  return `
      <section class="section">
        <h2>${escapeHtml(text.dnsIntelligence)}</h2>
        ${reportTable([
          ["A Records", formatPlainList(dns.a)],
          ["MX Records", formatPlainList(dns.mx)],
          ["NS Records", formatPlainList(dns.ns)],
          ["SPF", dns.spf?.length ? badgePlain("Present") : badgePlain("Missing", "warn")],
          ["DMARC", dns.dmarc?.length ? badgePlain("Present") : badgePlain("Missing", "warn")],
          ["Module Status", dns.ok ? badgePlain("OK") : badgePlain("Failed", "fail")]
        ])}
      </section>

      <section class="section">
        <h2>${escapeHtml(text.httpsSecurity)}</h2>
        ${reportTable([
          ["Status Code", http.https?.status_code ?? http.http?.status_code ?? "n/a"],
          ["Final URL", http.https?.final_url || http.http?.final_url || "n/a"],
          ["HTTPS", http.checks?.has_https ? badgePlain("Confirmed") : badgePlain("Missing", "fail")],
          ["HSTS", http.checks?.has_hsts ? badgePlain("Present") : badgePlain("Missing", "warn")],
          ["CSP", http.checks?.has_content_security_policy ? badgePlain("Present") : badgePlain("Missing", "warn")],
          ["X-Frame-Options", http.checks?.has_x_frame_options ? badgePlain("Present") : badgePlain("Missing", "warn")],
          ["X-Content-Type-Options", http.checks?.has_x_content_type_options ? badgePlain("Present") : badgePlain("Missing", "warn")],
          ["Server", http.security_headers?.server || "n/a"]
        ])}
      </section>

      <section class="section">
        <h2>${escapeHtml(text.rdapRegistry)}</h2>
        ${reportTable([
          ["Module Status", rdap.ok ? badgePlain("OK") : badgePlain("Collection Gap", "warn")],
          ["Registrar", rdap.registrar || "n/a"],
          ["Created", rdap.creation_date || "n/a"],
          ["Expires", rdap.expiration_date || "n/a"],
          ["Age Days", rdap.domain_age_days ?? "n/a"],
          ["Status", formatPlainList(rdap.status)],
          ["Nameservers", formatPlainList(rdap.nameservers)],
          ["Error", rdap.error || "n/a"]
        ])}
      </section>
    `;
}

function buildRecommendations(report, modules, findings) {
  const recommendations = [];
  const isEmailReport = (report.entityType || "").toLowerCase() === "email";
  const isCompanyReport = (report.entityType || "").toLowerCase() === "company";
  const isWalletReport = (report.entityType || "").toLowerCase() === "wallet";
  const isPersonReport = (report.entityType || "").toLowerCase() === "person";
  if (isEmailReport) {
    const identity = modules.identity || {};
    const mailDns = modules.mail_dns || {};
    const domainHttp = modules.domain_http || {};
    const breach = modules.breach_exposure || {};
    if (!breach.configured) recommendations.push("Configure HIBP_API_KEY server-side to enable breach exposure checks.");
    if (breach.ok && breach.breach_count > 0) recommendations.push("Prioritize credential rotation and MFA review for accounts tied to this email address.");
    if (identity.is_consumer_email_domain) recommendations.push("Treat consumer mailbox providers as weaker evidence for corporate identity unless independently verified.");
    if (identity.is_disposable_domain) recommendations.push("Reject or manually review disposable email addresses in onboarding and vendor workflows.");
    if (identity.is_role_account) recommendations.push("Confirm ownership and business context before trusting role-based mailboxes.");
    if (!mailDns.spf?.length) recommendations.push("Publish an SPF record for the email domain.");
    if (!mailDns.dmarc?.length) recommendations.push("Publish and monitor a DMARC record for the email domain.");
    if (!domainHttp.security_headers?.hsts) recommendations.push("Enable HSTS on the email domain's web surface where applicable.");
    if (findings.length) recommendations.push("Track findings in the case file and preserve source snapshots for auditability.");
    if (!recommendations.length) recommendations.push("Maintain periodic monitoring for breach exposure, MX, SPF, DMARC, and domain posture changes.");
    return recommendations.slice(0, 8);
  }

  if (isCompanyReport) {
    const profile = modules.company_profile || {};
    const domainPosture = modules.domain_posture || {};
    const vatVies = modules.vat_vies || {};
    const registry = modules.registry_screening || {};
    const sanctions = modules.sanctions_screening || {};
    const domainModules = domainPosture.modules || {};
    if (!profile.domain_provided) recommendations.push("Add the official company domain to improve web, DNS, and RDAP due-diligence coverage.");
    if (!profile.vat_provided) recommendations.push("Add an EU VAT number to enable VIES validation for European company due diligence.");
    if (vatVies.vat_provided && vatVies.ok && vatVies.valid === false) recommendations.push("Treat invalid VIES VAT status as an escalation item before vendor onboarding.");
    if (vatVies.vat_provided && !vatVies.ok) recommendations.push("Repeat VIES VAT validation because the EU service may be temporarily unavailable.");
    if (!profile.has_legal_suffix) recommendations.push("Manually verify the legal entity name and jurisdiction because no legal suffix was detected.");
    if (!registry.configured) recommendations.push("Connect a corporate registry provider before relying on this report for legal entity verification.");
    if (!sanctions.configured) recommendations.push("Connect a licensed sanctions/PEP provider before using this report for compliance clearance.");
    if (domainPosture.ok && !domainModules.http?.checks?.has_hsts) recommendations.push("Review web security posture and enable HSTS on the official domain where applicable.");
    if (domainPosture.ok && !domainModules.dns?.dmarc?.length) recommendations.push("Publish or strengthen DMARC for the official company domain.");
    if (report.riskScore >= 50) recommendations.push("Escalate this company for analyst review before vendor onboarding or trust approval.");
    if (findings.length) recommendations.push("Preserve findings and source snapshots in the case file for auditability.");
    if (!recommendations.length) recommendations.push("Maintain periodic monitoring for company domain, registry, and compliance status changes.");
    return recommendations.slice(0, 8);
  }

  if (isWalletReport) {
    const account = modules.etherscan_account || {};
    const riskFeed = modules.risk_feed || {};
    if (!account.configured) recommendations.push("Add ETHERSCAN_API_KEY server-side to enable balance and transaction checks.");
    if (account.configured && !account.ok) recommendations.push("Repeat Etherscan lookup because account activity collection failed.");
    if (!riskFeed.configured) recommendations.push("Connect a licensed wallet risk-feed provider before making sanctions, scam, mixer, or illicit-finance conclusions.");
    if (report.riskScore >= 50) recommendations.push("Escalate this wallet for analyst review before accepting crypto payments or assigning trust.");
    if (findings.length) recommendations.push("Preserve wallet findings and source snapshots in the case file for auditability.");
    if (!recommendations.length) recommendations.push("Maintain periodic monitoring for wallet activity, counterparty exposure, and risk-feed changes.");
    return recommendations.slice(0, 8);
  }

  if (isPersonReport) {
    const profile = modules.identity_profile || {};
    if (!profile.email) recommendations.push("Add an email address to enable Identity Shield checks.");
    if (!profile.domain) recommendations.push("Add an affiliated domain to enable domain posture checks.");
    if (!modules.public_links?.links_provided) recommendations.push("Add user-provided public links when relevant to improve review context.");
    recommendations.push("Do not treat this report as identity ownership verification without independent user-provided evidence.");
    if (findings.length) recommendations.push("Preserve identity-review findings and user-provided source context for auditability.");
    return recommendations.slice(0, 8);
  }

  const dns = modules.dns || {};
  const http = modules.http || {};
  const rdap = modules.rdap || {};
  if (!http.checks?.has_hsts) recommendations.push("Enable HSTS to enforce HTTPS transport and reduce downgrade risk.");
  if (!http.checks?.has_content_security_policy) recommendations.push("Deploy a Content-Security-Policy tailored to the application to reduce script injection exposure.");
  if (!http.checks?.has_x_frame_options) recommendations.push("Add X-Frame-Options or CSP frame-ancestors to reduce clickjacking exposure.");
  if (!http.checks?.has_x_content_type_options) recommendations.push("Add X-Content-Type-Options: nosniff to prevent MIME type confusion.");
  if (!dns.spf?.length) recommendations.push("Publish an SPF record for mail sender authorization.");
  if (!dns.dmarc?.length) recommendations.push("Publish a DMARC record and monitor reports before enforcement.");
  if (!rdap.ok) recommendations.push("Verify registration data through registrar WHOIS or national registry sources to close the collection gap.");
  if (report.riskScore >= 60) recommendations.push("Escalate this domain for analyst review before vendor, brand, or operational trust is assigned.");
  if (findings.length) recommendations.push("Track deterministic findings in the case file and preserve source snapshots for auditability.");
  if (!recommendations.length) {
    recommendations.push("Maintain periodic monitoring for DNS, certificate, RDAP, and HTTP security posture changes.");
  }
  return recommendations.slice(0, 8);
}

function formatPlainList(values) {
  if (!Array.isArray(values) || values.length === 0) return "n/a";
  return values.slice(0, 10).map((value) => escapeHtml(value)).join("<br>");
}

function badgePlain(label, tone = "") {
  return `<span class="badge ${tone}">${escapeHtml(label)}</span>`;
}

function setDebug({ endpoint, status, raw, error }) {
  if (!DEBUG_ENABLED) return;
  const endpointEl = byId("debugEndpoint");
  const statusEl = byId("debugStatus");
  const errorEl = byId("debugError");
  const rawEl = byId("debugRaw");

  if (endpointEl) endpointEl.textContent = endpoint || "-";
  if (statusEl) statusEl.textContent = status || "-";
  if (errorEl) errorEl.textContent = error || "-";
  if (rawEl) rawEl.textContent = JSON.stringify(raw ?? {}, null, 2);
}

async function loadCaseHistory() {
  const container = byId("caseHistory");
  if (!container) return;
  container.innerHTML = `<div class="empty-state">Loading saved investigations...</div>`;

  try {
    const response = await fetch(`${CASES_ENDPOINT}?limit=12`, {
      method: "GET",
      cache: "no-store",
      headers: await authHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.detail || data?.error || `HTTP ${response.status}`);
    renderCaseHistory(data.cases || [], data.supabase || "unknown");
  } catch (error) {
    container.innerHTML = `<div class="empty-state">Case history unavailable: ${escapeHtml(error.message)}</div>`;
  }
}

function renderCaseHistory(items, supabaseStatus) {
  const container = byId("caseHistory");
  if (!container) return;
  if (supabaseStatus === "disabled") {
    container.innerHTML = `<div class="empty-state">Supabase is disabled. Set DISABLE_SUPABASE=false and configure Supabase keys to persist cases.</div>`;
    return;
  }
  if (!items.length) {
    container.innerHTML = `<div class="empty-state">No saved investigations yet. Run an analysis to create the first case.</div>`;
    return;
  }
  container.innerHTML = items
    .map((item) => {
      const createdAt = item.created_at ? new Date(item.created_at).toLocaleString() : "n/a";
      return `
        <button class="case-item" type="button" data-case-id="${escapeHtml(item.id || "")}" data-entity-value="${escapeHtml(item.entity_value || "")}">
          <div>
            <strong>${escapeHtml(item.entity_value || "unknown")}</strong>
            <time>${escapeHtml(createdAt)}</time>
          </div>
          <span class="case-type">${escapeHtml(item.entity_type || "entity")}</span>
          <span class="case-score">${Number(item.risk_score || 0)}/100</span>
        </button>
      `;
    })
    .join("");

  container.querySelectorAll(".case-item").forEach((button) => {
    button.addEventListener("click", () => loadSavedCaseReport(button.dataset.caseId || ""));
  });
}

async function loadSavedCaseReport(caseId) {
  if (!caseId) return;
  setDebug({
    endpoint: `${CASES_ENDPOINT}/${caseId}/reports`,
    status: "pending",
    error: "-",
    raw: { state: "loading_saved_report", case_id: caseId }
  });

  try {
    const response = await fetch(`${CASES_ENDPOINT}/${encodeURIComponent(caseId)}/reports?limit=1`, {
      method: "GET",
      cache: "no-store",
      headers: await authHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.detail || data?.error || `HTTP ${response.status}`);

    const report = (data.reports || [])[0];
    if (!report) throw new Error("No report found for this case");

    const content = report.content_json || {};
    const osintData = content.osint || {};
    const entityValue = content.entity_value || osintData.email || osintData.domain || "saved entity";
    const payload = {
      entity_value: entityValue,
      entity_type: content.entity_type || osintData.entity_type || "domain",
      case_id: report.case_id,
      report_id: report.id,
      risk_score: content.risk_score ?? osintData.risk?.risk_score ?? 0,
      summary: report.ai_summary || content.summary || "Saved report loaded from Supabase.",
      osint_data: osintData
    };

    renderSimpleReport(entityValue, payload);
    setDebug({
      endpoint: `${CASES_ENDPOINT}/${caseId}/reports`,
      status: `${response.status} ${response.statusText || ""}`.trim(),
      error: "-",
      raw: { state: "saved_report_loaded", report: payload }
    });
    showToast("Saved report loaded");
  } catch (error) {
    setDebug({
      endpoint: `${CASES_ENDPOINT}/${caseId}/reports`,
      status: "request failed",
      error: error.message,
      raw: { error: error.message, case_id: caseId }
    });
    showToast(`Could not load saved report: ${error.message}`, "error");
  }
}
