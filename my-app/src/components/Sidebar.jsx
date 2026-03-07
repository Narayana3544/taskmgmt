import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, FolderKanban, ListTodo, Zap,
    LogOut, Calendar, ClipboardList, Clock, Database,
    Users, Shield, Bell, FileSearch, Activity, User
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = [
    {
        section: 'Main', items: [
            { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
            { label: 'Kanban Board', path: '/', icon: FolderKanban },
            { label: 'Projects', path: '/projects', icon: FolderKanban },
            { label: 'Work Items', path: '/work-items', icon: ListTodo },
            { label: 'Sprints', path: '/sprints', icon: Zap },
        ]
    },
    {
        section: 'HR', items: [
            { label: 'Leave Management', path: '/leaves', icon: ClipboardList },
            { label: 'Timesheets', path: '/timesheets', icon: Clock },
            { label: 'Holidays', path: '/holidays', icon: Calendar },
        ]
    },
    {
        section: 'Admin', items: [
            { label: 'Master Data', path: '/master-data', icon: Database },
            { label: 'Users', path: '/users', icon: Users },
            { label: 'Roles', path: '/roles', icon: Shield },
            { label: 'Audit Log', path: '/audit-log', icon: FileSearch },
            { label: 'Notifications', path: '/notifications', icon: Bell },
        ]
    },
    {
        section: 'Personal', items: [
            { label: 'My Profile', path: '/profile', icon: User },
            { label: 'Activity', path: '/activity', icon: Activity },
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

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
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

            {/* Navigation */}
            <nav className="sidebar-nav">
                {NAV_ITEMS.map((section) => (
                    <div key={section.section}>
                        {!collapsed && <div className="sidebar-section-title">{section.section}</div>}
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            return (
                                <button key={item.path}
                                    className={`sidebar-nav-item ${active ? 'active' : ''}`}
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
                            {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                            <div className="sidebar-user-name">{user.fullName || 'User'}</div>
                            <div className="sidebar-user-role">{user.roleName || 'Employee'}</div>
                        </div>
                    </div>
                )}
                <ThemeToggle collapsed={collapsed} />
                <button className="sidebar-nav-item" onClick={handleLogout} title="Logout">
                    <LogOut size={18} />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
