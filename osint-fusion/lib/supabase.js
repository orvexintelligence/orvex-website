import { createClient } from "@supabase/supabase-js";

const runtimeWindow = typeof window !== "undefined" ? window : {};

const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL ||
  import.meta.env?.NEXT_PUBLIC_SUPABASE_URL ||
  runtimeWindow.ORVEX_SUPABASE_URL;

const supabaseKey =
  import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  import.meta.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  runtimeWindow.ORVEX_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase configuration for Orvex CaseDesk.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: "public"
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      "x-application-name": "orvex-casedesk"
    }
  }
});

export async function createCase({ entityType, entityValue, riskScore = 0, status = "open" }) {
  const { data, error } = await supabase
    .from("cases")
    .insert({
      entity_type: entityType,
      entity_value: entityValue,
      risk_score: riskScore,
      status
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listCases() {
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createIntelligenceReport({ caseId, contentJson, aiSummary, sourcesCited = [] }) {
  const { data, error } = await supabase
    .from("intelligence_reports")
    .insert({
      case_id: caseId,
      content_json: contentJson,
      ai_summary: aiSummary,
      sources_cited: sourcesCited
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function logAuditAction({ actionType, targetEntity, ipAddress = null }) {
  const { data, error } = await supabase
    .from("audit_logs")
    .insert({
      action_type: actionType,
      target_entity: targetEntity,
      ip_address: ipAddress
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
