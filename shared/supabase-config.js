// ═══════════════════════════════════════════════════════════════
// Supabase Configuration — Shared between Admin & Public sites
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://pmnqgrrevcmzqebowjtq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtbnFncnJldmNtenFlYm93anRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0OTg3MDUsImV4cCI6MjEwMjA3NDcwNX0.fngIxxH80ZgaE7mNluchHhMA_nZlnbfCTulcFL8o494';

// REST API base (used by public-site for read-only fetches)
const SUPABASE_REST_URL = SUPABASE_URL + '/rest/v1/';

// Initialize Supabase JS client (requires supabase-js loaded via CDN)
let supabase = null;

function getSupabaseClient() {
  if (supabase) return supabase;
  if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabase;
  }
  return null;
}

export { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_REST_URL, getSupabaseClient };
