import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children, title = 'Dashboard' }) => {
    const [collapsed, setCollapsed] = useState(() => {
        const stored = localStorage.getItem('sidebar_collapsed');
        return stored === 'true';
    });

    const toggleCollapsed = () => {
        setCollapsed(prev => {
            const next = !prev;
            localStorage.setItem('sidebar_collapsed', String(next));
            return next;
        });
    };

    return (
        <div className="app-layout">
            <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
            <div className={`app-main${collapsed ? ' collapsed' : ''}`}>
                <Navbar collapsed={collapsed} onToggle={toggleCollapsed} title={title} />
                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
