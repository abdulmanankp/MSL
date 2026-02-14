import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import TemplateManager from './server/templateManager.js';
import { logInfo, logError, logWarn } from './server/logger.js';
import { sendRegistrationEmail, sendApprovalEmail } from './server/emailService.js';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;



// Initialize Template Manager
const storageDir = path.join(__dirname, 'storage');
const templateManager = new TemplateManager(storageDir);

// Set Content Security Policy (CSP) headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self' blob:;",
      "script-src 'self' blob:;",
      "style-src 'self' 'unsafe-inline';",
      "img-src 'self' data: blob:;",
      "font-src 'self' data:;"
    ].join(' ')
  );
  next();
});


// CORS: Only enable in development (localhost)
if (process.env.NODE_ENV !== 'production') {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ];
  app.use(cors({
    origin: function(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));
  // Custom CORS headers for dev
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (!origin || allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
      res.header('Access-Control-Allow-Credentials', 'true');
    } else {
      res.header('Access-Control-Allow-Origin', allowedOrigins[0]);
    }
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Expose-Headers', 'Content-Disposition');
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure storage/template directory exists for templates
const templateDir = path.join(__dirname, 'storage', 'template');
if (!fs.existsSync(templateDir)) {
  fs.mkdirSync(templateDir, { recursive: true });
}
// Ensure template.json exists
const templateJsonPath = path.join(templateDir, 'template.json');
if (!fs.existsSync(templateJsonPath)) {
  fs.writeFileSync(templateJsonPath, JSON.stringify({ basePdf: '', schemas: [[]] }, null, 2));
}


// Serve all static files from public directory (including /uploads, /fonts, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON bodies with increased limit for large templates with embedded PDFs
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ...existing code...
// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Root endpoint to prevent 404 on /
app.get('/', (req, res) => {
  // Serve frontend index.html for root
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Multer for card PDF uploads (admin-generated cards)
const cardStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const membershipId = req.body.membership_id || `card-${Date.now()}`;
    cb(null, `${membershipId}-card${path.extname(file.originalname) || '.pdf'}`);
  }
});

const cardUpload = multer({
  storage: cardStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) cb(null, true);
    else cb(new Error('Only PDF files are allowed for cards'), false);
  }
});

// In-memory OTP store (phone -> { code, expires })
const otpStore = new Map();

// Helper to call WhatsApp Cloud API (Facebook Graph API)
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const WHATSAPP_BUSINESS_ID = process.env.WHATSAPP_BUSINESS_ID || '2193069461137001';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || 'v17.0';
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'msl_pakistan_whatsapp_webhook_secret_verify_token';

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

async function sendWhatsAppText(phone, text) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn('WhatsApp credentials not configured');
    return { error: 'WhatsApp not configured' };
  }

  const formattedPhone = formatPhoneForWhatsApp(phone);
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to: formattedPhone,
    type: 'text',
    text: { body: text }
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WHATSAPP_TOKEN}` },
    body: JSON.stringify(body)
  });
  return resp.json();
}

async function sendWhatsAppMedia(phone, mediaUrl, caption) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn('WhatsApp credentials not configured');
    return { error: 'WhatsApp not configured' };
  }

  const formattedPhone = formatPhoneForWhatsApp(phone);
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to: formattedPhone,
    type: 'image',
    image: {
      link: mediaUrl,
      caption: caption || ''
    }
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WHATSAPP_TOKEN}` },
    body: JSON.stringify(body)
  });
  return resp.json();
}

// ==================== WhatsApp Webhook Endpoints ====================
// GET /webhook - For webhook verification from Facebook
// Facebook will send a challenge token that we must echo back
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verify the token matches our WEBHOOK_VERIFY_TOKEN
  if (mode && token) {
    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
      console.log('✅ Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Forbidden: Invalid verification token');
    }
  } else {
    res.status(400).send('Bad Request: Missing parameters');
  }
});

