import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ title, onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 bg-canvas/90 backdrop-blur border-b border-line">
      <div className="flex items-center justify-between px-4 sm:px-8 py-4">
        <div className="flex items-center gap-3">
          <button className="lg:hidden text-navy" onClick={onMenuClick} aria-label="Buka menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h1 className="font-serif text-xl sm:text-2xl text-navy font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-ink leading-tight">{user?.nama}</p>
            <p className="text-xs text-muted leading-tight">{user?.email}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center font-semibold text-sm">
            {user?.nama?.charAt(0)?.toUpperCase()}
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="text-sm font-semibold text-muted hover:text-navy border border-line rounded-lg px-3 py-1.5"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>
  );
}
