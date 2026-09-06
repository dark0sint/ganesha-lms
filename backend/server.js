require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', waktu: new Date().toISOString() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/kelas', require('./routes/kelas'));
app.use('/api/materi', require('./routes/materi'));
app.use('/api/kuis', require('./routes/kuis'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/kelompok', require('./routes/kelompok'));
app.use('/api/tracking', require('./routes/tracking'));

// Sajikan build frontend jika ada (untuk deploy single-server)
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => { if (err) next(); });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Terjadi kesalahan pada server.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Ganesha LMS API berjalan di port ${PORT}`));
