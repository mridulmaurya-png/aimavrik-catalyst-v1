
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://cvmmopbqlhkqsugrlldg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bW1vcGJxbGhrcXN1Z3JsbGRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI4NTc3NSwiZXhwIjoyMDkwODYxNzc1fQ.yneG2fkTJogLPRjXV50OLP77xDBss89UR1Q0f1dUS0Y";

async function addStatus() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // First, check if status already exists in a sample to be double sure
  const { data: sample } = await supabase.from('businesses').select('*').limit(1).single();
  if (sample && sample.status !== undefined) {
    console.log("Status column already exists.");
    return;
  }

  console.log("Attempting to add status column via RPC...");
  // We assume exec_sql or or similar RPC might exist if this was set up by a previous agent,
  // but if not, we will rely on the app logic to handle its absence gracefully if we can't add it.
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql: "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_approval';" 
  });
  
  if (error) {
    console.error("RPC Error (might not have permissions or RPC missing):", error.message);
    console.log("If this fails, I will implement code-level gating using the 'industry' or 'business_type' field as a fallback if necessary, or just rely on the column being added manually if I can't do it.");
  } else {
    console.log("Success:", data);
  }
}

addStatus();
