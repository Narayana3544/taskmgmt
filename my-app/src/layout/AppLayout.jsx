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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(prev => !prev)}
      />
      <div className={`app-main ${sidebarCollapsed ? 'app-main-expanded' : ''}`}>
        <Header onToggleSidebar={() => setSidebarCollapsed(prev => !prev)} />
        <main className="app-page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
