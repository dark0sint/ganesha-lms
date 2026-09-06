import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const TABS = ['Materi', 'Pertemuan', 'Kuis', 'Anggota'];

export default function KelasDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [kelas, setKelas] = useState(null);
  const [anggota, setAnggota] = useState([]);
  const [tab, setTab] = useState('Materi');

  function loadKelas() {
    api.get(`/kelas/${id}`).then((r) => { setKelas(r.data.kelas); setAnggota(r.data.anggota); });
  }
  useEffect(loadKelas, [id]);

  if (!kelas) return <Layout title="Memuat..."><p className="text-muted text-sm">Memuat detail kelas...</p></Layout>;

  return (
    <Layout title={kelas.nama}>
      <div className="panel p-5 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="badge bg-navy text-white mb-2">{kelas.kode}</span>
          <p className="text-sm text-muted max-w-xl">{kelas.deskripsi}</p>
        </div>
        <div className="text-right text-sm text-muted">
          <p>Dosen: <span className="font-semibold text-ink">{kelas.nama_dosen}</span></p>
          <p>{anggota.length} mahasiswa terdaftar · {kelas.sks} SKS</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-line overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px ${tab === t ? 'border-gold text-navy' : 'border-transparent text-muted hover:text-navy'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Materi' && <TabMateri kelasId={id} role={user.role} />}
      {tab === 'Pertemuan' && <TabPertemuan kelasId={id} role={user.role} />}
      {tab === 'Kuis' && <TabKuis kelasId={id} role={user.role} />}
      {tab === 'Anggota' && <TabAnggota anggota={anggota} />}
    </Layout>
  );
}

