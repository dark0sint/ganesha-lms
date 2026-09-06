import { useEffect, useRef, useState } from 'react';
import api from '../api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Forum() {
  const { user } = useAuth();
  const [kelasList, setKelasList] = useState([]);
  const [kelasId, setKelasId] = useState('');
  const [mode, setMode] = useState('forum'); // forum | chat
  const [topikList, setTopikList] = useState([]);
  const [topikAktif, setTopikAktif] = useState(null);
  const [balasan, setBalasan] = useState([]);
  const [showTopikForm, setShowTopikForm] = useState(false);
  const [formTopik, setFormTopik] = useState({ judul: '', isi: '' });
  const [balasanBaru, setBalasanBaru] = useState('');
  const [pesanChat, setPesanChat] = useState([]);
  const [pesanBaru, setPesanBaru] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    api.get('/kelas').then((r) => {
      setKelasList(r.data.kelas);
      if (r.data.kelas.length) setKelasId(r.data.kelas[0].id);
    });
  }, []);

  function loadTopik() {
    if (!kelasId) return;
    api.get(`/forum/kelas/${kelasId}/topik`).then((r) => setTopikList(r.data.topik));
  }
  useEffect(() => { if (mode === 'forum') { loadTopik(); setTopikAktif(null); } }, [kelasId, mode]);

  function bukaTopik(id) {
    api.get(`/forum/topik/${id}`).then((r) => { setTopikAktif(r.data.topik); setBalasan(r.data.balasan); });
  }

  async function buatTopik(e) {
    e.preventDefault();
    await api.post(`/forum/kelas/${kelasId}/topik`, formTopik);
    setFormTopik({ judul: '', isi: '' });
    setShowTopikForm(false);
    loadTopik();
  }

  async function kirimBalasan(e) {
    e.preventDefault();
    if (!balasanBaru.trim()) return;
    await api.post(`/forum/topik/${topikAktif.id}/balas`, { isi: balasanBaru });
    setBalasanBaru('');
    bukaTopik(topikAktif.id);
  }

  // Chat: polling tiap 3 detik
  useEffect(() => {
    if (mode !== 'chat' || !kelasId) return;
    let stop = false;
    async function poll() {
      const r = await api.get(`/forum/kelas/${kelasId}/chat`);
      if (!stop) setPesanChat(r.data.pesan);
    }
    poll();
    const interval = setInterval(poll, 3000);
    return () => { stop = true; clearInterval(interval); };
  }, [mode, kelasId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [pesanChat]);

  async function kirimChat(e) {
    e.preventDefault();
    if (!pesanBaru.trim()) return;
    const r = await api.post(`/forum/kelas/${kelasId}/chat`, { isi: pesanBaru });
    setPesanChat([...pesanChat, r.data.pesan]);
    setPesanBaru('');
  }

  return (
    <Layout title="Forum Diskusi & Chat">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select className="input-field w-auto" value={kelasId} onChange={(e) => setKelasId(e.target.value)}>
          {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
        </select>
        <div className="flex bg-white border border-line rounded-lg overflow-hidden">
          <button onClick={() => setMode('forum')} className={`px-4 py-2 text-sm font-semibold ${mode === 'forum' ? 'bg-navy text-white' : 'text-muted'}`}>Forum Diskusi</button>
          <button onClick={() => setMode('chat')} className={`px-4 py-2 text-sm font-semibold ${mode === 'chat' ? 'bg-navy text-white' : 'text-muted'}`}>Chat Langsung</button>
        </div>
      </div>

      {!kelasId && <p className="text-sm text-muted">Anda belum memiliki kelas.</p>}

      {kelasId && mode === 'forum' && (
        topikAktif ? (
          <div>
            <button onClick={() => setTopikAktif(null)} className="text-sm text-navy font-semibold mb-4">← Kembali ke daftar topik</button>
            <div className="panel p-5 mb-4">
              <h3 className="font-serif text-xl text-navy font-semibold mb-1">{topikAktif.judul}</h3>
              <p className="text-xs text-muted mb-3">oleh {topikAktif.nama_pembuat}</p>
              <p className="text-sm text-ink">{topikAktif.isi}</p>
            </div>
            <div className="space-y-3 mb-4">
              {balasan.map((b) => (
                <div key={b.id} className="panel p-3 flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-xs font-semibold shrink-0">{b.nama?.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{b.nama} <span className="text-xs text-muted font-normal capitalize">· {b.role}</span></p>
                    <p className="text-sm text-ink">{b.isi}</p>
                  </div>
                </div>
              ))}
              {balasan.length === 0 && <p className="text-sm text-muted py-4 text-center">Belum ada balasan. Jadilah yang pertama!</p>}
            </div>
            <form onSubmit={kirimBalasan} className="flex gap-2">
              <input className="input-field" placeholder="Tulis balasan..." value={balasanBaru} onChange={(e) => setBalasanBaru(e.target.value)} />
              <button className="btn-primary shrink-0">Kirim</button>
            </form>
          </div>
        ) : (
          <div>
            <button className="btn-primary mb-4" onClick={() => setShowTopikForm(!showTopikForm)}>{showTopikForm ? 'Batal' : '+ Buat Topik Baru'}</button>
            {showTopikForm && (
              <form onSubmit={buatTopik} className="panel p-5 mb-5 space-y-3">
                <input required className="input-field" placeholder="Judul topik" value={formTopik.judul} onChange={(e) => setFormTopik({ ...formTopik, judul: e.target.value })} />
                <textarea className="input-field" rows={3} placeholder="Isi diskusi..." value={formTopik.isi} onChange={(e) => setFormTopik({ ...formTopik, isi: e.target.value })} />
                <button className="btn-primary">Publikasikan</button>
              </form>
            )}
            <div className="space-y-3">
              {topikList.map((t) => (
                <button key={t.id} onClick={() => bukaTopik(t.id)} className="panel p-4 w-full text-left hover:border-navy/30 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-ink text-sm">{t.judul}</p>
                    <p className="text-xs text-muted">oleh {t.nama_pembuat}</p>
                  </div>
                  <span className="badge bg-navy/10 text-navy">{t.jumlah_balasan} balasan</span>
                </button>
              ))}
              {topikList.length === 0 && <p className="text-sm text-muted py-8 text-center">Belum ada topik diskusi.</p>}
            </div>
          </div>
        )
      )}

      {kelasId && mode === 'chat' && (
        <div className="panel flex flex-col h-[65vh]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {pesanChat.map((p) => (
              <div key={p.id} className={`flex ${p.pengirim_id === user.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-xl px-3 py-2 ${p.pengirim_id === user.id ? 'bg-navy text-white' : 'bg-canvas border border-line text-ink'}`}>
                  {p.pengirim_id !== user.id && <p className="text-[11px] font-semibold opacity-70 mb-0.5">{p.nama}</p>}
                  <p className="text-sm">{p.isi}</p>
                </div>
              </div>
            ))}
            {pesanChat.length === 0 && <p className="text-sm text-muted text-center py-8">Belum ada pesan. Mulai percakapan!</p>}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={kirimChat} className="border-t border-line p-3 flex gap-2">
            <input className="input-field" placeholder="Ketik pesan..." value={pesanBaru} onChange={(e) => setPesanBaru(e.target.value)} />
            <button className="btn-primary shrink-0">Kirim</button>
          </form>
        </div>
      )}
    </Layout>
  );
}
