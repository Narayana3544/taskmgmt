import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, AlertCircle, CheckCircle } from 'lucide-react';
import './NotificationBell.css';

/**
 * NotificationBell - Real-time notification widget with dropdown
 */
const NotificationBell = ({ notifications = [], onMarkRead, onMarkAllRead, onClear }) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle size={16} className="notif-icon-success" />;
            case 'warning': return <AlertCircle size={16} className="notif-icon-warning" />;
            case 'error': return <AlertCircle size={16} className="notif-icon-error" />;
            default: return <Bell size={16} className="notif-icon-info" />;
        }
    };

    return (
        <div className="notification-bell-container">
            <motion.button
                className="notification-bell-trigger"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <motion.span
                        className="notification-count"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 10 }}
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                )}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="notification-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown */}
                        <motion.div
                            className="notification-dropdown"
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="notification-header">
                                <h3>Notifications</h3>
                                {unreadCount > 0 && (
                                    <button className="mark-all-read" onClick={onMarkAllRead}>
                                        <Check size={14} /> Mark all read
                                    </button>
                                )}
                            </div>

                            <div className="notification-list">
                                {notifications.length === 0 ? (
                                    <div className="notification-empty">
                                        <Bell size={32} strokeWidth={1.5} />
                                        <p>No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.slice(0, 5).map((notif, i) => (
                                        <motion.div
                                            key={notif.id}
                                            className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => onMarkRead?.(notif.id)}
                                        >
                                            <div className="notification-icon">
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="notification-content">
                                                <p className="notification-title">{notif.title}</p>
                                                <p className="notification-message">{notif.message}</p>
                                                <span className="notification-time">{notif.time}</span>
                                            </div>
                                            {onClear && (
                                                <button
                                                    className="notification-dismiss"
                                                    onClick={(e) => { e.stopPropagation(); onClear(notif.id); }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {notifications.length > 5 && (
                                <div className="notification-footer">
                                    <button className="view-all">View all notifications</button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
