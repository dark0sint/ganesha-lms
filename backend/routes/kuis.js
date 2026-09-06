const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authRequired, allowRoles } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

// Daftar kuis per kelas
router.get('/kelas/:kelasId', (req, res) => {
  const rows = db.prepare('SELECT * FROM kuis WHERE kelas_id=? ORDER BY created_at DESC').all(req.params.kelasId);
  if (req.user.role === 'mahasiswa') {
    const withStatus = rows.map(k => {
      const sub = db.prepare('SELECT status, nilai FROM submisi_kuis WHERE kuis_id=? AND mahasiswa_id=?').get(k.id, req.user.id);
      return { ...k, status_saya: sub ? sub.status : 'belum_dikerjakan', nilai_saya: sub ? sub.nilai : null };
    });
    return res.json({ kuis: withStatus });
  }
  res.json({ kuis: rows });
});

router.post('/kelas/:kelasId', allowRoles('dosen', 'admin'), (req, res) => {
  const { judul, deskripsi, tipe, durasi_menit, buka_pada, tutup_pada, soal } = req.body;
  if (!judul || !tipe) return res.status(400).json({ message: 'Judul dan tipe kuis wajib diisi.' });
  const id = uuid();
  db.prepare(`INSERT INTO kuis (id, kelas_id, judul, deskripsi, tipe, durasi_menit, buka_pada, tutup_pada, created_by)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(id, req.params.kelasId, judul, deskripsi || '', tipe, durasi_menit || 60, buka_pada, tutup_pada, req.user.id);

  if (Array.isArray(soal)) {
    const insertSoal = db.prepare(`INSERT INTO soal (id, kuis_id, pertanyaan, tipe, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawaban_benar, bobot, urutan)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
    soal.forEach((s, idx) => {
      insertSoal.run(uuid(), id, s.pertanyaan, s.tipe, s.pilihan_a || null, s.pilihan_b || null, s.pilihan_c || null, s.pilihan_d || null, s.jawaban_benar || null, s.bobot || 10, idx);
    });
  }
  res.status(201).json({ kuis: db.prepare('SELECT * FROM kuis WHERE id=?').get(id) });
});

// Detail kuis + soal (jawaban_benar disembunyikan dari mahasiswa)
router.get('/:id', (req, res) => {
  const kuis = db.prepare('SELECT * FROM kuis WHERE id=?').get(req.params.id);
  if (!kuis) return res.status(404).json({ message: 'Kuis tidak ditemukan.' });
  const soalRows = db.prepare('SELECT * FROM soal WHERE kuis_id=? ORDER BY urutan ASC').all(req.params.id);
  const soal = req.user.role === 'mahasiswa'
    ? soalRows.map(({ jawaban_benar, ...rest }) => rest)
    : soalRows;
  res.json({ kuis, soal });
});

router.delete('/:id', allowRoles('dosen', 'admin'), (req, res) => {
  db.prepare('DELETE FROM kuis WHERE id=?').run(req.params.id);
  res.json({ message: 'Kuis dihapus.' });
});

// Mahasiswa mulai mengerjakan kuis
router.post('/:id/mulai', allowRoles('mahasiswa'), (req, res) => {
  try {
    const id = uuid();
    db.prepare('INSERT INTO submisi_kuis (id, kuis_id, mahasiswa_id) VALUES (?,?,?)').run(id, req.params.id, req.user.id);
    res.status(201).json({ submisi_id: id });
  } catch {
    const existing = db.prepare('SELECT id FROM submisi_kuis WHERE kuis_id=? AND mahasiswa_id=?').get(req.params.id, req.user.id);
    res.json({ submisi_id: existing.id, message: 'Melanjutkan pengerjaan sebelumnya.' });
  }
});

