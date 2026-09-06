const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

// ============ FORUM DISKUSI (asinkron, per topik) ============
router.get('/kelas/:kelasId/topik', (req, res) => {
  const rows = db.prepare(`
    SELECT t.*, u.nama as nama_pembuat,
      (SELECT COUNT(*) FROM forum_balasan b WHERE b.topik_id = t.id) as jumlah_balasan
    FROM forum_topik t JOIN users u ON u.id = t.dibuat_oleh
    WHERE t.kelas_id=? ORDER BY t.created_at DESC`).all(req.params.kelasId);
  res.json({ topik: rows });
});

router.post('/kelas/:kelasId/topik', (req, res) => {
  const { judul, isi } = req.body;
  if (!judul) return res.status(400).json({ message: 'Judul topik wajib diisi.' });
  const id = uuid();
  db.prepare('INSERT INTO forum_topik (id, kelas_id, judul, isi, dibuat_oleh) VALUES (?,?,?,?,?)')
    .run(id, req.params.kelasId, judul, isi || '', req.user.id);
  res.status(201).json({ topik: db.prepare('SELECT * FROM forum_topik WHERE id=?').get(id) });
});

router.get('/topik/:id', (req, res) => {
  const topik = db.prepare(`SELECT t.*, u.nama as nama_pembuat FROM forum_topik t JOIN users u ON u.id=t.dibuat_oleh WHERE t.id=?`).get(req.params.id);
  if (!topik) return res.status(404).json({ message: 'Topik tidak ditemukan.' });
  const balasan = db.prepare(`
    SELECT b.*, u.nama, u.role FROM forum_balasan b JOIN users u ON u.id=b.dibuat_oleh
    WHERE b.topik_id=? ORDER BY b.created_at ASC`).all(req.params.id);
  res.json({ topik, balasan });
});

router.post('/topik/:id/balas', (req, res) => {
  const { isi } = req.body;
  if (!isi) return res.status(400).json({ message: 'Isi balasan tidak boleh kosong.' });
  const id = uuid();
  db.prepare('INSERT INTO forum_balasan (id, topik_id, isi, dibuat_oleh) VALUES (?,?,?,?)').run(id, req.params.id, isi, req.user.id);
  res.status(201).json({ balasan: db.prepare('SELECT * FROM forum_balasan WHERE id=?').get(id) });
});

// ============ CHAT KELAS (sinkron, real-time via polling) ============
router.get('/kelas/:kelasId/chat', (req, res) => {
  const since = req.query.since;
  const rows = since
    ? db.prepare(`SELECT c.*, u.nama, u.role FROM chat_pesan c JOIN users u ON u.id=c.pengirim_id WHERE c.kelas_id=? AND c.created_at > ? ORDER BY c.created_at ASC`).all(req.params.kelasId, since)
    : db.prepare(`SELECT c.*, u.nama, u.role FROM chat_pesan c JOIN users u ON u.id=c.pengirim_id WHERE c.kelas_id=? ORDER BY c.created_at ASC LIMIT 200`).all(req.params.kelasId);
  res.json({ pesan: rows });
});

router.post('/kelas/:kelasId/chat', (req, res) => {
  const { isi } = req.body;
  if (!isi) return res.status(400).json({ message: 'Pesan tidak boleh kosong.' });
  const id = uuid();
  db.prepare('INSERT INTO chat_pesan (id, kelas_id, pengirim_id, isi) VALUES (?,?,?,?)').run(id, req.params.kelasId, req.user.id, isi);
  const pesan = db.prepare(`SELECT c.*, u.nama, u.role FROM chat_pesan c JOIN users u ON u.id=c.pengirim_id WHERE c.id=?`).get(id);
  res.status(201).json({ pesan });
});

module.exports = router;