// POST /webhook - For receiving incoming messages and webhooks from WhatsApp
app.post('/webhook', express.json(), (req, res) => {
  const body = req.body;

  // Check if this is a message webhook event
  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
      const from = body.entry[0].changes[0].value.messages[0].from;
      const msgBody = body.entry[0].changes[0].value.messages[0].text.body;

      console.log(`📨 Incoming message from ${from}: "${msgBody}"`);

      // TODO: Add your business logic here to handle incoming messages
      // For example:
      // - Store message in database
      // - Route to appropriate handler based on keywords
      // - Send automated responses

      // Store message details in memory or database for audit trail
      console.log(`Message received from ${from}: ${msgBody}`);
    } else if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.statuses
    ) {
      // Handle message status updates (delivered, read, failed, etc.)
      const messageStatus = body.entry[0].changes[0].value.statuses[0];
      console.log(`📊 Message status update: ${messageStatus.id} - ${messageStatus.status}`);
      
      // Log status for delivery/read receipts
      if (messageStatus.status === 'delivered') {
        console.log(`✅ Message delivered: ${messageStatus.id}`);
      } else if (messageStatus.status === 'read') {
        console.log(`👁️  Message read: ${messageStatus.id}`);
      } else if (messageStatus.status === 'failed') {
        console.log(`❌ Message failed: ${messageStatus.id}`);
      }
    }

    // Always respond with 200 OK to acknowledge the webhook
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.status(404).send('Not Found');
  }
});

// Endpoint: upload generated card PDF
app.post('/upload-card', cardUpload.single('card'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No card uploaded' });
    const baseUrl = process.env.API_URL || `http://localhost:${PORT}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    return res.json({ url: fileUrl });
  } catch (err) {
    console.error('upload-card error', err);
    return res.status(500).json({ error: 'Failed to upload card' });
  }
});

// Endpoint: send OTP via WhatsApp (text) with template info
app.post('/whatsapp/send-otp', express.json(), async (req, res) => {
  const { phone, language = 'en_US', first_name, membership_id } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'phone is required' });
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(phone, { code, expires });
  const templateId = 'otp_verification';
  const langCode = 'en_US';
  // Use all 4 required params for the template
  // Ensure all parameters fit template length limits (usually 15 chars)
  const params = [
    code, // OTP code
    'MSL Card', // Card label (shortened)
    '5 min', // Expiry time
    '03176227245' // Support/contact number
  ];
  // For a button of type 'copy_code', pass the OTP code as the button parameter
  const buttonParam = code;
  try {
    const result = await sendWhatsAppTemplate(phone, templateId, langCode, params, buttonParam, 'copy_code');
    if (result && result.error) {
      logError(`❌ OTP send failed [${templateId}]:`, result);
    } else {
      logInfo(`✅ OTP sent [${templateId}] to ${phone}:`, result);
    }
    res.json({ success: true, template: templateId, result });
  } catch (err) {
    logError(`❌ OTP send exception [${templateId}]:`, err);
    res.status(500).json({ error: 'Failed to send OTP', template: templateId });
  }
});

// Endpoint: verify OTP
app.post('/whatsapp/verify-otp', express.json(), (req, res) => {
  const { phone, code } = req.body || {};
  if (!phone || !code) return res.status(400).json({ error: 'phone and code required' });
  const entry = otpStore.get(phone);
  if (!entry) return res.status(400).json({ error: 'No OTP requested' });
  if (Date.now() > entry.expires) {
    otpStore.delete(phone);
    return res.status(400).json({ error: 'OTP expired' });
  }
  if (entry.code !== code.toString()) return res.status(400).json({ error: 'Invalid code' });
  otpStore.delete(phone);
  return res.json({ success: true });
});

// Endpoint: send approval notification + media with template info
app.post('/whatsapp/notify-approval', express.json(), async (req, res) => {
  const { phone, membership_id, language = 'en_US', email, first_name } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'phone is required' });
  try {
    const settingsPath = path.join(__dirname, 'storage', 'whatsapp_settings.json');
    let settings = { whatsapp_enabled: true, downloads_per_week: 2};
    try {
      if (fs.existsSync(settingsPath)) {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      }
    } catch (e) {
      logWarn('Failed to read whatsapp settings, using defaults', e);
    }
    if (!settings.whatsapp_enabled) {
      logInfo(`⏭️  Approval: WhatsApp disabled for ${phone}`);
      return res.status(200).json({ success: false, reason: 'whatsapp_disabled' });
    }
    const templateId = 'approved';
    const langCode = 'en'; // Use correct language code for approved template
    const params = [first_name || '', membership_id || ''];
    const textResult = await sendWhatsAppTemplate(phone, templateId, langCode, params);
    let emailResult = { success: false };
    if (email && first_name) {
      emailResult = await sendApprovalEmail(email, first_name, membership_id);
    }
    res.json({ success: true, template: templateId, textResult, emailResult });
  } catch (err) {
    logError(`❌ Approval send failed`, err);
    res.status(500).json({ error: 'Failed to notify approval' });
  }
});

// Admin settings endpoint (returns default settings if not found)
app.get('/admin/settings', (req, res) => {
  try {
    const settingsPath = path.join(__dirname, 'storage', 'whatsapp_settings.json');
    let settings = { whatsapp_enabled: true, downloads_per_week: 1, registration_enabled: true };
    if (fs.existsSync(settingsPath)) {
      try {
        const raw = fs.readFileSync(settingsPath, 'utf8');
        settings = Object.assign(settings, JSON.parse(raw));
      } catch (e) {
        console.warn('Failed to parse whatsapp_settings.json, using defaults', e);
      }
    }
    if (typeof settings.registration_enabled !== 'boolean') settings.registration_enabled = true;
    res.json({ success: true, settings });
  } catch (err) {
    console.error('get settings error', err);
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

// Fallback for get-presigned-photo-upload (local upload only)
app.post('/get-presigned-photo-upload', (req, res) => {
  // This endpoint is a placeholder for S3. For local, just return a local upload URL.
  const baseUrl = process.env.API_URL || `http://localhost:${PORT}`;
  res.json({ url: `${baseUrl}/upload` });
});

