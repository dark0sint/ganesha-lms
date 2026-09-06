const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authRequired, allowRoles } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

// Daftar kelas: dosen lihat kelas miliknya, mahasiswa lihat kelas yg diikuti, admin lihat semua
router.get('/', (req, res) => {
  const { role, id } = req.user;
  let rows;
  if (role === 'dosen') {
    rows = db.prepare(`
      SELECT k.*, u.nama as nama_dosen,
        (SELECT COUNT(*) FROM enrolments e WHERE e.kelas_id = k.id) as jumlah_mahasiswa
      FROM kelas k JOIN users u ON u.id = k.dosen_id
      WHERE k.dosen_id = ? ORDER BY k.created_at DESC`).all(id);
  } else if (role === 'mahasiswa') {
    rows = db.prepare(`
      SELECT k.*, u.nama as nama_dosen,
        (SELECT COUNT(*) FROM enrolments e WHERE e.kelas_id = k.id) as jumlah_mahasiswa
      FROM kelas k
      JOIN users u ON u.id = k.dosen_id
      JOIN enrolments en ON en.kelas_id = k.id
      WHERE en.mahasiswa_id = ? ORDER BY k.created_at DESC`).all(id);
  } else {
    rows = db.prepare(`
      SELECT k.*, u.nama as nama_dosen,
        (SELECT COUNT(*) FROM enrolments e WHERE e.kelas_id = k.id) as jumlah_mahasiswa
      FROM kelas k JOIN users u ON u.id = k.dosen_id ORDER BY k.created_at DESC`).all();
  }
  res.json({ kelas: rows });
});

// Kelas yang tersedia untuk diikuti mahasiswa (belum diambil)
router.get('/tersedia', allowRoles('mahasiswa'), (req, res) => {
  const rows = db.prepare(`
    SELECT k.*, u.nama as nama_dosen
    FROM kelas k JOIN users u ON u.id = k.dosen_id
    WHERE k.id NOT IN (SELECT kelas_id FROM enrolments WHERE mahasiswa_id = ?)
    ORDER BY k.created_at DESC`).all(req.user.id);
  res.json({ kelas: rows });
});

router.post('/', allowRoles('dosen', 'admin'), (req, res) => {
  const { nama, kode, deskripsi, sks } = req.body;
  if (!nama || !kode) return res.status(400).json({ message: 'Nama dan kode kelas wajib diisi.' });
  const id = uuid();
  try {
    db.prepare('INSERT INTO kelas (id, nama, kode, deskripsi, dosen_id, sks) VALUES (?,?,?,?,?,?)')
      .run(id, nama, kode, deskripsi || '', req.user.id, sks || 3);
    res.status(201).json({ kelas: db.prepare('SELECT * FROM kelas WHERE id = ?').get(id) });
  } catch (e) {
    res.status(409).json({ message: 'Kode kelas sudah digunakan.' });
  }
});

router.get('/:id', (req, res) => {
  const kelas = db.prepare(`SELECT k.*, u.nama as nama_dosen FROM kelas k JOIN users u ON u.id=k.dosen_id WHERE k.id=?`).get(req.params.id);
  if (!kelas) return res.status(404).json({ message: 'Kelas tidak ditemukan.' });
  const anggota = db.prepare(`
    SELECT u.id, u.nama, u.email, u.nim_nip FROM enrolments e
    JOIN users u ON u.id = e.mahasiswa_id WHERE e.kelas_id = ?`).all(req.params.id);
  res.json({ kelas, anggota });
});

router.put('/:id', allowRoles('dosen', 'admin'), (req, res) => {
  const { nama, deskripsi, sks } = req.body;
  db.prepare('UPDATE kelas SET nama=COALESCE(?,nama), deskripsi=COALESCE(?,deskripsi), sks=COALESCE(?,sks) WHERE id=?')
    .run(nama, deskripsi, sks, req.params.id);
  res.json({ kelas: db.prepare('SELECT * FROM kelas WHERE id=?').get(req.params.id) });
});

