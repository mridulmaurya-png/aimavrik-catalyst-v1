
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://cvmmopbqlhkqsugrlldg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bW1vcGJxbGhrcXN1Z3JsbGRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI4NTc3NSwiZXhwIjoyMDkwODYxNzc1fQ.yneG2fkTJogLPRjXV50OLP77xDBss89UR1Q0f1dUS0Y";

async function checkPlaybooks() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const busId = "d1111111-1111-1111-1111-111111111111";
  
  const { data: playbooks, error } = await supabase
    .from("playbooks")
    .select("id, playbook_type, is_active")
    .eq("business_id", busId);
    
  if (error) console.error(error);
  else console.log(JSON.stringify(playbooks, null, 2));
}

checkPlaybooks();
