import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const icons = {
  dashboard: 'M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h8v8H3v-8zm10 3h8v5h-8v-5z',
  kelas: 'M4 4h16v4H4V4zm0 6h16v10H4V10zm3 3h4v2H7v-2z',
  materi: 'M6 2h9l5 5v15H6V2zm8 1.5V8h4.5',
  kuis: 'M9 11l2 2 4-4M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z',
  forum: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
  kelompok: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  tracking: 'M3 3v18h18M7 14l4-4 3 3 5-6'
};

function Icon({ path }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  const items = [
    { to: '/', label: 'Dasbor', icon: icons.dashboard },
    { to: '/kelas', label: 'Kelas Saya', icon: icons.kelas },
    { to: '/forum', label: 'Forum & Chat', icon: icons.forum },
    { to: '/kelompok', label: 'Kelompok Belajar', icon: icons.kelompok },
    { to: '/tracking', label: 'Pelacakan & Laporan', icon: icons.tracking },
  ];

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:static z-40 top-0 left-0 h-full w-64 bg-navy text-white flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-gold flex items-center justify-center font-serif font-bold text-navy text-lg">G</div>
          <div>
            <p className="font-serif font-semibold text-white leading-tight">Ganesha LMS</p>
            <p className="text-[11px] text-white/50 leading-tight">Learning Management System</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === '/'}
              onClick={onClose}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon path={it.icon} />
              {it.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-xs text-white/50">Masuk sebagai</p>
          <p className="text-sm font-semibold">{user?.nama}</p>
          <span className="badge bg-gold/20 text-gold mt-1 capitalize">{user?.role}</span>
        </div>
      </aside>
    </>
  );
}