router.delete('/:id', allowRoles('dosen', 'admin'), (req, res) => {
  db.prepare('DELETE FROM kelas WHERE id=?').run(req.params.id);
  res.json({ message: 'Kelas berhasil dihapus.' });
});

// Mahasiswa bergabung ke kelas
router.post('/:id/gabung', allowRoles('mahasiswa'), (req, res) => {
  try {
    db.prepare('INSERT INTO enrolments (id, kelas_id, mahasiswa_id) VALUES (?,?,?)')
      .run(uuid(), req.params.id, req.user.id);
    res.status(201).json({ message: 'Berhasil bergabung ke kelas.' });
  } catch {
    res.status(409).json({ message: 'Anda sudah terdaftar di kelas ini.' });
  }
});

router.delete('/:id/keluar', allowRoles('mahasiswa'), (req, res) => {
  db.prepare('DELETE FROM enrolments WHERE kelas_id=? AND mahasiswa_id=?').run(req.params.id, req.user.id);
  res.json({ message: 'Berhasil keluar dari kelas.' });
});

// ============ PERTEMUAN (sinkron/asinkron) ============
router.get('/:id/pertemuan', (req, res) => {
  const rows = db.prepare('SELECT * FROM pertemuan WHERE kelas_id=? ORDER BY tanggal ASC').all(req.params.id);
  res.json({ pertemuan: rows });
});

router.post('/:id/pertemuan', allowRoles('dosen', 'admin'), (req, res) => {
  const { judul, tipe, tanggal, jam_mulai, jam_selesai, link_meeting, catatan } = req.body;
  if (!judul || !tipe || !tanggal) return res.status(400).json({ message: 'Judul, tipe, dan tanggal wajib diisi.' });
  const id = uuid();
  db.prepare(`INSERT INTO pertemuan (id, kelas_id, judul, tipe, tanggal, jam_mulai, jam_selesai, link_meeting, catatan)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(id, req.params.id, judul, tipe, tanggal, jam_mulai, jam_selesai, link_meeting, catatan);
  res.status(201).json({ pertemuan: db.prepare('SELECT * FROM pertemuan WHERE id=?').get(id) });
});

router.delete('/pertemuan/:pid', allowRoles('dosen', 'admin'), (req, res) => {
  db.prepare('DELETE FROM pertemuan WHERE id=?').run(req.params.pid);
  res.json({ message: 'Pertemuan dihapus.' });
});

// Presensi untuk pertemuan tertentu
router.get('/pertemuan/:pid/presensi', (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, u.nama, u.nim_nip FROM presensi p JOIN users u ON u.id=p.mahasiswa_id
    WHERE pertemuan_id=?`).all(req.params.pid);
  res.json({ presensi: rows });
});

// Mahasiswa mengisi presensi sendiri
router.post('/pertemuan/:pid/presensi', allowRoles('mahasiswa'), (req, res) => {
  const { status } = req.body;
  try {
    db.prepare('INSERT INTO presensi (id, pertemuan_id, mahasiswa_id, status) VALUES (?,?,?,?)')
      .run(uuid(), req.params.pid, req.user.id, status || 'hadir');
    res.status(201).json({ message: 'Presensi berhasil dicatat.' });
  } catch {
    res.status(409).json({ message: 'Anda sudah presensi pada pertemuan ini.' });
  }
});

// Dosen set/update presensi mahasiswa tertentu
router.put('/pertemuan/:pid/presensi/:mid', allowRoles('dosen', 'admin'), (req, res) => {
  const { status } = req.body;
  const existing = db.prepare('SELECT id FROM presensi WHERE pertemuan_id=? AND mahasiswa_id=?').get(req.params.pid, req.params.mid);
  if (existing) {
    db.prepare('UPDATE presensi SET status=? WHERE id=?').run(status, existing.id);
  } else {
    db.prepare('INSERT INTO presensi (id, pertemuan_id, mahasiswa_id, status) VALUES (?,?,?,?)')
      .run(uuid(), req.params.pid, req.params.mid, status);
  }
  res.json({ message: 'Presensi diperbarui.' });
});

module.exports = router;
