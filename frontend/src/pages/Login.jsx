import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal masuk. Periksa kembali email dan kata sandi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-navy text-white p-12 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-gold/10" />
        <div className="absolute -left-16 bottom-0 w-72 h-72 rounded-full bg-gold/5" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold flex items-center justify-center font-serif font-bold text-navy text-xl">G</div>
          <span className="font-serif text-xl font-semibold">Ganesha LMS</span>
        </div>
        <div className="relative max-w-md">
          <p className="font-serif text-3xl leading-snug mb-4">
            "Belajar bukan sekadar hadir di kelas, tapi tumbuh dari setiap materi, diskusi, dan tantangan yang dilalui."
          </p>
          <p className="text-white/60 text-sm">Platform pembelajaran daring terpadu untuk dosen dan mahasiswa Ganesha Education.</p>
        </div>
        <p className="relative text-xs text-white/40">© 2026 Ganesha Education</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 bg-canvas">
        <div className="w-full max-w-sm">
          <h2 className="font-serif text-2xl text-navy font-semibold mb-1">Masuk ke akun Anda</h2>
          <p className="text-sm text-muted mb-8">Gunakan email dan kata sandi yang terdaftar.</p>

          {error && <div className="mb-4 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Email</label>
              <input type="email" required className="input-field" placeholder="nama@ganesha.ac.id"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Kata sandi</label>
              <input type="password" required className="input-field" placeholder="••••••••"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <p className="text-sm text-muted mt-6">
            Belum punya akun? <Link to="/register" className="text-navy font-semibold hover:underline">Daftar di sini</Link>
          </p>

          <div className="mt-8 p-4 rounded-lg border border-line bg-white text-xs text-muted space-y-1">
            <p className="font-semibold text-ink">Akun contoh (setelah menjalankan seed):</p>
            <p>Dosen: dosen@ganesha.ac.id / dosen123</p>
            <p>Mahasiswa: budi@ganesha.ac.id / mhs123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
