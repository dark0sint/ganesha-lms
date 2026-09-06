# Ganesha LMS — Learning Management System

Aplikasi dashboard manajemen LMS untuk **Ganesha Education**, dibangun dengan **React** (frontend) dan **Node.js/Express** (backend), database **SQLite** (file-based, tanpa perlu instalasi server database terpisah).

## Fitur

| Fitur | Deskripsi |
|---|---|
| **Manajemen Materi** | Dosen mengunggah modul PDF, tautan, atau video. Mahasiswa membaca & sistem mencatat siapa saja yang sudah membaca. |
| **Kelas & Pertemuan Online** | Jadwal pertemuan sinkron (live, dengan link meeting) maupun asinkron (mandiri), lengkap presensi. |
| **Kuis & Ujian Online** | Soal pilihan ganda (dinilai otomatis) dan esai (dinilai manual oleh dosen). |
| **Forum Diskusi & Chat** | Forum topik per kelas + chat real-time (polling) antar dosen dan mahasiswa. |
| **Pengelolaan Kelompok** | Mahasiswa dapat membentuk/bergabung ke kelompok belajar secara mandiri (self-select), dengan batas kapasitas. |
| **Pelacakan & Laporan** | Rekap kehadiran, materi dibaca, keaktifan forum, dan nilai kuis — bisa diekspor ke CSV. |

Role pengguna: **Admin**, **Dosen**, **Mahasiswa**.

---

## Struktur Folder

```
ganesha-lms/
├── backend/          # Node.js + Express REST API + SQLite
│   ├── routes/       # auth, kelas, materi, kuis, forum, kelompok, tracking
│   ├── middleware/   # autentikasi JWT & otorisasi role
│   ├── uploads/       # penyimpanan file PDF materi
│   ├── db.js          # koneksi & skema database
│   ├── seed.js         # data contoh untuk demo
│   └── server.js
└── frontend/          # React (Vite) + Tailwind CSS
    └── src/
        ├── pages/      # Login, Dashboard, Kelas, Kuis, Forum, Kelompok, Tracking
        ├── components/ # Sidebar, Topbar, Layout
        └── context/    # AuthContext (JWT)
```

---

## Instalasi Lokal (Development)

### Prasyarat
- Node.js versi 18 LTS atau lebih baru
- npm

### 1. Backend

```bash
cd backend
cp .env.example .env      # sesuaikan JWT_SECRET dan lainnya bila perlu
npm install
npm run seed               # opsional: isi data contoh (akun demo, kelas, dll.)
npm run dev                 # jalankan dengan nodemon di http://localhost:5000
```

Akun contoh setelah `npm run seed`:
| Role | Email | Password |
|---|---|---|
| Admin | admin@ganesha.ac.id | admin123 |
| Dosen | dosen@ganesha.ac.id | dosen123 |
| Mahasiswa | budi@ganesha.ac.id / ani@ganesha.ac.id / citra@ganesha.ac.id | mhs123 |

### 2. Frontend

Buka terminal baru:

```bash
cd frontend
npm install
npm run dev                 # jalankan di http://localhost:5173
```

Frontend development sudah dikonfigurasi proxy ke `http://localhost:5000` (lihat `vite.config.js`), jadi tidak perlu ubah apa pun untuk mulai development.

---

## Deployment ke Server (Production)

Aplikasi ini didesain agar **backend menyajikan hasil build frontend**, sehingga cukup **1 proses Node.js** yang perlu dijalankan di server.

### Langkah-langkah

**1. Build frontend**
```bash
cd frontend
npm install
npm run build          # menghasilkan folder frontend/dist
```

**2. Siapkan backend**
```bash
cd ../backend
npm install --production
cp .env.example .env
```
Edit `.env` di server:
```
PORT=5000
JWT_SECRET=ganti-dengan-string-acak-yang-panjang-dan-rahasia
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=https://domain-anda.com
```

**3. (Opsional) isi data awal**
```bash
npm run seed
```

**4. Jalankan server**
```bash
npm start
```
`server.js` otomatis menyajikan file dari `frontend/dist` di root domain, dan API di `/api/*`. Jadi cukup akses `https://domain-anda.com` — tidak perlu server web terpisah untuk frontend.

**5. Jalankan sebagai service permanen (disarankan: PM2)**
```bash
npm install -g pm2
pm2 start server.js --name ganesha-lms
pm2 save
pm2 startup
```

**6. Reverse proxy dengan Nginx (opsional tapi disarankan untuk HTTPS)**
```nginx
server {
    listen 80;
    server_name domain-anda.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```
Lalu aktifkan HTTPS dengan Certbot (`certbot --nginx`).

### Catatan Database
Database SQLite tersimpan sebagai file `backend/data.sqlite`. Untuk backup, cukup salin file ini secara berkala (`cron` + `cp` atau `sqlite3 data.sqlite ".backup backup.sqlite"`). Untuk skala pengguna yang sangat besar, skema ini juga siap dimigrasikan ke PostgreSQL/MySQL karena struktur tabel relasionalnya standar.

### Batas Upload File
Materi PDF dibatasi 25MB per file (bisa diubah di `backend/routes/materi.js`, variabel `limits.fileSize` pada konfigurasi `multer`). Pastikan juga `client_max_body_size` di Nginx disesuaikan bila perlu.

---

## Teknologi yang Digunakan
- **Frontend:** React 18, React Router, Tailwind CSS, Axios, Vite
- **Backend:** Node.js, Express, better-sqlite3, JWT (jsonwebtoken), bcryptjs, multer
- **Autentikasi:** JWT dengan role-based access control (admin/dosen/mahasiswa)
