export function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err.message);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: { code: 'FILE_TOO_LARGE', message: 'Ukuran file maksimal 5MB' }
      });
    }
    return res.status(400).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: err.message }
    });
  }

  if (err.message && err.message.includes('gambar')) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FILE', message: err.message }
    });
  }

  res.status(500).json({
    success: false,
    error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' }
  });
}
