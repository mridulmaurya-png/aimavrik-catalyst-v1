
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://cvmmopbqlhkqsugrlldg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bW1vcGJxbGhrcXN1Z3JsbGRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI4NTc3NSwiZXhwIjoyMDkwODYxNzc1fQ.yneG2fkTJogLPRjXV50OLP77xDBss89UR1Q0f1dUS0Y";

async function getColumns() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from('businesses').select('*').limit(1);
  if (error) console.error(error);
  else console.log(Object.keys(data[0] || {}));
}

getColumns();
