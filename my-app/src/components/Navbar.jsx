import React, { useState, useEffect } from 'react';
import { Bell, Menu, ChevronLeft } from 'lucide-react';
import api from '../api';

const Navbar = ({ collapsed, onToggle, title }) => {
    const [unreadCount, setUnreadCount] = useState(0);

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
                <button className="navbar-toggle" onClick={onToggle} title="Toggle sidebar">
                    {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                </button>
                <h1 className="navbar-title">{title}</h1>
            </div>
            <div className="navbar-right">
                <button className="navbar-icon-btn" title="Notifications">
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
