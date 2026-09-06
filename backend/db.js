const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ==================== SCHEMA ====================
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','dosen','mahasiswa')),
  nim_nip TEXT,
  avatar TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS kelas (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  kode TEXT UNIQUE NOT NULL,
  deskripsi TEXT,
  dosen_id TEXT NOT NULL,
  sks INTEGER DEFAULT 3,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(dosen_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS enrolments (
  id TEXT PRIMARY KEY,
  kelas_id TEXT NOT NULL,
  mahasiswa_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(kelas_id, mahasiswa_id),
  FOREIGN KEY(kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
  FOREIGN KEY(mahasiswa_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS materi (
  id TEXT PRIMARY KEY,
  kelas_id TEXT NOT NULL,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  tipe TEXT NOT NULL CHECK(tipe IN ('pdf','link','video')),
  file_path TEXT,
  url TEXT,
  uploaded_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS materi_views (
  id TEXT PRIMARY KEY,
  materi_id TEXT NOT NULL,
  mahasiswa_id TEXT NOT NULL,
  viewed_at TEXT DEFAULT (datetime('now')),
  UNIQUE(materi_id, mahasiswa_id),
  FOREIGN KEY(materi_id) REFERENCES materi(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pertemuan (
  id TEXT PRIMARY KEY,
  kelas_id TEXT NOT NULL,
  judul TEXT NOT NULL,
  tipe TEXT NOT NULL CHECK(tipe IN ('sinkron','asinkron')),
  tanggal TEXT NOT NULL,
  jam_mulai TEXT,
  jam_selesai TEXT,
  link_meeting TEXT,
  catatan TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS presensi (
  id TEXT PRIMARY KEY,
  pertemuan_id TEXT NOT NULL,
  mahasiswa_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('hadir','izin','sakit','alpa')) DEFAULT 'hadir',
  waktu TEXT DEFAULT (datetime('now')),
  UNIQUE(pertemuan_id, mahasiswa_id),
  FOREIGN KEY(pertemuan_id) REFERENCES pertemuan(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kuis (
  id TEXT PRIMARY KEY,
  kelas_id TEXT NOT NULL,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  tipe TEXT NOT NULL CHECK(tipe IN ('pilihan_ganda','esai','campuran')),
  durasi_menit INTEGER DEFAULT 60,
  buka_pada TEXT,
  tutup_pada TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS soal (
  id TEXT PRIMARY KEY,
  kuis_id TEXT NOT NULL,
  pertanyaan TEXT NOT NULL,
  tipe TEXT NOT NULL CHECK(tipe IN ('pilihan_ganda','esai')),
  pilihan_a TEXT, pilihan_b TEXT, pilihan_c TEXT, pilihan_d TEXT,
  jawaban_benar TEXT,
  bobot INTEGER DEFAULT 10,
  urutan INTEGER DEFAULT 0,
  FOREIGN KEY(kuis_id) REFERENCES kuis(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS submisi_kuis (
  id TEXT PRIMARY KEY,
  kuis_id TEXT NOT NULL,
  mahasiswa_id TEXT NOT NULL,
  mulai_pada TEXT DEFAULT (datetime('now')),
  selesai_pada TEXT,
  nilai REAL,
  status TEXT DEFAULT 'berlangsung' CHECK(status IN ('berlangsung','selesai','dinilai')),
  UNIQUE(kuis_id, mahasiswa_id),
  FOREIGN KEY(kuis_id) REFERENCES kuis(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jawaban_soal (
  id TEXT PRIMARY KEY,
  submisi_id TEXT NOT NULL,
  soal_id TEXT NOT NULL,
  jawaban TEXT,
  skor REAL,
  UNIQUE(submisi_id, soal_id),
  FOREIGN KEY(submisi_id) REFERENCES submisi_kuis(id) ON DELETE CASCADE,
  FOREIGN KEY(soal_id) REFERENCES soal(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS forum_topik (
  id TEXT PRIMARY KEY,
  kelas_id TEXT NOT NULL,
  judul TEXT NOT NULL,
  isi TEXT,
  dibuat_oleh TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS forum_balasan (
  id TEXT PRIMARY KEY,
  topik_id TEXT NOT NULL,
  isi TEXT NOT NULL,
  dibuat_oleh TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(topik_id) REFERENCES forum_topik(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_pesan (
  id TEXT PRIMARY KEY,
  kelas_id TEXT NOT NULL,
  pengirim_id TEXT NOT NULL,
  isi TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kelompok (
  id TEXT PRIMARY KEY,
  kelas_id TEXT NOT NULL,
  nama TEXT NOT NULL,
  kapasitas INTEGER DEFAULT 5,
  dibuat_oleh TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kelompok_anggota (
  id TEXT PRIMARY KEY,
  kelompok_id TEXT NOT NULL,
  mahasiswa_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(kelompok_id, mahasiswa_id),
  FOREIGN KEY(kelompok_id) REFERENCES kelompok(id) ON DELETE CASCADE
);
`);

module.exports = db;
