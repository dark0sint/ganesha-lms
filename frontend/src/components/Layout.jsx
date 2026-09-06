import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} onMenuClick={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