app.post('/admin/settings', express.json(), (req, res) => {
  try {
    const { whatsapp_enabled, downloads_per_week, registration_enabled } = req.body || {};
    const settingsPath = path.join(__dirname, 'storage', 'whatsapp_settings.json');
    const settings = {
      whatsapp_enabled: !!whatsapp_enabled,
      downloads_per_week: typeof downloads_per_week === 'number' ? downloads_per_week : parseInt(downloads_per_week, 10) || 1,
      registration_enabled: typeof registration_enabled === 'boolean' ? registration_enabled : true
    };
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    res.json({ success: true, settings });
  } catch (err) {
    console.error('save settings error', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Download tracking storage helpers
const downloadsFile = path.join(__dirname, 'storage', 'downloads.json');
function ensureDownloadsFile() {
  if (!fs.existsSync(downloadsFile)) {
    fs.writeFileSync(downloadsFile, JSON.stringify({}, null, 2));
  }
}
function readDownloads() {
  ensureDownloadsFile();
  try {
    return JSON.parse(fs.readFileSync(downloadsFile, 'utf8')) || {};
  } catch (e) {
    console.warn('Failed to read downloads.json, returning empty', e);
    return {};
  }
}
function writeDownloads(data) {
  fs.writeFileSync(downloadsFile, JSON.stringify(data, null, 2));
}

// Endpoint: Check if member is allowed to download (enforces weekly limit)
app.post('/whatsapp/check-download-allowed', express.json(), (req, res) => {
  try {
    const { membership_id } = req.body || {};
    if (!membership_id) return res.status(400).json({ error: 'membership_id is required' });

    // Load settings to get limit
    const settingsPath = path.join(__dirname, 'storage', 'whatsapp_settings.json');
    let settings = { downloads_per_week: 1 };
    if (fs.existsSync(settingsPath)) {
      try { settings = Object.assign(settings, JSON.parse(fs.readFileSync(settingsPath, 'utf8'))); } catch (e) {}
    }

    const limit = Number(settings.downloads_per_week) || 1;
    const downloads = readDownloads();
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const memberLogs = Array.isArray(downloads[membership_id]) ? downloads[membership_id] : [];
    const recent = memberLogs.filter(ts => typeof ts === 'number' && ts >= weekAgo);

    const allowed = recent.length < limit;
    res.json({ success: true, allowed, downloadsThisWeek: recent.length, limit });
  } catch (err) {
    console.error('check-download-allowed error', err);
    res.status(500).json({ error: 'Failed to check download allowance' });
  }
});

// Endpoint: Record a download for a member
app.post('/whatsapp/record-download', express.json(), (req, res) => {
  try {
    const { membership_id } = req.body || {};
    if (!membership_id) return res.status(400).json({ error: 'membership_id is required' });
    const downloads = readDownloads();
    if (!Array.isArray(downloads[membership_id])) downloads[membership_id] = [];
    downloads[membership_id].push(Date.now());
    writeDownloads(downloads);
    res.json({ success: true });
  } catch (err) {
    console.error('record-download error', err);
    res.status(500).json({ error: 'Failed to record download' });
  }
});

// ==================== WhatsApp Template Endpoints ====================

// Endpoint: Get all templates (from persistent storage)
app.get('/whatsapp/templates', (req, res) => {
  try {
    const allTemplates = templateManager.getAllTemplates();
    const grouped = {
      approval: Object.values(allTemplates).filter(t => t.type === 'approval'),
      otp: Object.values(allTemplates).filter(t => t.type === 'otp'),
      registration: Object.values(allTemplates).filter(t => t.type === 'registration'),
      custom: Object.values(allTemplates).filter(t => t.type === 'custom')
    };
    console.log('📋 Retrieved all templates:', Object.keys(allTemplates).length, 'templates');
    res.json({ success: true, templates: grouped, all: allTemplates });
  } catch (err) {
    console.error('❌ Failed to retrieve templates:', err);
    res.status(500).json({ error: 'Failed to retrieve templates' });
  }
});

// Endpoint: Get templates by type
app.get('/whatsapp/templates/:type', (req, res) => {
  try {
    const { type } = req.params;
    const templates = templateManager.getTemplatesByType(type);
    console.log(`📋 Retrieved ${templates.length} templates for type: ${type}`);
    res.json({ success: true, type, templates });
  } catch (err) {
    console.error(`❌ Failed to retrieve templates for type ${req.params.type}:`, err);
    res.status(500).json({ error: 'Failed to retrieve templates' });
  }
});

// Endpoint: Get single template by ID
app.get('/whatsapp/template/:id', (req, res) => {
  try {
    const { id } = req.params;
    const template = templateManager.getTemplateById(id);
    if (!template) {
      return res.status(404).json({ error: `Template ${id} not found` });
    }
    console.log(`📄 Retrieved template: ${id}`);
    res.json({ success: true, template });
  } catch (err) {
    console.error(`❌ Failed to retrieve template ${req.params.id}:`, err);
    res.status(500).json({ error: 'Failed to retrieve template' });
  }
});

// Endpoint: Create new template
// DISABLED - Templates are managed by developers only
app.post('/whatsapp/templates', express.json(), (req, res) => {
  res.status(403).json({ error: 'Template creation is disabled. Only system templates are allowed.' });
});

// Endpoint: Update template
app.put('/whatsapp/templates/:id', express.json(), (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const updatedTemplate = templateManager.updateTemplate(id, updates);
    console.log(`✅ Updated template: ${id}`);
    res.json({ success: true, template: updatedTemplate });
  } catch (err) {
    console.error(`❌ Failed to update template ${req.params.id}:`, err);
    res.status(500).json({ error: err.message || 'Failed to update template' });
  }
});

// Endpoint: Delete template
// DISABLED - System templates cannot be deleted
app.delete('/whatsapp/templates/:id', (req, res) => {
  res.status(403).json({ error: 'Template deletion is disabled. System templates cannot be removed.' });
});

// Endpoint: Reset templates to defaults
// DISABLED - Templates are always stored as defaults
app.post('/whatsapp/templates/reset/defaults', (req, res) => {
  res.status(403).json({ error: 'Template reset is disabled. System templates are always at default state.' });
});

// Endpoint: Send registration notification
app.post('/whatsapp/send-registration', express.json(), async (req, res) => {
  const { phone, first_name, membership_id, language = 'en_US' } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'phone is required' });
  const templateId = 'memeber_register'; // Use exact BM template name
  logInfo(`📝 Registration: Sending template [${templateId}] to ${phone}`);
  try {
    const tm = templateManager.getTemplateById(templateId) || {};
    const langCode = tm.language || language || 'en_US';
    const params = [first_name || '', membership_id || ''];
    const urlButton = 'https://www.facebook.com/mslpakistan';
    const result = await sendWhatsAppTemplate(phone, templateId, langCode, params, urlButton);
    res.json({ success: true, template: templateId, result });
  } catch (err) {
    logError(`❌ Registration send failed [${templateId}]`, err);
    res.status(500).json({ error: 'Failed to send registration notification', template: templateId });
  }
});

// Endpoint: Send registration email
app.post('/send-registration-email', express.json(), async (req, res) => {
  const { email, full_name } = req.body || {};
  if (!email || !full_name) {
    return res.status(400).json({ error: 'email and full_name are required' });
  }
  
  logInfo(`📧 Sending registration email to ${email}`);
  
  try {
    const result = await sendRegistrationEmail(email, full_name);
    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      logWarn(`Registration email send failed for ${email}`, result.error);
      res.status(500).json({ error: result.error });
    }
  } catch (err) {
    logError(`Failed to send registration email to ${email}`, err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Endpoint: Send approval email
app.post('/send-approval-email', express.json(), async (req, res) => {
  const { email, full_name, membership_id } = req.body || {};
  if (!email || !full_name || !membership_id) {
    return res.status(400).json({ error: 'email, full_name, and membership_id are required' });
  }
  
  logInfo(`📧 Sending approval email to ${email} for membership ${membership_id}`);
  
  try {
    const result = await sendApprovalEmail(email, full_name, membership_id);
    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      logWarn(`Approval email send failed for ${email}`, result.error);
      res.status(500).json({ error: result.error });
    }
  } catch (err) {
    logError(`Failed to send approval email to ${email}`, err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Endpoint: Proxy arbitrary template send (for testing) - accepts template payload in request body
app.post('/whatsapp/send-template', express.json(), async (req, res) => {
  const payload = req.body || {};
  const { to, template } = payload;
  if (!to || !template || !template.name) return res.status(400).json({ error: 'to and template.name are required' });

  try {
    const name = template.name;
    const langCode = (template.language && template.language.code) ? template.language.code : (templateManager.getTemplateById(name) ? templateManager.getTemplateById(name).language : 'en');

    // Extract body parameters if provided
    let params = [];
    if (Array.isArray(template.components)) {
      const bodyComp = template.components.find(c => c.type === 'body');
      if (bodyComp && Array.isArray(bodyComp.parameters)) {
        params = bodyComp.parameters.map(p => p.text || (p.payload && p.payload.url) || '');
      }
    }

    const result = await sendWhatsAppTemplate(to, name, langCode, params);
    res.json({ success: true, result });
  } catch (err) {
    console.error('send-template proxy failed', err);
    res.status(500).json({ error: 'Failed to send template' });
  }
});

// Configure multer for PDF uploads
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const pdfDir = path.join(__dirname, 'storage', 'template');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }
    cb(null, pdfDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'template.pdf'); // Always save as template.pdf to overwrite previous
  }
});

const pdfUpload = multer({
  storage: pdfStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for PDFs
  fileFilter: (req, file, cb) => {
    // Accept common PDF mime types
    if (file.mimetype === 'application/pdf' || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      console.warn('Rejected non-PDF upload, mimetype=', file.mimetype);
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// Upload endpoint
app.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the URL to access the file
  const baseUrl = process.env.API_URL || `http://localhost:${PORT}`;
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// PDF template upload endpoint
app.post('/upload-template', pdfUpload.single('template'), (req, res) => {
  console.log('PDF upload request received');
  console.log('File:', req.file);
  console.log('Body:', req.body);
  
  if (!req.file) {
    console.log('No file uploaded');
    return res.status(400).json({ error: 'No PDF file uploaded' });
  }
  // Return the URL to access the PDF
  const baseUrl = process.env.API_URL || `http://localhost:${PORT}`;
  const fileUrl = `${baseUrl}/get-pdf-template`;
  console.log('File uploaded successfully:', fileUrl);
  res.json({ url: fileUrl });
});

// Global error handlers to keep server alive and log issues
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

// Save template data endpoint
app.post('/save-template', express.json(), (req, res) => {
  const { template } = req.body;
  if (!template) {
    return res.status(400).json({ error: 'No template data provided' });
  }

  try {
    // Save template data to a JSON file
    const templatePath = path.join(__dirname, 'storage', 'template', 'template.json');
    fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
    res.json({ success: true, message: 'Template saved successfully' });
  } catch (error) {
    console.error('Error saving template:', error);
    res.status(500).json({ error: 'Failed to save template' });
  }
});

// Load template data endpoint (with default fallback)
app.get('/load-template', (req, res) => {
  try {
    const templatePath = path.join(__dirname, 'storage', 'template', 'template.json');
    if (fs.existsSync(templatePath)) {
      const templateData = fs.readFileSync(templatePath, 'utf8');
      res.json(JSON.parse(templateData));
    } else {
      // Fallback: serve default template
      const defaultTemplatePath = path.join(__dirname, 'storage', 'template', 'default-template.json');
      if (fs.existsSync(defaultTemplatePath)) {
        const defaultData = fs.readFileSync(defaultTemplatePath, 'utf8');
        res.json(JSON.parse(defaultData));
      } else {
        res.status(404).json({ error: 'No template found. Please design and save a template first.' });
      }
    }
  } catch (error) {
    console.error('Error loading template:', error);
    res.status(500).json({ error: 'Failed to load template' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Serve template files
app.use('/templates', express.static(path.join(__dirname, 'storage', 'template')));

// Serve font files for pdfme
const fontsDir = path.join(__dirname, 'storage', 'fonts');
console.log('Fonts directory path:', fontsDir);
console.log('Fonts directory exists:', fs.existsSync(fontsDir));
if (fs.existsSync(fontsDir)) {
  console.log('Fonts in directory:', fs.readdirSync(fontsDir));
}

// Add CORS headers for fonts before serving static files
app.use('/storage/fonts', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Content-Type', 'application/octet-stream');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve fonts
app.use('/storage/fonts', express.static(fontsDir));

// Serve fonts with proper headers
app.use('/fonts', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.path.endsWith('.ttf')) {
    res.setHeader('Content-Type', 'application/x-font-ttf');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use('/fonts', express.static(fontsDir));


// Get PDF template endpoint
app.get('/get-pdf-template', (req, res) => {
  const pdfPath = path.join(__dirname, 'storage', 'template', 'template.pdf');
  if (fs.existsSync(pdfPath)) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Content-Type', 'application/pdf');
    res.sendFile(pdfPath);
  } else {
    res.status(404).json({ error: 'PDF template not found' });
  }
});

// --- CATCH-ALL: Serve React frontend for all non-API routes (client-side routing support) ---
// Place this after all API/static routes, before app.listen
app.get('*', (req, res) => {
  // If the request starts with /api or other backend routes, skip
  const apiPrefixes = [
    '/api', '/uploads', '/templates', '/fonts', '/storage', '/get-pdf-template', '/webhook', '/whatsapp', '/send-registration-email', '/send-approval-email', '/admin', '/get-presigned-photo-upload', '/save-template', '/load-template'
  ];
  if (apiPrefixes.some(prefix => req.path.startsWith(prefix))) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

try {
  app.listen(PORT, () => {
    logInfo(`🚀 Server running on http://localhost:${PORT}`);
  });
} catch (err) {
  console.error('Failed to start server:', err);
}

async function sendWhatsAppTemplate(phone, templateName, languageCode = 'en', parameters = [], buttonParam = null, buttonType = 'url') {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn('WhatsApp credentials not configured');
    return { error: 'WhatsApp not configured' };
  }

  const formattedPhone = formatPhoneForWhatsApp(phone);
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  // Build components for body parameters
  const bodyParams = (parameters || []).map(p => ({ type: 'text', text: String(p) }));
  const components = [];
  if (bodyParams.length) {
    components.push({ type: 'body', parameters: bodyParams });
  }
  // For authentication templates with copy code button, use type=url and pass code as text param
  if (buttonParam && buttonType === 'copy_code') {
    components.push({
      type: 'button',
      sub_type: 'url',
      index: 0,
      parameters: [{ type: 'text', text: String(buttonParam) }]
    });
  } else if (buttonParam) {
    components.push({ type: 'button', sub_type: buttonType, index: 0, parameters: [{ type: 'text', text: String(buttonParam) }] });
  }

  const body = {
    messaging_product: 'whatsapp',
    to: formattedPhone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components
    }
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WHATSAPP_TOKEN}` },
    body: JSON.stringify(body)
  });

  return resp.json();
}