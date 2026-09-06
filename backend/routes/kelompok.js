const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authRequired, allowRoles } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

router.get('/kelas/:kelasId', (req, res) => {
  const rows = db.prepare('SELECT * FROM kelompok WHERE kelas_id=? ORDER BY created_at ASC').all(req.params.kelasId);
  const withAnggota = rows.map(k => {
    const anggota = db.prepare(`
      SELECT u.id, u.nama, u.nim_nip FROM kelompok_anggota ka
      JOIN users u ON u.id = ka.mahasiswa_id WHERE ka.kelompok_id=?`).all(k.id);
    return { ...k, anggota, terisi: anggota.length };
  });
  res.json({ kelompok: withAnggota });
});

// Dosen membuka slot kelompok; mahasiswa juga boleh membuat kelompok mandiri
router.post('/kelas/:kelasId', (req, res) => {
  const { nama, kapasitas } = req.body;
  if (!nama) return res.status(400).json({ message: 'Nama kelompok wajib diisi.' });
  const id = uuid();
  db.prepare('INSERT INTO kelompok (id, kelas_id, nama, kapasitas, dibuat_oleh) VALUES (?,?,?,?,?)')
    .run(id, req.params.kelasId, nama, kapasitas || 5, req.user.id);
  res.status(201).json({ kelompok: db.prepare('SELECT * FROM kelompok WHERE id=?').get(id) });
});

// Mahasiswa memilih sendiri kelompoknya (self-select)
router.post('/:id/gabung', allowRoles('mahasiswa'), (req, res) => {
  const kelompok = db.prepare('SELECT * FROM kelompok WHERE id=?').get(req.params.id);
  if (!kelompok) return res.status(404).json({ message: 'Kelompok tidak ditemukan.' });

  const sudahPunyaKelompok = db.prepare(`
    SELECT ka.id FROM kelompok_anggota ka JOIN kelompok k ON k.id=ka.kelompok_id
    WHERE k.kelas_id=? AND ka.mahasiswa_id=?`).get(kelompok.kelas_id, req.user.id);
  if (sudahPunyaKelompok) return res.status(409).json({ message: 'Anda sudah tergabung di kelompok lain pada kelas ini.' });

  const jumlahAnggota = db.prepare('SELECT COUNT(*) as n FROM kelompok_anggota WHERE kelompok_id=?').get(req.params.id).n;
  if (jumlahAnggota >= kelompok.kapasitas) return res.status(409).json({ message: 'Kelompok sudah penuh.' });

  db.prepare('INSERT INTO kelompok_anggota (id, kelompok_id, mahasiswa_id) VALUES (?,?,?)').run(uuid(), req.params.id, req.user.id);
  res.status(201).json({ message: 'Berhasil bergabung ke kelompok.' });
});

router.delete('/:id/keluar', allowRoles('mahasiswa'), (req, res) => {
  db.prepare('DELETE FROM kelompok_anggota WHERE kelompok_id=? AND mahasiswa_id=?').run(req.params.id, req.user.id);
  res.json({ message: 'Berhasil keluar dari kelompok.' });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM kelompok WHERE id=?').run(req.params.id);
  res.json({ message: 'Kelompok dihapus.' });
});

module.exports = router;
