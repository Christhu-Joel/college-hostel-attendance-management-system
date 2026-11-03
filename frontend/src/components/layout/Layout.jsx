import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="ha-app">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <main className="ha-main">
        <div className="ha-page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
