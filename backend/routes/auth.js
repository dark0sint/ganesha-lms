const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, nama: user.nama, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// Registrasi akun baru (mahasiswa/dosen)
router.post('/register', (req, res) => {
  const { nama, email, password, role, nim_nip } = req.body;
  if (!nama || !email || !password || !role) {
    return res.status(400).json({ message: 'Nama, email, password, dan role wajib diisi.' });
  }
  if (!['dosen', 'mahasiswa'].includes(role)) {
    return res.status(400).json({ message: 'Role hanya boleh dosen atau mahasiswa.' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ message: 'Email sudah terdaftar.' });

  const id = uuid();
  const hashed = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO users (id, nama, email, password, role, nim_nip) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, nama, email, hashed, role, nim_nip || null);

  const user = { id, nama, email, role };
  res.status(201).json({ user, token: signToken(user) });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Email atau kata sandi salah.' });
  }
  const publicUser = { id: user.id, nama: user.nama, email: user.email, role: user.role, nim_nip: user.nim_nip };
  res.json({ user: publicUser, token: signToken(publicUser) });
});

// Profil pengguna saat ini
router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT id, nama, email, role, nim_nip, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
  res.json({ user });
});

module.exports = router;
