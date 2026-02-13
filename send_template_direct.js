import fs from 'fs';
import path from 'path';

// Usage: node send_template_direct.js 923417509300 member_register en "Param1" "Param2"

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

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node send_template_direct.js <phone_without_plus_or_0> <template_name> [lang] [param1] [param2] ...');
  process.exit(1);
}

const [toRaw, templateName] = args;
const lang = args[2] || 'en';
const params = args.slice(3) || [];

// Extract optional --url= flag from params
let urlParam = null;
for (let i = params.length - 1; i >= 0; i--) {
  const p = params[i];
  if (typeof p === 'string' && p.startsWith('--url=')) {
    urlParam = p.slice(6);
    params.splice(i, 1);
    break;
  }
}

const env = readEnv(path.resolve(process.cwd(), '.env'));
const TOKEN = env.WHATSAPP_TOKEN;
const PHONE_ID = env.WHATSAPP_PHONE_NUMBER_ID;
const GRAPH_API_VERSION = env.GRAPH_API_VERSION || 'v17.0';

if (!TOKEN || !PHONE_ID) {
  console.error('Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID in .env');
  process.exit(1);
}

function formatPhoneForWhatsApp(phone) {
  if (!phone) return phone;
  let cleaned = phone.replace(/[\s\-+]/g, '');
  if (cleaned.startsWith('92')) return '+' + cleaned;
  if (cleaned.startsWith('0')) return '+92' + cleaned.slice(1);
  return '+' + cleaned; // assume already country+number without 0
}

const to = formatPhoneForWhatsApp(toRaw);

const components = [];
if (params.length) {
  // Support named params using the format name=value
  const paramObjects = params.map(p => {
    const s = String(p);
    const eq = s.indexOf('=');
    if (eq > -1) {
      return { type: 'text', text: s.slice(eq + 1), name: s.slice(0, eq) };
    }
    return { type: 'text', text: s };
  });
  components.push({ type: 'body', parameters: paramObjects });
}
if (urlParam) {
  // Add a url button component at index 0
  components.push({
    type: 'button',
    sub_type: 'url',
    index: 0,
    parameters: [{ type: 'text', text: urlParam }]
  });
}

const body = {
  messaging_product: 'whatsapp',
  to,
  type: 'template',
  template: {
    name: templateName,
    language: { code: lang },
    components
  }
};

const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_ID}/messages`;

(async () => {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    console.log('status', res.status);
    console.log(text);
  } catch (err) {
    console.error('request error', err);
    process.exit(1);
  }
})();
