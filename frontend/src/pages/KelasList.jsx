import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function KelasList() {
  const { user } = useAuth();
  const [kelas, setKelas] = useState([]);
  const [tersedia, setTersedia] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nama: '', kode: '', deskripsi: '', sks: 3 });
  const [error, setError] = useState('');

  function load() {
    api.get('/kelas').then((r) => setKelas(r.data.kelas));
    if (user.role === 'mahasiswa') api.get('/kelas/tersedia').then((r) => setTersedia(r.data.kelas));
  }
  useEffect(load, [user.role]);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/kelas', form);
      setShowForm(false);
      setForm({ nama: '', kode: '', deskripsi: '', sks: 3 });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat kelas.');
    }
  }

  async function gabungKelas(id) {
    try {
      await api.post(`/kelas/${id}/gabung`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal bergabung.');
    }
  }

  return (
    <Layout title="Kelas Saya">
      {user.role === 'dosen' && (
        <div className="mb-6">
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Batal' : '+ Buat Kelas Baru'}
          </button>
          {showForm && (
            <form onSubmit={handleCreate} className="panel p-5 mt-4 grid sm:grid-cols-2 gap-4">
              {error && <p className="sm:col-span-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Nama Kelas</label>
                <input required className="input-field" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Kode Kelas</label>
                <input required className="input-field" placeholder="mis. IF-3301" value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-ink mb-1">Deskripsi</label>
                <textarea className="input-field" rows={3} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">SKS</label>
                <input type="number" min={1} max={6} className="input-field" value={form.sks} onChange={(e) => setForm({ ...form, sks: Number(e.target.value) })} />
              </div>
              <div className="sm:col-span-2">
                <button className="btn-primary">Simpan Kelas</button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kelas.map((k) => (
          <Link key={k.id} to={`/kelas/${k.id}`} className="panel p-5 hover:shadow-sm hover:border-navy/30 transition">
            <div className="flex items-start justify-between mb-3">
              <span className="badge bg-navy text-white">{k.kode}</span>
              <span className="text-xs text-muted">{k.sks} SKS</span>
            </div>
            <h3 className="font-serif text-lg text-navy font-semibold mb-1">{k.nama}</h3>
            <p className="text-sm text-muted mb-3 line-clamp-2">{k.deskripsi || 'Tidak ada deskripsi.'}</p>
            <div className="flex items-center justify-between text-xs text-muted pt-3 border-t border-line">
              <span>{k.nama_dosen}</span>
              <span>{k.jumlah_mahasiswa} mahasiswa</span>
            </div>
          </Link>
        ))}
        {kelas.length === 0 && <p className="text-sm text-muted col-span-full py-8 text-center">Belum ada kelas.</p>}
      </div>

      {user.role === 'mahasiswa' && tersedia.length > 0 && (
        <div className="mt-10">
          <h3 className="font-serif text-lg text-navy font-semibold mb-4">Kelas Tersedia untuk Diikuti</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tersedia.map((k) => (
              <div key={k.id} className="panel p-5">
                <span className="badge bg-gold/15 text-gold-dark mb-3">{k.kode}</span>
                <h4 className="font-serif text-base text-navy font-semibold mb-1">{k.nama}</h4>
                <p className="text-xs text-muted mb-4">{k.nama_dosen}</p>
                <button onClick={() => gabungKelas(k.id)} className="btn-secondary w-full text-sm">Gabung Kelas</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
