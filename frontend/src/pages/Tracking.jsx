import { useEffect, useState } from 'react';
import api from '../api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Tracking() {
  const { user } = useAuth();
  const [kelasList, setKelasList] = useState([]);
  const [kelasId, setKelasId] = useState('');
  const [laporan, setLaporan] = useState(null);
  const [ringkasan, setRingkasan] = useState(null);
  const [laporanSaya, setLaporanSaya] = useState(null);

  useEffect(() => {
    api.get('/kelas').then((r) => {
      setKelasList(r.data.kelas);
      if (r.data.kelas.length) setKelasId(r.data.kelas[0].id);
    });
  }, []);

  useEffect(() => {
    if (!kelasId) return;
    if (user.role === 'dosen') {
      api.get(`/tracking/kelas/${kelasId}`).then((r) => { setLaporan(r.data.laporan); setRingkasan(r.data.ringkasan); });
    } else {
      api.get(`/tracking/kelas/${kelasId}/saya`).then((r) => setLaporanSaya(r.data));
    }
  }, [kelasId, user.role]);

  function exportCsv() {
    if (!laporan) return;
    const header = 'Nama,NIM,Kehadiran (%),Materi Dibaca,Post Forum,Rata Nilai Kuis\n';
    const rows = laporan.map((l) =>
      `${l.mahasiswa.nama},${l.mahasiswa.nim_nip || '-'},${l.kehadiran.persen},${l.materi_dibaca.dibaca}/${l.materi_dibaca.total},${l.forum_post},${l.rata_nilai_kuis ?? '-'}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'laporan-tracking.csv'; a.click();
  }

  return (
    <Layout title="Pelacakan & Laporan">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <select className="input-field w-auto" value={kelasId} onChange={(e) => setKelasId(e.target.value)}>
          {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
        </select>
        {user.role === 'dosen' && laporan?.length > 0 && (
          <button onClick={exportCsv} className="btn-secondary text-sm">⬇ Ekspor CSV</button>
        )}
      </div>

      {user.role === 'dosen' && laporan && (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="panel p-5 accent-bar" style={{ '--accent': '#1B2A4A' }}>
              <p className="text-xs text-muted uppercase font-semibold">Total Mahasiswa</p>
              <p className="font-serif text-2xl text-navy font-semibold mt-1">{ringkasan?.total_mahasiswa}</p>
            </div>
            <div className="panel p-5 accent-bar" style={{ '--accent': '#C9932E' }}>
              <p className="text-xs text-muted uppercase font-semibold">Total Pertemuan</p>
              <p className="font-serif text-2xl text-navy font-semibold mt-1">{ringkasan?.total_pertemuan}</p>
            </div>
            <div className="panel p-5 accent-bar" style={{ '--accent': '#2E7D5B' }}>
              <p className="text-xs text-muted uppercase font-semibold">Total Materi</p>
              <p className="font-serif text-2xl text-navy font-semibold mt-1">{ringkasan?.total_materi}</p>
            </div>
          </div>

          <div className="panel overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-navy text-white text-left">
                <tr>
                  <th className="px-4 py-3">Mahasiswa</th>
                  <th className="px-4 py-3">Kehadiran</th>
                  <th className="px-4 py-3">Materi Dibaca</th>
                  <th className="px-4 py-3">Post Forum</th>
                  <th className="px-4 py-3">Rata Nilai Kuis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {laporan.map((l) => (
                  <tr key={l.mahasiswa.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{l.mahasiswa.nama}</p>
                      <p className="text-xs text-muted">{l.mahasiswa.nim_nip}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-28 bg-canvas rounded-full h-2 mb-1">
                        <div className="h-2 rounded-full bg-navy" style={{ width: `${l.kehadiran.persen}%` }} />
                      </div>
                      <span className="text-xs text-muted">{l.kehadiran.hadir}/{l.kehadiran.total} ({l.kehadiran.persen}%)</span>
                    </td>
                    <td className="px-4 py-3 text-muted">{l.materi_dibaca.dibaca}/{l.materi_dibaca.total}</td>
                    <td className="px-4 py-3 text-muted">{l.forum_post}</td>
                    <td className="px-4 py-3">
                      {l.rata_nilai_kuis !== null ? (
                        <span className={`badge ${l.rata_nilai_kuis >= 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{l.rata_nilai_kuis}</span>
                      ) : <span className="text-muted text-xs">Belum ada</span>}
                    </td>
                  </tr>
                ))}
                {laporan.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Belum ada mahasiswa terdaftar.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {user.role === 'mahasiswa' && laporanSaya && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="panel p-5">
            <p className="text-xs text-muted uppercase font-semibold mb-2">Kehadiran</p>
            <div className="w-full bg-canvas rounded-full h-3 mb-2">
              <div className="h-3 rounded-full bg-navy" style={{ width: `${laporanSaya.kehadiran.persen}%` }} />
            </div>
            <p className="text-sm text-muted">{laporanSaya.kehadiran.hadir} dari {laporanSaya.kehadiran.total} pertemuan ({laporanSaya.kehadiran.persen}%)</p>
          </div>
          <div className="panel p-5">
            <p className="text-xs text-muted uppercase font-semibold mb-2">Materi Dibaca</p>
            <div className="w-full bg-canvas rounded-full h-3 mb-2">
              <div className="h-3 rounded-full bg-gold" style={{ width: `${laporanSaya.materi.total ? (laporanSaya.materi.dibaca / laporanSaya.materi.total) * 100 : 0}%` }} />
            </div>
            <p className="text-sm text-muted">{laporanSaya.materi.dibaca} dari {laporanSaya.materi.total} materi</p>
          </div>
          <div className="panel p-5 sm:col-span-2">
            <p className="text-xs text-muted uppercase font-semibold mb-3">Rekap Nilai Kuis</p>
            <div className="divide-y divide-line">
              {laporanSaya.nilai_kuis.map((n, i) => (
                <div key={i} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-ink">{n.judul}</span>
                  {n.status === 'dinilai' ? <span className="badge bg-green-100 text-green-700">{n.nilai}</span> : <span className="badge bg-gray-100 text-gray-600">Menunggu</span>}
                </div>
              ))}
              {laporanSaya.nilai_kuis.length === 0 && <p className="text-sm text-muted py-4 text-center">Belum ada kuis dikerjakan.</p>}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
