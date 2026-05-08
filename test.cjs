const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
  }
});

async function run() {
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/messages`, {
    method: 'POST',
    headers: {
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      sender_id: null,
      receiver_id: null,
      title: 'test title',
      content: 'test content'
    })
  });
  const data = await res.json();
  console.log(data);
}
run();
