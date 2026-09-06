import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';

const kosong = { pertanyaan: '', tipe: 'pilihan_ganda', pilihan_a: '', pilihan_b: '', pilihan_c: '', pilihan_d: '', jawaban_benar: 'A', bobot: 10 };

export default function KuisBuat() {
  const { kelasId } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState({ judul: '', deskripsi: '', tipe: 'pilihan_ganda', durasi_menit: 60, buka_pada: '', tutup_pada: '' });
  const [soal, setSoal] = useState([{ ...kosong }]);
  const [error, setError] = useState('');

  function updateSoal(i, field, value) {
    const next = [...soal];
    next[i] = { ...next[i], [field]: value };
    setSoal(next);
  }
  function tambahSoal() { setSoal([...soal, { ...kosong }]); }
  function hapusSoal(i) { setSoal(soal.filter((_, idx) => idx !== i)); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!soal.length) { setError('Tambahkan minimal satu soal.'); return; }
    try {
      const res = await api.post(`/kuis/kelas/${kelasId}`, { ...info, soal });
      navigate(`/kuis/${res.data.kuis.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat kuis.');
    }
  }

  return (
    <Layout title="Buat Kuis / Ujian Baru">
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="panel p-5 grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-ink mb-1">Judul Kuis</label>
            <input required className="input-field" value={info.judul} onChange={(e) => setInfo({ ...info, judul: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-ink mb-1">Deskripsi</label>
            <textarea className="input-field" rows={2} value={info.deskripsi} onChange={(e) => setInfo({ ...info, deskripsi: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Tipe Evaluasi</label>
            <select className="input-field" value={info.tipe} onChange={(e) => setInfo({ ...info, tipe: e.target.value })}>
              <option value="pilihan_ganda">Pilihan Ganda</option>
              <option value="esai">Esai</option>
              <option value="campuran">Campuran</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Durasi (menit)</label>
            <input type="number" min={1} className="input-field" value={info.durasi_menit} onChange={(e) => setInfo({ ...info, durasi_menit: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Buka Pada</label>
            <input type="datetime-local" className="input-field" value={info.buka_pada} onChange={(e) => setInfo({ ...info, buka_pada: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Tutup Pada</label>
            <input type="datetime-local" className="input-field" value={info.tutup_pada} onChange={(e) => setInfo({ ...info, tutup_pada: e.target.value })} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-lg text-navy font-semibold">Daftar Soal</h3>
            <button type="button" onClick={tambahSoal} className="btn-secondary text-sm">+ Tambah Soal</button>
          </div>
          <div className="space-y-4">
            {soal.map((s, i) => (
              <div key={i} className="panel p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm text-navy">Soal {i + 1}</span>
                  <button type="button" onClick={() => hapusSoal(i)} className="text-xs text-red-600 font-semibold">Hapus</button>
                </div>
                <textarea required placeholder="Tulis pertanyaan..." className="input-field mb-3" rows={2}
                  value={s.pertanyaan} onChange={(e) => updateSoal(i, 'pertanyaan', e.target.value)} />
                <div className="grid sm:grid-cols-3 gap-3 mb-3">
                  <select className="input-field" value={s.tipe} onChange={(e) => updateSoal(i, 'tipe', e.target.value)}>
                    <option value="pilihan_ganda">Pilihan Ganda</option>
                    <option value="esai">Esai</option>
                  </select>
                  <input type="number" min={1} placeholder="Bobot nilai" className="input-field" value={s.bobot} onChange={(e) => updateSoal(i, 'bobot', Number(e.target.value))} />
                  {s.tipe === 'pilihan_ganda' && (
                    <select className="input-field" value={s.jawaban_benar} onChange={(e) => updateSoal(i, 'jawaban_benar', e.target.value)}>
                      <option value="A">Jawaban Benar: A</option>
                      <option value="B">Jawaban Benar: B</option>
                      <option value="C">Jawaban Benar: C</option>
                      <option value="D">Jawaban Benar: D</option>
                    </select>
                  )}
                </div>
                {s.tipe === 'pilihan_ganda' && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {['a', 'b', 'c', 'd'].map((opt) => (
                      <input key={opt} placeholder={`Pilihan ${opt.toUpperCase()}`} className="input-field"
                        value={s[`pilihan_${opt}`]} onChange={(e) => updateSoal(i, `pilihan_${opt}`, e.target.value)} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <button className="btn-primary">Publikasikan Kuis</button>
      </form>
    </Layout>
  );
}
