import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Menu, PanelLeftClose } from 'lucide-react';
import api from '../api';

const Navbar = ({ collapsed, onToggle, title }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);

    const showBackButton = location.pathname !== '/';

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
                <button className="navbar-toggle" onClick={onToggle} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
                    {collapsed ? <Menu size={20} /> : <PanelLeftClose size={20} />}
                </button>
                {showBackButton && (
                    <button 
                        onClick={() => navigate(-1)} 
                        className="btn btn-secondary mr-3 flex items-center justify-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 border-none bg-transparent"
                        title="Go Back"
                        style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <span>← Back</span>
                    </button>
                )}
                <h1 className="navbar-title">{title}</h1>
            </div>
            <div className="navbar-right">
                <button className="navbar-icon-btn" title="Notifications" onClick={() => navigate('/notifications')}>
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
