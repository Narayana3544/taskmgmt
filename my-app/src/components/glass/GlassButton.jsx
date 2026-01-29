import React from 'react';
import { motion } from 'framer-motion';
import './GlassButton.css';

/**
 * GlassButton - Premium glassmorphism button with variants
 */
const GlassButton = ({
    children,
    variant = 'default', // 'default' | 'primary' | 'success' | 'danger' | 'ghost'
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    fullWidth = false,
    onClick,
    className = '',
    ...props
}) => {
    const variantClasses = {
        default: 'glass-btn-default',
        primary: 'glass-btn-primary',
        success: 'glass-btn-success',
        danger: 'glass-btn-danger',
        ghost: 'glass-btn-ghost',
    };

    const sizeClasses = {
        sm: 'glass-btn-sm',
        md: 'glass-btn-md',
        lg: 'glass-btn-lg',
    };

    return (
        <motion.button
            className={`glass-btn ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'glass-btn-full' : ''} ${className}`}
            onClick={onClick}
            disabled={disabled || loading}
            whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -2 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            transition={{ duration: 0.15 }}
            {...props}
        >
            {loading ? (
                <span className="glass-btn-spinner" />
            ) : (
                <>
                    {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
                    {children}
                    {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
                </>
            )}
        </motion.button>
    );
};

export default GlassButton;
