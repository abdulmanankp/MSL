import express from 'express';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import dotenv from 'dotenv';
import { logInfo, logError, logWarn } from './server/logger.js';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());

// External file server configuration (PHP microservice)
const FILE_SERVER_URL = process.env.FILE_SERVER_URL || '';
const FILE_SERVER_API_TOKEN = process.env.FILE_SERVER_API_TOKEN || '';

// Log file server configuration status on startup
logInfo('📦 File Server Configuration:', {
  url: FILE_SERVER_URL ? '✅ set' : '❌ missing',
  token: FILE_SERVER_API_TOKEN ? '✅ set' : '❌ missing'
});
if (!FILE_SERVER_URL || !FILE_SERVER_API_TOKEN) {
  logWarn('⚠️  File server not fully configured. Profile photos will fail to upload.');
}

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 250 * 1024 }, // 250KB
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

app.post('/upload', upload.single('photo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    if (!FILE_SERVER_URL || !FILE_SERVER_API_TOKEN) {
      logError('❌ File server not configured. Cannot upload profile photo.');
      return res.status(500).json({ error: 'File server not configured' });
    }

    // Generate filename with timestamp
    const ext = path.extname(req.file.originalname).toLowerCase();
    const base = path.basename(req.file.originalname, ext);
    const filename = `${base}-${Date.now()}${ext}`;

    const uploadUrl = `${FILE_SERVER_URL.replace(/\/$/, '')}/upload`;
    const formData = new FormData();
    formData.append('photo', new Blob([req.file.buffer], { type: req.file.mimetype }), filename);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FILE_SERVER_API_TOKEN}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logError(`❌ File server upload failed: ${response.status} ${errorBody}`);
      return res.status(502).json({ error: 'Failed to upload file to file server' });
    }

    const payload = await response.json();
    if (!payload || !payload.url) {
      logError('❌ File server response missing url');
      return res.status(502).json({ error: 'Invalid response from file server' });
    }

    logInfo(`✅ Profile photo uploaded successfully: ${filename}`);
    res.json({ url: payload.url });
  } catch (error) {
    logError(`❌ Upload endpoint error:`, error.message);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Health check endpoint - verify file server configuration
app.get('/health', (req, res) => {
  const configured = !!(FILE_SERVER_URL && FILE_SERVER_API_TOKEN);
  res.status(configured ? 200 : 503).json({
    status: configured ? 'ok' : 'degraded',
    service: 'image-upload',
    file_server_configured: configured,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Image upload server running on http://localhost:${PORT}`);
  if (FILE_SERVER_URL && FILE_SERVER_API_TOKEN) {
    console.log('✅ File server is configured and ready');
  } else {
    console.warn('⚠️  File server is not configured. Check your environment variables.');
  }
});
