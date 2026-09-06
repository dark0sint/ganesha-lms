const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authRequired, allowRoles } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Hanya file PDF yang diizinkan.'));
  }
});

// Daftar materi per kelas
router.get('/kelas/:kelasId', (req, res) => {
  const rows = db.prepare(`
    SELECT m.*, u.nama as pengunggah,
      (SELECT COUNT(*) FROM materi_views v WHERE v.materi_id = m.id) as jumlah_dibaca
    FROM materi m JOIN users u ON u.id = m.uploaded_by
    WHERE m.kelas_id = ? ORDER BY m.created_at DESC`).all(req.params.kelasId);
  res.json({ materi: rows });
});

// Unggah materi (dosen) - PDF via multipart, link/video via JSON
router.post('/kelas/:kelasId', allowRoles('dosen', 'admin'), upload.single('file'), (req, res) => {
  const { judul, deskripsi, tipe, url } = req.body;
  if (!judul || !tipe) return res.status(400).json({ message: 'Judul dan tipe materi wajib diisi.' });
  if (tipe === 'pdf' && !req.file) return res.status(400).json({ message: 'File PDF wajib diunggah.' });
  if ((tipe === 'link' || tipe === 'video') && !url) return res.status(400).json({ message: 'URL wajib diisi.' });

  const id = uuid();
  db.prepare(`INSERT INTO materi (id, kelas_id, judul, deskripsi, tipe, file_path, url, uploaded_by)
    VALUES (?,?,?,?,?,?,?,?)`).run(
    id, req.params.kelasId, judul, deskripsi || '', tipe,
    req.file ? `/uploads/${req.file.filename}` : null,
    url || null, req.user.id
  );
  res.status(201).json({ materi: db.prepare('SELECT * FROM materi WHERE id=?').get(id) });
});

// Tandai materi sudah dibaca/dilihat (mahasiswa) - untuk tracking
router.post('/:id/dibaca', allowRoles('mahasiswa'), (req, res) => {
  try {
    db.prepare('INSERT INTO materi_views (id, materi_id, mahasiswa_id) VALUES (?,?,?)')
      .run(uuid(), req.params.id, req.user.id);
  } catch { /* sudah pernah ditandai, abaikan */ }
  res.json({ message: 'Tercatat.' });
});

router.delete('/:id', allowRoles('dosen', 'admin'), (req, res) => {
  db.prepare('DELETE FROM materi WHERE id=?').run(req.params.id);
  res.json({ message: 'Materi dihapus.' });
});

module.exports = router;
