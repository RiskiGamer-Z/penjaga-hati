const fs = require('fs');
const { request } = require('https');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1]] = match[2].trim().replace(/^"|"$/g, '');
});

const url = envVars['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/payments?select=*&limit=1';
const key = envVars['SUPABASE_SERVICE_ROLE_KEY'];

const req = request(url, {
  method: 'GET',
  headers: {
    'apikey': key,
    'Authorization': 'Bearer ' + key
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Payments response:", data);
  });
});
req.on('error', console.error);
req.end();
