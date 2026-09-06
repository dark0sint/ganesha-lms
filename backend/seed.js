require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const db = require('./db');

console.log('Menjalankan seeding data contoh...');

const hash = (p) => bcrypt.hashSync(p, 10);

const adminId = uuid();
const dosenId = uuid();
const mhs1 = uuid();
const mhs2 = uuid();
const mhs3 = uuid();

const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, nama, email, password, role, nim_nip) VALUES (?,?,?,?,?,?)');
insertUser.run(adminId, 'Admin Ganesha', 'admin@ganesha.ac.id', hash('admin123'), 'admin', 'ADM001');
insertUser.run(dosenId, 'Dr. Sinta Ganesha', 'dosen@ganesha.ac.id', hash('dosen123'), 'dosen', 'NIP001');
insertUser.run(mhs1, 'Budi Santoso', 'budi@ganesha.ac.id', hash('mhs123'), 'mahasiswa', '2201001');
insertUser.run(mhs2, 'Ani Wijaya', 'ani@ganesha.ac.id', hash('mhs123'), 'mahasiswa', '2201002');
insertUser.run(mhs3, 'Citra Dewi', 'citra@ganesha.ac.id', hash('mhs123'), 'mahasiswa', '2201003');

const kelasId = uuid();
db.prepare('INSERT OR IGNORE INTO kelas (id, nama, kode, deskripsi, dosen_id, sks) VALUES (?,?,?,?,?,?)')
  .run(kelasId, 'Pemrograman Web Lanjut', 'IF-3301', 'Membahas pengembangan aplikasi web modern full-stack.', dosenId, 3);

[mhs1, mhs2, mhs3].forEach(m => {
  db.prepare('INSERT OR IGNORE INTO enrolments (id, kelas_id, mahasiswa_id) VALUES (?,?,?)').run(uuid(), kelasId, m);
});

db.prepare('INSERT OR IGNORE INTO materi (id, kelas_id, judul, deskripsi, tipe, url, uploaded_by) VALUES (?,?,?,?,?,?,?)')
  .run(uuid(), kelasId, 'Pengantar React & Komponen', 'Video pengantar konsep komponen di React.', 'video', 'https://www.youtube.com/watch?v=dGcsHMXbSOA', dosenId);
db.prepare('INSERT OR IGNORE INTO materi (id, kelas_id, judul, deskripsi, tipe, url, uploaded_by) VALUES (?,?,?,?,?,?,?)')
  .run(uuid(), kelasId, 'Dokumentasi Resmi Express.js', 'Referensi resmi untuk membangun REST API.', 'link', 'https://expressjs.com/', dosenId);

const pertemuanId = uuid();
db.prepare(`INSERT OR IGNORE INTO pertemuan (id, kelas_id, judul, tipe, tanggal, jam_mulai, jam_selesai, link_meeting, catatan)
  VALUES (?,?,?,?,?,?,?,?,?)`).run(pertemuanId, kelasId, 'Pertemuan 1: Kick-off & Arsitektur', 'sinkron', '2026-09-10', '09:00', '11:00', 'https://meet.google.com/contoh-link', 'Bawa laptop, install Node.js versi LTS.');

const kuisId = uuid();
db.prepare(`INSERT OR IGNORE INTO kuis (id, kelas_id, judul, deskripsi, tipe, durasi_menit, buka_pada, tutup_pada, created_by)
  VALUES (?,?,?,?,?,?,?,?,?)`).run(kuisId, kelasId, 'Kuis Fundamental REST API', 'Menguji pemahaman dasar REST API dan HTTP method.', 'pilihan_ganda', 30, '2026-09-08 00:00', '2026-09-15 23:59', dosenId);

const insertSoal = db.prepare(`INSERT OR IGNORE INTO soal (id, kuis_id, pertanyaan, tipe, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawaban_benar, bobot, urutan) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
insertSoal.run(uuid(), kuisId, 'Method HTTP yang tepat untuk mengambil data adalah?', 'pilihan_ganda', 'GET', 'POST', 'DELETE', 'PUT', 'A', 50, 0);
insertSoal.run(uuid(), kuisId, 'Kode status HTTP untuk "berhasil dibuat" adalah?', 'pilihan_ganda', '200', '201', '404', '500', 'B', 50, 1);

db.prepare('INSERT OR IGNORE INTO kelompok (id, kelas_id, nama, kapasitas, dibuat_oleh) VALUES (?,?,?,?,?)')
  .run(uuid(), kelasId, 'Kelompok 1 - Proyek Akhir', 4, dosenId);

console.log('Seed selesai. Akun contoh:');
console.log('Admin    : admin@ganesha.ac.id / admin123');
console.log('Dosen    : dosen@ganesha.ac.id / dosen123');
console.log('Mahasiswa: budi@ganesha.ac.id / mhs123 (juga ani@, citra@)');
