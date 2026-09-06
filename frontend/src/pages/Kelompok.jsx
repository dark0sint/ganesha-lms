import { useEffect, useState } from 'react';
import api from '../api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Kelompok() {
  const { user } = useAuth();
  const [kelasList, setKelasList] = useState([]);
  const [kelasId, setKelasId] = useState('');
  const [kelompok, setKelompok] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nama: '', kapasitas: 5 });

  useEffect(() => {
    api.get('/kelas').then((r) => {
      setKelasList(r.data.kelas);
      if (r.data.kelas.length) setKelasId(r.data.kelas[0].id);
    });
  }, []);

  function load() { if (kelasId) api.get(`/kelompok/kelas/${kelasId}`).then((r) => setKelompok(r.data.kelompok)); }
  useEffect(load, [kelasId]);

  async function buatKelompok(e) {
    e.preventDefault();
    await api.post(`/kelompok/kelas/${kelasId}`, form);
    setForm({ nama: '', kapasitas: 5 });
    setShowForm(false);
    load();
  }

  async function gabung(id) {
    try { await api.post(`/kelompok/${id}/gabung`); load(); }
    catch (err) { alert(err.response?.data?.message || 'Gagal bergabung.'); }
  }

  async function keluar(id) {
    await api.delete(`/kelompok/${id}/keluar`);
    load();
  }

  const sayaSudahDiKelompok = kelompok.some((k) => k.anggota.some((a) => a.id === user.id));

  return (
    <Layout title="Pengelolaan Kelompok Belajar">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <select className="input-field w-auto" value={kelasId} onChange={(e) => setKelasId(e.target.value)}>
          {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
        </select>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Batal' : '+ Buka Kelompok Baru'}</button>
      </div>

      {showForm && (
        <form onSubmit={buatKelompok} className="panel p-5 mb-6 grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-ink mb-1">Nama Kelompok</label>
            <input required className="input-field" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Kapasitas</label>
            <input type="number" min={1} max={20} className="input-field" value={form.kapasitas} onChange={(e) => setForm({ ...form, kapasitas: Number(e.target.value) })} />
          </div>
          <div className="sm:col-span-3"><button className="btn-primary">Simpan</button></div>
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kelompok.map((k) => {
          const penuh = k.terisi >= k.kapasitas;
          const sayaAnggota = k.anggota.some((a) => a.id === user.id);
          return (
            <div key={k.id} className="panel p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-serif font-semibold text-navy">{k.nama}</h4>
                <span className={`badge ${penuh ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{k.terisi}/{k.kapasitas}</span>
              </div>
              <ul className="text-sm text-ink space-y-1 mb-4 min-h-[40px]">
                {k.anggota.map((a) => <li key={a.id}>• {a.nama}</li>)}
                {k.anggota.length === 0 && <li className="text-muted">Belum ada anggota.</li>}
              </ul>
              {user.role === 'mahasiswa' && (
                sayaAnggota ? (
                  <button onClick={() => keluar(k.id)} className="btn-secondary w-full text-sm">Keluar dari Kelompok</button>
                ) : (
                  <button disabled={penuh || sayaSudahDiKelompok} onClick={() => gabung(k.id)} className="btn-primary w-full text-sm">
                    {penuh ? 'Kelompok Penuh' : sayaSudahDiKelompok ? 'Sudah di kelompok lain' : 'Gabung Kelompok'}
                  </button>
                )
              )}
            </div>
          );
        })}
        {kelompok.length === 0 && <p className="text-sm text-muted col-span-full py-8 text-center">Belum ada kelompok dibuka untuk kelas ini.</p>}
      </div>
    </Layout>
  );
}
