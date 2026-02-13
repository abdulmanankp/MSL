const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const upload = multer({ dest: path.join(__dirname, 'uploads') });

app.post('/upload-template', upload.single('template'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Optionally rename/move file, validate, etc.
  res.json({ url: `http://localhost:3001/uploads/${req.file.filename}` });
});

app.listen(3001, () => {
  console.log('Server running on 3001');
});
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, base + '-' + Date.now() + ext);
  }
});

const templateUpload = multer({
  storage: templateStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});


// (Legacy local profile upload endpoint removed. Use S3 pre-signed upload instead.)

// PDF template upload endpoint
app.post('/upload-template', templateUpload.single('template'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const publicUrl = `/storage/templates/${req.file.filename}`;
  res.json({ url: publicUrl });
});


// (Legacy static file serving removed. All profile images/templates are now on S3.)

app.listen(PORT, () => {
  console.log(`Image upload server running on http://localhost:${PORT}`);
});
