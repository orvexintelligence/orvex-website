// Public deployment configuration. These values are safe for the browser.
// Never add server-side secret keys here.
(() => {
  const localHosts = new Set(["127.0.0.1", "localhost"]);
  const isLocal = localHosts.has(window.location.hostname);
  const fallbackApi = isLocal
    ? "http://127.0.0.1:8000"
    : "https://orvex-osint-fusion-api.onrender.com";

  let savedApi = "";
  try {
    savedApi = localStorage.getItem("ORVEX_API_BASE_URL") || "";
  } catch {
    savedApi = "";
  }

  if (!isLocal && /^(https?:\/\/)?(127\.0\.0\.1|localhost)(:\d+)?/i.test(savedApi)) {
    savedApi = "";
  }

  window.ORVEX_API_BASE_URL = window.ORVEX_API_BASE_URL || savedApi || fallbackApi;
  window.ORVEX_SUPABASE_URL = window.ORVEX_SUPABASE_URL || "";
  window.ORVEX_SUPABASE_ANON_KEY = window.ORVEX_SUPABASE_ANON_KEY || "";
})();
