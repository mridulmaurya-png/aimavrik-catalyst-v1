
async function test() {
  const payload = {
    business_id: "d1111111-1111-1111-1111-111111111111",
    event_type: "lead_submitted",
    email: "audit_test_success@aimavrik.com",
    full_name: "Audit Success User",
    source: "webhook"
  };

  try {
    const res = await fetch('http://localhost:3000/api/ingest/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
