import multer from 'multer';
import path from 'path';
import config from '../config.js';

// Use Memory Storage for Vercel/Supabase since local filesystem is ephemeral
const storage = multer.memoryStorage();

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
