import fs from 'fs';
import path from 'path';

function readEnv(envPath) {
  if (!fs.existsSync(envPath)) throw new Error('.env not found');
  const raw = fs.readFileSync(envPath, 'utf8');
  return raw
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .reduce((acc, line) => {
      const idx = line.indexOf('=');
      if (idx > -1) acc[line.slice(0, idx)] = line.slice(idx + 1);
      return acc;
    }, {});
}

const env = readEnv(path.resolve(process.cwd(), '.env'));
const TOKEN = env.WHATSAPP_TOKEN;
const WBA_ID = env.WHATSAPP_BUSINESS_ID;
const GRAPH_API_VERSION = env.GRAPH_API_VERSION || 'v17.0';

if (!TOKEN || !WBA_ID) {
  console.error('Missing WHATSAPP_TOKEN or WHATSAPP_BUSINESS_ID in .env');
  process.exit(1);
}

const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${WBA_ID}/message_templates`;

(async () => {
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('request error', err.message || err);
    process.exit(1);
  }
})();
