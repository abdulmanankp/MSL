import express from 'express';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import fs from 'fs';

const app = express();
const PORT = 3001;

app.use(cors());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(path.resolve(), 'storage', 'profile');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Always use the original extension for the saved file
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext);
    cb(null, base + '-' + Date.now() + ext);
  }
});

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

app.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return public URL (remove /public_html from path, always start with /storage/profile)
  const publicUrl = `/storage/profile/${req.file.filename}`;
  res.json({ url: publicUrl });
});

// Serve /storage/profile as the public URL, mapped to the physical /public_html/storage/profile directory
app.use('/storage/profile', express.static(path.join(path.resolve(), 'storage', 'profile')));

app.listen(PORT, () => {
  console.log(`Image upload server running on http://localhost:${PORT}`);
});
