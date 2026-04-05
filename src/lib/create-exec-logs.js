
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://cvmmopbqlhkqsugrlldg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bW1vcGJxbGhrcXN1Z3JsbGRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI4NTc3NSwiZXhwIjoyMDkwODYxNzc1fQ.yneG2fkTJogLPRjXV50OLP77xDBss89UR1Q0f1dUS0Y";

async function createExecLogs() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const sql = `
    CREATE TABLE IF NOT EXISTS execution_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID NOT NULL REFERENCES businesses(id),
      action_id UUID NOT NULL REFERENCES actions(id),
      contact_id UUID REFERENCES contacts(id),
      execution_mode TEXT,
      execution_path TEXT,
      status TEXT,
      response_code INTEGER,
      error_message TEXT,
      retry_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_exec_logs_action ON execution_logs(action_id);
    CREATE INDEX IF NOT EXISTS idx_exec_logs_biz ON execution_logs(business_id);
  `;

  console.log("Attempting to create execution_logs table...");
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.error("Migration Error (RPC likely missing):", error.message);
    console.log("Falling back to audit_logs if this table cannot be created.");
  } else {
    console.log("Success: execution_logs table created.");
  }
}

createExecLogs();
