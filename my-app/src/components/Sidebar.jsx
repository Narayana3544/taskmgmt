import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, FolderKanban, ListTodo, Zap, ChevronLeft,
    ChevronRight, LogOut
} from 'lucide-react';

const NAV_ITEMS = [
    {
        section: 'Main', items: [
            { label: 'Kanban Board', path: '/', icon: LayoutDashboard },
            { label: 'Projects', path: '/projects', icon: FolderKanban },
            { label: 'Work Items', path: '/work-items', icon: ListTodo },
            { label: 'Sprints', path: '/sprints', icon: Zap },
        ]
    },
];

const Sidebar = ({ collapsed, onToggle }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Logo */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">W</div>
                    {!collapsed && <span className="sidebar-logo-text">WorkHub</span>}
                </div>
            </div>

            {/* Nav */}
            <nav className="sidebar-nav">
                {NAV_ITEMS.map((section) => (
                    <div key={section.section}>
                        {!collapsed && <div className="sidebar-section-title">{section.section}</div>}
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <button key={item.path}
                                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                                    onClick={() => navigate(item.path)}
                                    title={collapsed ? item.label : ''}>
                                    <Icon size={18} />
                                    {!collapsed && <span>{item.label}</span>}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                {!collapsed && (
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-avatar">
                            {user.fullName ? user.fullName[0] : 'U'}
                        </div>
                        <div>
                            <div className="sidebar-user-name">{user.fullName || 'User'}</div>
                            <div className="sidebar-user-role">{user.roleName || 'Employee'}</div>
                        </div>
                    </div>
                )}
                <button className="sidebar-nav-item" onClick={handleLogout} title="Logout">
                    <LogOut size={18} />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
