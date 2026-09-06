import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function KuisDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [kuis, setKuis] = useState(null);
  const [soal, setSoal] = useState([]);
  const [jawaban, setJawaban] = useState({});
  const [submisiId, setSubmisiId] = useState(null);
  const [hasil, setHasil] = useState(null);
  const [submisiList, setSubmisiList] = useState([]);
  const [detailSubmisi, setDetailSubmisi] = useState(null);

  function load() {
    api.get(`/kuis/${id}`).then((r) => { setKuis(r.data.kuis); setSoal(r.data.soal); });
    if (user.role === 'dosen') api.get(`/kuis/${id}/submisi`).then((r) => setSubmisiList(r.data.submisi));
  }
  useEffect(load, [id, user.role]);

  async function mulaiKuis() {
    const r = await api.post(`/kuis/${id}/mulai`);
    setSubmisiId(r.data.submisi_id);
  }

  async function submitKuis() {
    const payload = Object.entries(jawaban).map(([soal_id, jwb]) => ({ soal_id, jawaban: jwb }));
    const r = await api.post(`/kuis/${id}/submit`, { jawaban: payload });
    setHasil(r.data);
  }

  async function bukaSubmisi(s) {
    const r = await api.get(`/kuis/submisi/${s.id}/jawaban`);
    setDetailSubmisi({ ...s, jawaban: r.data.jawaban });
  }

  async function nilaiEsai(jawabanId, skor) {
    await api.put(`/kuis/jawaban/${jawabanId}/nilai`, { skor: Number(skor) });
    bukaSubmisi(detailSubmisi);
  }

  if (!kuis) return <Layout title="Memuat..."><p className="text-sm text-muted">Memuat kuis...</p></Layout>;

  return (
    <Layout title={kuis.judul}>
      <div className="panel p-5 mb-6">
        <p className="text-sm text-muted mb-2">{kuis.deskripsi}</p>
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          <span>Durasi: {kuis.durasi_menit} menit</span>
          <span>Tipe: {kuis.tipe.replace('_', ' ')}</span>
          <span>Jumlah Soal: {soal.length}</span>
        </div>
      </div>

      {user.role === 'mahasiswa' && (
        <>
          {hasil ? (
            <div className="panel p-6 text-center">
              <p className="text-sm text-muted mb-1">Hasil Pengerjaan</p>
              <p className="font-serif text-3xl text-navy font-semibold mb-2">{hasil.nilai !== null ? hasil.nilai : 'Menunggu penilaian'}</p>
              <p className="text-sm text-muted">{hasil.message}</p>
            </div>
          ) : !submisiId ? (
            <button className="btn-primary" onClick={mulaiKuis}>Mulai Kerjakan Kuis</button>
          ) : (
            <div className="space-y-4">
              {soal.map((s, i) => (
                <div key={s.id} className="panel p-4">
                  <p className="font-semibold text-sm text-ink mb-3">{i + 1}. {s.pertanyaan} <span className="text-xs text-muted">({s.bobot} poin)</span></p>
                  {s.tipe === 'pilihan_ganda' ? (
                    <div className="space-y-2">
                      {['a', 'b', 'c', 'd'].map((opt) => s[`pilihan_${opt}`] && (
                        <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="radio" name={`soal-${s.id}`} value={opt.toUpperCase()}
                            onChange={(e) => setJawaban({ ...jawaban, [s.id]: e.target.value })} />
                          <span className="font-semibold">{opt.toUpperCase()}.</span> {s[`pilihan_${opt}`]}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea className="input-field" rows={4} placeholder="Tulis jawaban esai Anda..."
                      onChange={(e) => setJawaban({ ...jawaban, [s.id]: e.target.value })} />
                  )}
                </div>
              ))}
              <button className="btn-primary" onClick={submitKuis}>Kumpulkan Jawaban</button>
            </div>
          )}
        </>
      )}

      {user.role === 'dosen' && (
        <div>
          <h3 className="font-serif text-lg text-navy font-semibold mb-4">Submisi Mahasiswa</h3>
          <div className="panel overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-navy text-white text-left">
                <tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Nilai</th><th className="px-4 py-3"></th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {submisiList.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium text-ink">{s.nama}</td>
                    <td className="px-4 py-3 capitalize text-muted">{s.status.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-muted">{s.nilai ?? '-'}</td>
                    <td className="px-4 py-3"><button onClick={() => bukaSubmisi(s)} className="text-navy font-semibold hover:underline">Periksa</button></td>
                  </tr>
                ))}
                {submisiList.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">Belum ada submisi.</td></tr>}
              </tbody>
            </table>
          </div>

          {detailSubmisi && (
            <div className="panel p-5">
              <h4 className="font-semibold text-navy mb-3">Jawaban {detailSubmisi.nama}</h4>
              <div className="space-y-3">
                {detailSubmisi.jawaban.map((j) => (
                  <div key={j.id} className="border border-line rounded-lg p-3">
                    <p className="text-sm font-semibold text-ink mb-1">{j.pertanyaan}</p>
                    <p className="text-sm text-muted mb-2">Jawaban: {j.jawaban}</p>
                    {j.tipe === 'pilihan_ganda' ? (
                      <span className={`badge ${j.skor > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        Skor otomatis: {j.skor}/{j.bobot}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input type="number" min={0} max={j.bobot} defaultValue={j.skor ?? ''} placeholder={`0-${j.bobot}`}
                          className="input-field w-28" onBlur={(e) => e.target.value !== '' && nilaiEsai(j.id, e.target.value)} />
                        <span className="text-xs text-muted">/ {j.bobot} poin (esai, nilai manual)</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
