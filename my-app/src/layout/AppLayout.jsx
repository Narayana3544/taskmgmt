import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from './Header';

/**
 * AppLayout — the global layout shell for authenticated pages.
 *
 * Structure:
 *   AppLayout
 *     ├ Sidebar  (collapsible)
 *     └ Main area
 *         ├ Header  (search + notifications + user)
 *         └ PageContent  (children)
 *
 * Usage (in App.jsx):
 *   <AppLayout> <Outlet /> </AppLayout>
 *   — or wrap individual routes —
 *   <AppLayout> <KanbanBoard /> </AppLayout>
 */
const AppLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />
      <div className={`app-main ${sidebarCollapsed ? 'app-main-expanded' : ''}`}>
        <Header onToggleSidebar={toggleSidebar} />
        <main className="app-page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
