import multer from 'multer';
import path from 'path';
import fs from 'fs';
import config from '../config.js';

// Ensure upload directory exists
if (!fs.existsSync(config.UPLOAD_DIR)) {
  fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const isValid = allowed.test(file.mimetype) && allowed.test(path.extname(file.originalname).toLowerCase().replace('.', ''));
  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPG, PNG, WebP) yang diizinkan'), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: config.MAX_FILE_SIZE },
  fileFilter
});