// ==================== TAB MATERI ====================
function TabMateri({ kelasId, role }) {
  const [materi, setMateri] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ judul: '', deskripsi: '', tipe: 'pdf', url: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  function load() { api.get(`/materi/kelas/${kelasId}`).then((r) => setMateri(r.data.materi)); }
  useEffect(load, [kelasId]);

  async function handleUpload(e) {
    e.preventDefault();
    setError('');
    const fd = new FormData();
    fd.append('judul', form.judul);
    fd.append('deskripsi', form.deskripsi);
    fd.append('tipe', form.tipe);
    if (form.tipe === 'pdf' && file) fd.append('file', file);
    if (form.tipe !== 'pdf') fd.append('url', form.url);
    try {
      await api.post(`/materi/kelas/${kelasId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowForm(false);
      setForm({ judul: '', deskripsi: '', tipe: 'pdf', url: '' });
      setFile(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengunggah materi.');
    }
  }

  async function bacaMateri(m) {
    if (role === 'mahasiswa') api.post(`/materi/${m.id}/dibaca`).catch(() => {});
    const href = m.tipe === 'pdf' ? m.file_path : m.url;
    window.open(href, '_blank');
  }

  async function hapusMateri(idMateri) {
    if (!confirm('Hapus materi ini?')) return;
    await api.delete(`/materi/${idMateri}`);
    load();
  }

  const tipeLabel = { pdf: 'Modul PDF', link: 'Tautan', video: 'Video' };
  const tipeColor = { pdf: '#B3452C', link: '#1B2A4A', video: '#2E7D5B' };

  return (
    <div>
      {role === 'dosen' && (
        <div className="mb-5">
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Batal' : '+ Unggah Materi'}</button>
          {showForm && (
            <form onSubmit={handleUpload} className="panel p-5 mt-4 grid sm:grid-cols-2 gap-4">
              {error && <p className="sm:col-span-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Judul</label>
                <input required className="input-field" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Tipe Materi</label>
                <select className="input-field" value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })}>
                  <option value="pdf">Modul PDF</option>
                  <option value="link">Tautan</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-ink mb-1">Deskripsi</label>
                <textarea className="input-field" rows={2} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
              </div>
              {form.tipe === 'pdf' ? (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1">File PDF (maks. 25MB)</label>
                  <input required type="file" accept="application/pdf" className="input-field" onChange={(e) => setFile(e.target.files[0])} />
                </div>
              ) : (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1">URL {form.tipe === 'video' ? 'Video' : 'Tautan'}</label>
                  <input required type="url" className="input-field" placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
                </div>
              )}
              <div className="sm:col-span-2"><button className="btn-primary">Unggah</button></div>
            </form>
          )}
        </div>
      )}

      <div className="space-y-3">
        {materi.map((m) => (
          <div key={m.id} className="panel p-4 flex items-center justify-between accent-bar" style={{ '--accent': tipeColor[m.tipe] }}>
            <div className="cursor-pointer flex-1" onClick={() => bacaMateri(m)}>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge text-white" style={{ backgroundColor: tipeColor[m.tipe] }}>{tipeLabel[m.tipe]}</span>
                <p className="font-semibold text-ink text-sm">{m.judul}</p>
              </div>
              <p className="text-xs text-muted">{m.deskripsi}</p>
              <p className="text-[11px] text-muted mt-1">Oleh {m.pengunggah} · {role === 'dosen' ? `${m.jumlah_dibaca} mahasiswa telah membaca` : 'Klik untuk membuka'}</p>
            </div>
            {role === 'dosen' && (
              <button onClick={() => hapusMateri(m.id)} className="text-xs text-red-600 font-semibold ml-3">Hapus</button>
            )}
          </div>
        ))}
        {materi.length === 0 && <p className="text-sm text-muted py-8 text-center">Belum ada materi diunggah.</p>}
      </div>
    </div>
  );
}

// ==================== TAB PERTEMUAN ====================
function TabPertemuan({ kelasId, role }) {
  const [list, setList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ judul: '', tipe: 'sinkron', tanggal: '', jam_mulai: '', jam_selesai: '', link_meeting: '', catatan: '' });

  function load() { api.get(`/kelas/${kelasId}/pertemuan`).then((r) => setList(r.data.pertemuan)); }
  useEffect(load, [kelasId]);

  async function handleCreate(e) {
    e.preventDefault();
    await api.post(`/kelas/${kelasId}/pertemuan`, form);
    setShowForm(false);
    setForm({ judul: '', tipe: 'sinkron', tanggal: '', jam_mulai: '', jam_selesai: '', link_meeting: '', catatan: '' });
    load();
  }

  async function presensi(pid, status = 'hadir') {
    try {
      await api.post(`/kelas/pertemuan/${pid}/presensi`, { status });
      alert('Presensi tercatat: ' + status);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal presensi.');
    }
  }

  return (
    <div>
      {role === 'dosen' && (
        <div className="mb-5">
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Batal' : '+ Jadwalkan Pertemuan'}</button>
          {showForm && (
            <form onSubmit={handleCreate} className="panel p-5 mt-4 grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-ink mb-1">Judul Pertemuan</label>
                <input required className="input-field" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Tipe</label>
                <select className="input-field" value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })}>
                  <option value="sinkron">Sinkron (Live)</option>
                  <option value="asinkron">Asinkron (Mandiri)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Tanggal</label>
                <input required type="date" className="input-field" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
              </div>
              {form.tipe === 'sinkron' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Jam Mulai</label>
                    <input type="time" className="input-field" value={form.jam_mulai} onChange={(e) => setForm({ ...form, jam_mulai: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Jam Selesai</label>
                    <input type="time" className="input-field" value={form.jam_selesai} onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-ink mb-1">Link Meeting</label>
                    <input type="url" placeholder="https://meet.google.com/..." className="input-field" value={form.link_meeting} onChange={(e) => setForm({ ...form, link_meeting: e.target.value })} />
                  </div>
                </>
              )}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-ink mb-1">Catatan</label>
                <textarea className="input-field" rows={2} value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} />
              </div>
              <div className="sm:col-span-2"><button className="btn-primary">Simpan Pertemuan</button></div>
            </form>
          )}
        </div>
      )}

      <div className="space-y-3">
        {list.map((p) => (
          <div key={p.id} className="panel p-4 accent-bar" style={{ '--accent': p.tipe === 'sinkron' ? '#1B2A4A' : '#C9932E' }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`badge ${p.tipe === 'sinkron' ? 'bg-navy text-white' : 'bg-gold/15 text-gold-dark'}`}>{p.tipe === 'sinkron' ? 'Sinkron' : 'Asinkron'}</span>
                  <p className="font-semibold text-ink text-sm">{p.judul}</p>
                </div>
                <p className="text-xs text-muted">{p.tanggal} {p.jam_mulai && `· ${p.jam_mulai}-${p.jam_selesai}`}</p>
                {p.catatan && <p className="text-xs text-muted mt-1">{p.catatan}</p>}
                {p.link_meeting && (
                  <a href={p.link_meeting} target="_blank" rel="noreferrer" className="text-xs text-navy font-semibold hover:underline mt-1 inline-block">Buka Link Meeting →</a>
                )}
              </div>
              {role === 'mahasiswa' && (
                <button onClick={() => presensi(p.id)} className="btn-secondary text-xs whitespace-nowrap">Isi Presensi</button>
              )}
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-muted py-8 text-center">Belum ada pertemuan dijadwalkan.</p>}
      </div>
    </div>
  );
}

// ==================== TAB KUIS ====================
function TabKuis({ kelasId, role }) {
  const [list, setList] = useState([]);
  function load() { api.get(`/kuis/kelas/${kelasId}`).then((r) => setList(r.data.kuis)); }
  useEffect(load, [kelasId]);

  return (
    <div>
      {role === 'dosen' && (
        <Link to={`/kelas/${kelasId}/kuis/baru`} className="btn-primary inline-block mb-5">+ Buat Kuis Baru</Link>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        {list.map((k) => (
          <Link key={k.id} to={`/kuis/${k.id}`} className="panel p-4 hover:border-navy/30">
            <div className="flex items-center justify-between mb-2">
              <span className="badge bg-navy/10 text-navy capitalize">{k.tipe.replace('_', ' ')}</span>
              <span className="text-xs text-muted">{k.durasi_menit} menit</span>
            </div>
            <h4 className="font-serif font-semibold text-navy mb-1">{k.judul}</h4>
            <p className="text-xs text-muted mb-2">{k.deskripsi}</p>
            {role === 'mahasiswa' && (
              <span className={`badge ${k.status_saya === 'dinilai' ? 'bg-green-100 text-green-700' : k.status_saya === 'selesai' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                {k.status_saya === 'dinilai' ? `Nilai: ${k.nilai_saya}` : k.status_saya === 'selesai' ? 'Menunggu penilaian' : 'Belum dikerjakan'}
              </span>
            )}
          </Link>
        ))}
        {list.length === 0 && <p className="text-sm text-muted py-8 text-center col-span-full">Belum ada kuis/ujian.</p>}
      </div>
    </div>
  );
}

// ==================== TAB ANGGOTA ====================
function TabAnggota({ anggota }) {
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-navy text-white text-left">
          <tr>
            <th className="px-4 py-3 font-semibold">Nama</th>
            <th className="px-4 py-3 font-semibold">NIM</th>
            <th className="px-4 py-3 font-semibold">Email</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {anggota.map((a) => (
            <tr key={a.id}>
              <td className="px-4 py-3 font-medium text-ink">{a.nama}</td>
              <td className="px-4 py-3 text-muted">{a.nim_nip || '-'}</td>
              <td className="px-4 py-3 text-muted">{a.email}</td>
            </tr>
          ))}
          {anggota.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-muted">Belum ada mahasiswa terdaftar.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