// Mahasiswa submit jawaban -> auto-grade pilihan ganda, esai menunggu penilaian dosen
router.post('/:id/submit', allowRoles('mahasiswa'), (req, res) => {
  const { jawaban } = req.body; // [{ soal_id, jawaban }]
  const submisi = db.prepare('SELECT * FROM submisi_kuis WHERE kuis_id=? AND mahasiswa_id=?').get(req.params.id, req.user.id);
  if (!submisi) return res.status(400).json({ message: 'Anda belum memulai kuis ini.' });

  const soalMap = {};
  db.prepare('SELECT * FROM soal WHERE kuis_id=?').all(req.params.id).forEach(s => soalMap[s.id] = s);

  let totalNilai = 0, totalBobot = 0, adaEsai = false;
  const insertJawaban = db.prepare('INSERT OR REPLACE INTO jawaban_soal (id, submisi_id, soal_id, jawaban, skor) VALUES (?,?,?,?,?)');

  (jawaban || []).forEach(j => {
    const s = soalMap[j.soal_id];
    if (!s) return;
    totalBobot += s.bobot;
    let skor = null;
    if (s.tipe === 'pilihan_ganda') {
      skor = (j.jawaban && j.jawaban === s.jawaban_benar) ? s.bobot : 0;
      totalNilai += skor;
    } else {
      adaEsai = true;
    }
    insertJawaban.run(uuid(), submisi.id, j.soal_id, j.jawaban || '', skor);
  });

  const nilaiAkhir = totalBobot > 0 ? Math.round((totalNilai / totalBobot) * 100) : null;
  db.prepare('UPDATE submisi_kuis SET selesai_pada=datetime(\'now\'), status=?, nilai=? WHERE id=?')
    .run(adaEsai ? 'selesai' : 'dinilai', adaEsai ? null : nilaiAkhir, submisi.id);

  res.json({ message: adaEsai ? 'Jawaban terkirim, menunggu penilaian esai oleh dosen.' : 'Kuis selesai dan dinilai otomatis.', nilai: adaEsai ? null : nilaiAkhir });
});

// Dosen lihat semua submisi + beri nilai esai
router.get('/:id/submisi', allowRoles('dosen', 'admin'), (req, res) => {
  const rows = db.prepare(`
    SELECT sk.*, u.nama, u.nim_nip FROM submisi_kuis sk JOIN users u ON u.id = sk.mahasiswa_id
    WHERE sk.kuis_id=? ORDER BY sk.mulai_pada DESC`).all(req.params.id);
  res.json({ submisi: rows });
});

router.get('/submisi/:submisiId/jawaban', allowRoles('dosen', 'admin'), (req, res) => {
  const rows = db.prepare(`
    SELECT js.*, s.pertanyaan, s.tipe, s.bobot, s.jawaban_benar FROM jawaban_soal js
    JOIN soal s ON s.id = js.soal_id WHERE js.submisi_id=?`).all(req.params.submisiId);
  res.json({ jawaban: rows });
});

// Dosen menilai jawaban esai satu per satu
router.put('/jawaban/:jawabanId/nilai', allowRoles('dosen', 'admin'), (req, res) => {
  const { skor } = req.body;
  db.prepare('UPDATE jawaban_soal SET skor=? WHERE id=?').run(skor, req.params.jawabanId);
  const jwb = db.prepare('SELECT submisi_id FROM jawaban_soal WHERE id=?').get(req.params.jawabanId);
  // Hitung ulang nilai akhir submisi
  const rows = db.prepare(`SELECT js.skor, s.bobot FROM jawaban_soal js JOIN soal s ON s.id=js.soal_id WHERE js.submisi_id=?`).all(jwb.submisi_id);
  const totalBobot = rows.reduce((a, r) => a + r.bobot, 0);
  const totalSkor = rows.reduce((a, r) => a + (r.skor || 0), 0);
  const belumDinilai = rows.some(r => r.skor === null || r.skor === undefined);
  const nilaiAkhir = totalBobot > 0 ? Math.round((totalSkor / totalBobot) * 100) : null;
  db.prepare('UPDATE submisi_kuis SET nilai=?, status=? WHERE id=?')
    .run(nilaiAkhir, belumDinilai ? 'selesai' : 'dinilai', jwb.submisi_id);
  res.json({ message: 'Nilai esai tersimpan.' });
});

module.exports = router;
