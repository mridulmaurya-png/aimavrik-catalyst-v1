
const { createClient } = require('@supabase/supabase-js');

async function findBiz() {
  const supabaseUrl = "https://cvmmopbqlhkqsugrlldg.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bW1vcGJxbGhrcXN1Z3JsbGRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI4NTc3NSwiZXhwIjoyMDkwODYxNzc1fQ.yneG2fkTJogLPRjXV50OLP77xDBss89UR1Q0f1dUS0Y";
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from('businesses').select('id, business_name').limit(5);
  
  if (error) {
    console.error('Fetch error:', error.message);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

findBiz();
