import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Menu, PanelLeftClose, FolderKanban } from 'lucide-react';
import api from '../api';
import projectsApi from '../api/projectsApi';

const Navbar = ({ collapsed, onToggle, title }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);
    const [projects, setProjects] = useState([]);
    const [selectedProjId, setSelectedProjId] = useState(() => localStorage.getItem('selectedProjectId') || '');

    const showBackButton = location.pathname !== '/';

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await projectsApi.getMyProjects();
                const list = res.data?.data || [];
                setProjects(list);
                if (list.length > 0 && !selectedProjId) {
                    setSelectedProjId(String(list[0].id));
                    localStorage.setItem('selectedProjectId', String(list[0].id));
                }
            } catch (err) { /* ignore */ }
        };
        fetchProjects();
    }, [selectedProjId]);

    const handleProjectSelect = (e) => {
        const val = e.target.value;
        setSelectedProjId(val);
        localStorage.setItem('selectedProjectId', val);
        window.dispatchEvent(new Event('projectChanged'));
    };

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await api.get('/api/notifications/unread-count');
                if (res.data?.data?.count !== undefined) {
                    setUnreadCount(res.data.data.count);
                }
            } catch (err) {
                // Silently handle — notification count is non-critical
            }
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <header className={`navbar${collapsed ? ' collapsed' : ''}`}>
            <div className="navbar-left">
                <button className="navbar-toggle" onClick={onToggle} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
                    {collapsed ? <Menu size={20} /> : <PanelLeftClose size={20} />}
                </button>
                {showBackButton && (
                    <button 
                        onClick={() => navigate(-1)} 
                        className="btn btn-secondary"
                        title="Go Back"
                        aria-label="Go Back"
                        style={{ marginRight: '12px', padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'transparent' }}
                    >
                        <span>← Back</span>
                    </button>
                )}
                <h1 className="navbar-title">{title}</h1>
            </div>
            <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {projects.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FolderKanban size={16} color="var(--color-text-muted)" />
                        <select
                            className="form-select"
                            value={selectedProjId}
                            onChange={handleProjectSelect}
                            style={{
                                height: '32px',
                                fontSize: '12px',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-card)',
                                color: 'var(--color-text)',
                                maxWidth: '180px',
                            }}
                            title="Switch Active Project"
                        >
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                <button className="navbar-icon-btn" title="Notifications" aria-label="Notifications" onClick={() => navigate('/notifications')}>
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="notification-badge">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </div>
        </header>
    );
};

export default Navbar;
