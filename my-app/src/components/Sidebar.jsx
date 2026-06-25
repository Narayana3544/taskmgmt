import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, FolderKanban, ListTodo, Zap, Layers,
    LogOut, Calendar, ClipboardList, Clock, Database,
    Users, Shield, Bell, FileSearch, Activity, User, Building, Award
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { getUser } from '../utils/user';

const NAV_ITEMS = [
    {
        section: 'Main', items: [
            { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
            { label: 'Kanban Board', path: '/', icon: FolderKanban },
            { label: 'Projects', path: '/projects', icon: FolderKanban },
            { label: 'Features', path: '/features', icon: Layers },
            { label: 'Work Items', path: '/work-items', icon: ListTodo },
            { label: 'Sprints', path: '/sprints', icon: Zap },
        ]
    },
    {
        section: 'HR', items: [
            { label: 'Leave Management', path: '/leaves', icon: ClipboardList },
            { label: 'Timesheets', path: '/timesheets', icon: Clock },
            { label: 'Daily Reports', path: '/timesheets/report', icon: FileSearch, roles: ['ADMIN', 'MANAGER'] },
            { label: 'Holidays', path: '/holidays', icon: Calendar },
            { label: 'My Performance', path: '/performance', icon: Award },
        ]
    },
    {
        section: 'Admin',
        // Section-level roles: only these roles see the section at all
        roles: ['ADMIN', 'MANAGER'],
        items: [
            { label: 'Master Data', path: '/master-data', icon: Database, roles: ['ADMIN'] },
            { label: 'Organization', path: '/organization', icon: Building, roles: ['ADMIN'] },
            { label: 'Users', path: '/users', icon: Users, roles: ['ADMIN', 'MANAGER'] },
            { label: 'Roles', path: '/roles', icon: Shield, roles: ['ADMIN'] },
            { label: 'Audit Log', path: '/audit-log', icon: FileSearch, roles: ['ADMIN', 'MANAGER'] },
            { label: 'Notifications', path: '/notifications', icon: Bell },
        ]
    },
    {
        section: 'Personal', items: [
            { label: 'My Profile', path: '/profile', icon: User },
        ]
    },
];

const Sidebar = ({ collapsed, onToggle }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = getUser();
    const userRole = (user.roleCode || user.role || '').toUpperCase();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userPermissions');
        navigate('/login');
    };

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const filteredNavItems = NAV_ITEMS
        .filter(section => {
            // If the section has role restrictions, check them
            if (section.roles && !section.roles.includes(userRole)) return false;
            return true;
        })
        .map(section => ({
            ...section,
            // Filter individual items by role if specified
            items: section.items.filter(item => {
                if (item.roles && !item.roles.includes(userRole)) return false;
                return true;
            })
        }))
        .filter(section => section.items.length > 0);

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            {/* Logo */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    {user.organizationLogo ? (
                        <div className="sidebar-logo-icon" style={{ padding: 0, overflow: 'hidden', background: 'transparent' }}>
                            <img src={user.organizationLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                    ) : (
                        <div className="sidebar-logo-icon">W</div>
                    )}
                    {!collapsed && <span className="sidebar-logo-text" style={{ fontSize: '15px' }}>{user.organizationName || 'WorkHub'}</span>}
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {filteredNavItems.map((section) => (
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
                        {user.profileImageUrl ? (
                            <img src={user.profileImageUrl} alt="Avatar" style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                            <div className="sidebar-user-avatar">
                                {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                            </div>
                        )}
                        <div className="sidebar-user-text">
                            <div className="sidebar-user-name">{user.fullName || 'User'}</div>
                            <div className="sidebar-user-role">{user.designationName || user.roleName || 'Employee'}</div>
                        </div>
                    </div>
                )}
                <ThemeToggle collapsed={collapsed} />
                <button className="sidebar-nav-item" onClick={handleLogout} title="Logout" aria-label="Logout">
                    <LogOut size={18} />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
