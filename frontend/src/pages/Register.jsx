import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nama: '', email: '', password: '', role: 'mahasiswa', nim_nip: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registrasi gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-md panel p-8">
        <h2 className="font-serif text-2xl text-navy font-semibold mb-1">Buat akun baru</h2>
        <p className="text-sm text-muted mb-6">Daftar sebagai dosen atau mahasiswa.</p>

        {error && <div className="mb-4 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setForm({ ...form, role: 'mahasiswa' })}
              className={`py-2 rounded-lg text-sm font-semibold border ${form.role === 'mahasiswa' ? 'bg-navy text-white border-navy' : 'border-line text-muted'}`}>
              Mahasiswa
            </button>
            <button type="button" onClick={() => setForm({ ...form, role: 'dosen' })}
              className={`py-2 rounded-lg text-sm font-semibold border ${form.role === 'dosen' ? 'bg-navy text-white border-navy' : 'border-line text-muted'}`}>
              Dosen
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Nama lengkap</label>
            <input required className="input-field" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">{form.role === 'dosen' ? 'NIP' : 'NIM'}</label>
            <input className="input-field" value={form.nim_nip} onChange={(e) => setForm({ ...form, nim_nip: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Email</label>
            <input type="email" required className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Kata sandi</label>
            <input type="password" required minLength={6} className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p className="text-sm text-muted mt-6">
          Sudah punya akun? <Link to="/login" className="text-navy font-semibold hover:underline">Masuk</Link>
        </p>
      </div>
    </div>
  );
}
