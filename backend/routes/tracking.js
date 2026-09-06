const express = require('express');
const db = require('../db');
const { authRequired, allowRoles } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

// Rekap per kelas: keaktifan & nilai semua mahasiswa (untuk dosen/admin)
router.get('/kelas/:kelasId', allowRoles('dosen', 'admin'), (req, res) => {
  const kelasId = req.params.kelasId;
  const mahasiswa = db.prepare(`
    SELECT u.id, u.nama, u.nim_nip FROM enrolments e JOIN users u ON u.id=e.mahasiswa_id
    WHERE e.kelas_id=? ORDER BY u.nama ASC`).all(kelasId);

  const totalPertemuan = db.prepare('SELECT COUNT(*) as n FROM pertemuan WHERE kelas_id=?').get(kelasId).n;
  const totalMateri = db.prepare('SELECT COUNT(*) as n FROM materi WHERE kelas_id=?').get(kelasId).n;

  const laporan = mahasiswa.map(m => {
    const hadir = db.prepare(`
      SELECT COUNT(*) as n FROM presensi p JOIN pertemuan pt ON pt.id=p.pertemuan_id
      WHERE pt.kelas_id=? AND p.mahasiswa_id=? AND p.status='hadir'`).get(kelasId, m.id).n;

    const materiDibaca = db.prepare(`
      SELECT COUNT(*) as n FROM materi_views v JOIN materi mt ON mt.id=v.materi_id
      WHERE mt.kelas_id=? AND v.mahasiswa_id=?`).get(kelasId, m.id).n;

    const forumPost = db.prepare(`
      SELECT COUNT(*) as n FROM forum_balasan b JOIN forum_topik t ON t.id=b.topik_id
      WHERE t.kelas_id=? AND b.dibuat_oleh=?`).get(kelasId, m.id).n
      + db.prepare('SELECT COUNT(*) as n FROM forum_topik WHERE kelas_id=? AND dibuat_oleh=?').get(kelasId, m.id).n;

    const nilaiRows = db.prepare(`
      SELECT sk.nilai FROM submisi_kuis sk JOIN kuis k ON k.id=sk.kuis_id
      WHERE k.kelas_id=? AND sk.mahasiswa_id=? AND sk.nilai IS NOT NULL`).all(kelasId, m.id);
    const rataNilai = nilaiRows.length ? Math.round(nilaiRows.reduce((a, r) => a + r.nilai, 0) / nilaiRows.length) : null;

    return {
      mahasiswa: m,
      kehadiran: { hadir, total: totalPertemuan, persen: totalPertemuan ? Math.round((hadir / totalPertemuan) * 100) : 0 },
      materi_dibaca: { dibaca: materiDibaca, total: totalMateri },
      forum_post: forumPost,
      rata_nilai_kuis: rataNilai,
      jumlah_kuis_dinilai: nilaiRows.length
    };
  });

  res.json({ laporan, ringkasan: { total_pertemuan: totalPertemuan, total_materi: totalMateri, total_mahasiswa: mahasiswa.length } });
});

// Laporan pribadi mahasiswa untuk satu kelas
router.get('/kelas/:kelasId/saya', allowRoles('mahasiswa'), (req, res) => {
  const kelasId = req.params.kelasId;
  const totalPertemuan = db.prepare('SELECT COUNT(*) as n FROM pertemuan WHERE kelas_id=?').get(kelasId).n;
  const hadir = db.prepare(`
    SELECT COUNT(*) as n FROM presensi p JOIN pertemuan pt ON pt.id=p.pertemuan_id
    WHERE pt.kelas_id=? AND p.mahasiswa_id=? AND p.status='hadir'`).get(kelasId, req.user.id).n;
  const totalMateri = db.prepare('SELECT COUNT(*) as n FROM materi WHERE kelas_id=?').get(kelasId).n;
  const materiDibaca = db.prepare(`
    SELECT COUNT(*) as n FROM materi_views v JOIN materi mt ON mt.id=v.materi_id
    WHERE mt.kelas_id=? AND v.mahasiswa_id=?`).get(kelasId, req.user.id).n;
  const nilaiKuis = db.prepare(`
    SELECT k.judul, sk.nilai, sk.status FROM submisi_kuis sk JOIN kuis k ON k.id=sk.kuis_id
    WHERE k.kelas_id=? AND sk.mahasiswa_id=?`).all(kelasId, req.user.id);

  res.json({
    kehadiran: { hadir, total: totalPertemuan, persen: totalPertemuan ? Math.round((hadir / totalPertemuan) * 100) : 0 },
    materi: { dibaca: materiDibaca, total: totalMateri },
    nilai_kuis: nilaiKuis
  });
});

// Ringkasan lintas kelas untuk dashboard dosen
router.get('/ringkasan-dosen', allowRoles('dosen', 'admin'), (req, res) => {
  const kelasIds = db.prepare('SELECT id FROM kelas WHERE dosen_id=?').all(req.user.id).map(k => k.id);
  if (!kelasIds.length) return res.json({ total_kelas: 0, total_mahasiswa: 0, total_kuis: 0, total_materi: 0 });
  const placeholders = kelasIds.map(() => '?').join(',');
  const totalMahasiswa = db.prepare(`SELECT COUNT(DISTINCT mahasiswa_id) as n FROM enrolments WHERE kelas_id IN (${placeholders})`).get(...kelasIds).n;
  const totalKuis = db.prepare(`SELECT COUNT(*) as n FROM kuis WHERE kelas_id IN (${placeholders})`).get(...kelasIds).n;
  const totalMateri = db.prepare(`SELECT COUNT(*) as n FROM materi WHERE kelas_id IN (${placeholders})`).get(...kelasIds).n;
  res.json({ total_kelas: kelasIds.length, total_mahasiswa: totalMahasiswa, total_kuis: totalKuis, total_materi: totalMateri });
});

// Ringkasan lintas kelas untuk dashboard mahasiswa
router.get('/ringkasan-mahasiswa', allowRoles('mahasiswa'), (req, res) => {
  const kelasIds = db.prepare('SELECT kelas_id FROM enrolments WHERE mahasiswa_id=?').all(req.user.id).map(k => k.kelas_id);
  const totalKelas = kelasIds.length;
  let totalKuisSelesai = 0, rataNilai = null;
  if (kelasIds.length) {
    const placeholders = kelasIds.map(() => '?').join(',');
    totalKuisSelesai = db.prepare(`SELECT COUNT(*) as n FROM submisi_kuis WHERE mahasiswa_id=? AND status='dinilai'`).get(req.user.id).n;
    const rows = db.prepare(`SELECT nilai FROM submisi_kuis WHERE mahasiswa_id=? AND nilai IS NOT NULL`).all(req.user.id);
    rataNilai = rows.length ? Math.round(rows.reduce((a, r) => a + r.nilai, 0) / rows.length) : null;
  }
  res.json({ total_kelas: totalKelas, total_kuis_selesai: totalKuisSelesai, rata_nilai: rataNilai });
});

module.exports = router;
