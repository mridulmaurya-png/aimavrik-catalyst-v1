
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://cvmmopbqlhkqsugrlldg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bW1vcGJxbGhrcXN1Z3JsbGRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI4NTc3NSwiZXhwIjoyMDkwODYxNzc1fQ.yneG2fkTJogLPRjXV50OLP77xDBss89UR1Q0f1dUS0Y";

async function createOnboardingTable() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const sql = `
    CREATE TABLE IF NOT EXISTS onboarding_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID NOT NULL REFERENCES businesses(id),
      user_id UUID NOT NULL,
      business_type TEXT,
      use_case TEXT,
      lead_sources TEXT[],
      monthly_volume TEXT,
      conversion_challenge TEXT,
      channels TEXT[],
      ai_voice_needed BOOLEAN DEFAULT false,
      ai_chatbot_needed BOOLEAN DEFAULT false,
      notes TEXT,
      submitted_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_onboarding_biz ON onboarding_submissions(business_id);
    ALTER TABLE businesses ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'not_started';
  `;

  console.log("Attempting to create onboarding_submissions table...");
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.error("Migration Error:", error.message);
  } else {
    console.log("Success: onboarding_submissions table created and businesses schema updated.");
  }
}

createOnboardingTable();
