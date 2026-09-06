import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, accent, sub }) {
  return (
    <div className="panel p-5 accent-bar" style={{ '--accent': accent }}>
      <p className="text-xs font-semibold text-muted uppercase tracking-wide">{label}</p>
      <p className="font-serif text-3xl text-navy font-semibold mt-2">{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [ringkasan, setRingkasan] = useState(null);
  const [kelas, setKelas] = useState([]);

  useEffect(() => {
    const endpoint = user.role === 'dosen' ? '/tracking/ringkasan-dosen' : '/tracking/ringkasan-mahasiswa';
    api.get(endpoint).then((r) => setRingkasan(r.data)).catch(() => {});
    api.get('/kelas').then((r) => setKelas(r.data.kelas.slice(0, 5))).catch(() => {});
  }, [user.role]);

  return (
    <Layout title={`Selamat datang, ${user.nama.split(' ')[0]}`}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {user.role === 'dosen' ? (
          <>
            <StatCard label="Kelas Diampu" value={ringkasan?.total_kelas ?? '-'} accent="#1B2A4A" />
            <StatCard label="Total Mahasiswa" value={ringkasan?.total_mahasiswa ?? '-'} accent="#C9932E" />
            <StatCard label="Kuis Dibuat" value={ringkasan?.total_kuis ?? '-'} accent="#2E7D5B" />
            <StatCard label="Materi Diunggah" value={ringkasan?.total_materi ?? '-'} accent="#B3452C" />
          </>
        ) : (
          <>
            <StatCard label="Kelas Diikuti" value={ringkasan?.total_kelas ?? '-'} accent="#1B2A4A" />
            <StatCard label="Kuis Selesai" value={ringkasan?.total_kuis_selesai ?? '-'} accent="#C9932E" />
            <StatCard label="Rata-rata Nilai" value={ringkasan?.rata_nilai ?? '-'} accent="#2E7D5B" sub="Dari seluruh kuis dinilai" />
          </>
        )}
      </div>

      <div className="panel p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-navy font-semibold">
            {user.role === 'dosen' ? 'Kelas yang Anda Ampu' : 'Kelas yang Anda Ikuti'}
          </h3>
          <Link to="/kelas" className="text-sm font-semibold text-navy hover:underline">Lihat semua →</Link>
        </div>
        {kelas.length === 0 ? (
          <p className="text-sm text-muted py-8 text-center">
            Belum ada kelas. {user.role === 'dosen' ? 'Buat kelas pertama Anda.' : 'Gabung ke kelas yang tersedia.'}
          </p>
        ) : (
          <div className="divide-y divide-line">
            {kelas.map((k) => (
              <Link key={k.id} to={`/kelas/${k.id}`} className="flex items-center justify-between py-3 hover:bg-canvas -mx-2 px-2 rounded-lg">
                <div>
                  <p className="font-semibold text-ink text-sm">{k.nama}</p>
                  <p className="text-xs text-muted">{k.kode} · {k.nama_dosen}</p>
                </div>
                <span className="badge bg-navy/5 text-navy">{k.jumlah_mahasiswa} mahasiswa</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
