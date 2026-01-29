import React from 'react';
import { motion } from 'framer-motion';
import './StatWidget.css';

/**
 * StatWidget - Dashboard statistic widget with icon and animation
 */
const StatWidget = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    variant = 'primary', // 'primary' | 'success' | 'warning' | 'danger' | 'info'
    onClick,
}) => {
    const variantColors = {
        primary: { bg: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc' },
        success: { bg: 'rgba(34, 197, 94, 0.2)', color: '#86efac' },
        warning: { bg: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d' },
        danger: { bg: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' },
        info: { bg: 'rgba(6, 182, 212, 0.2)', color: '#67e8f9' },
    };

    return (
        <motion.div
            className="stat-widget"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.3 }}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className="stat-widget-header">
                {Icon && (
                    <div
                        className="stat-widget-icon"
                        style={{
                            background: variantColors[variant].bg,
                            color: variantColors[variant].color,
                        }}
                    >
                        <Icon size={22} />
                    </div>
                )}
                <span className="stat-widget-title">{title}</span>
            </div>

            <motion.div
                className="stat-widget-value"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                {value}
            </motion.div>

            {trend && (
                <div className={`stat-widget-trend ${trend === 'up' ? 'trend-up' : 'trend-down'}`}>
                    <span>{trend === 'up' ? '↑' : '↓'}</span>
                    <span>{trendValue}</span>
                </div>
            )}
        </motion.div>
    );
};

export default StatWidget;
