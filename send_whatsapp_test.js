import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env not found');
  process.exit(1);
}

const env = fs.readFileSync(envPath, 'utf8')
  .split(/\r?\n/)
  .map(l => l.trim())
  .filter(l => l && !l.startsWith('#'))
  .reduce((acc, line) => {
    const idx = line.indexOf('=');
    if (idx > -1) acc[line.slice(0, idx)] = line.slice(idx + 1);
    return acc;
  }, {});

const TOKEN = env.WHATSAPP_TOKEN;
const PHONE_ID = env.WHATSAPP_PHONE_NUMBER_ID;
if (!TOKEN || !PHONE_ID) {
  console.error('Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID in .env');
  process.exit(1);
}

// Helper function: Convert Pakistani phone number format for WhatsApp
// Converts: 03176227245 → +923176227245
function formatPhoneForWhatsApp(phone) {
  if (!phone) return phone;
  
  // Remove any existing +, spaces, or dashes
  let cleaned = phone.replace(/[\s\-+]/g, '');
  
  // If it already starts with 92 (country code), just add +
  if (cleaned.startsWith('92')) {
    return '+' + cleaned;
  }
  
  // If it starts with 0, replace with 92 (Pakistan country code)
  if (cleaned.startsWith('0')) {
    return '+92' + cleaned.slice(1);
  }
  
  // If no prefix, assume it's a Pakistani number, add +92
  return '+92' + cleaned;
}

// Test phone number - you can change this to test with different formats
// Usage examples:
// node send_whatsapp_test.js 03198227245
// node send_whatsapp_test.js 03198227245 03176227245
// node send_whatsapp_test.js --file numbers.txt

const args = process.argv.slice(2);
const LOG_FILE = path.join(process.cwd(), 'whatsapp_send_log.json');

function readNumbersFromFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'));
  } catch (e) {
    console.error('Failed to read numbers file', e.message || e);
    return [];
  }
}

function saveLog(entry) {
  let existing = [];
  try {
    if (fs.existsSync(LOG_FILE)) existing = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')) || [];
  } catch (e) {}
  existing.push(entry);
  try { fs.writeFileSync(LOG_FILE, JSON.stringify(existing, null, 2)); } catch (e) { console.warn('Failed to write log', e); }
}

let numbers = [];
if (args.length === 0) {
  console.log('No numbers provided. Usage: node send_whatsapp_test.js 03198227245');
  process.exit(0);
}

if (args[0] === '--file' && args[1]) {
  numbers = readNumbersFromFile(path.resolve(process.cwd(), args[1]));
} else {
  // Treat all args as numbers
  numbers = args.slice();
}

if (!numbers.length) {
  console.error('No valid numbers to send to.');
  process.exit(1);
}

const url = `https://graph.facebook.com/v17.0/${PHONE_ID}/messages`;

async function sendToNumber(rawPhone) {
  const formatted = formatPhoneForWhatsApp(rawPhone);
  const body = {
    messaging_product: 'whatsapp',
    to: formatted,
    type: 'text',
    text: {
      body: `*Assalam-o-Alaikum,🎊*\nThis is a test message to ${rawPhone}.\n_This is an automated test from MSL IT Department._\n\nDeveloped & Designed by: Abdul Manan`
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    const entry = { phone: rawPhone, formatted, status: res.status, response: text, time: new Date().toISOString() };
    console.log(JSON.stringify({ phone: rawPhone, status: res.status }));
    saveLog(entry);
    return entry;
  } catch (err) {
    const entry = { phone: rawPhone, error: err.message || String(err), time: new Date().toISOString() };
    console.error('request error for', rawPhone, err.message || err);
    saveLog(entry);
    return entry;
  }
}

(async () => {
  console.log('Sending to', numbers.length, 'number(s)');
  for (let i = 0; i < numbers.length; i++) {
    const n = numbers[i];
    await sendToNumber(n);
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 600));
  }
  console.log('Done. Responses saved to', LOG_FILE);
})();
