import React from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

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
    const baseClasses = "relative inline-flex items-center justify-center font-medium rounded-xl border transition-all duration-200 backdrop-blur-md overflow-hidden";

    const variantClasses = {
        default: 'bg-glass-bg-medium/50 border-glass-border-light text-white hover:bg-glass-bg-light/70 hover:shadow-lg',
        primary: 'bg-indigo-600/80 border-indigo-500/50 text-white hover:bg-indigo-600 shadow-indigo-500/20 hover:shadow-indigo-500/40',
        success: 'bg-emerald-600/80 border-emerald-500/50 text-white hover:bg-emerald-600 shadow-emerald-500/20',
        danger: 'bg-red-600/80 border-red-500/50 text-white hover:bg-red-600 shadow-red-500/20',
        ghost: 'bg-transparent border-transparent text-glass-text-secondary hover:bg-white/10 hover:text-white',
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs gap-1.5',
        md: 'px-4 py-2 text-sm gap-2',
        lg: 'px-6 py-3 text-base gap-3',
    };

    return (
        <motion.button
            className={twMerge(
                baseClasses,
                variantClasses[variant],
                sizeClasses[size],
                fullWidth && 'w-full',
                (disabled || loading) && 'opacity-60 cursor-not-allowed pointer-events-none',
                className
            )}
            onClick={onClick}
            disabled={disabled || loading}
            whileHover={!(disabled || loading) ? { scale: 1.02, y: -2 } : {}}
            whileTap={!(disabled || loading) ? { scale: 0.98 } : {}}
            {...props}
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <>
                    {Icon && iconPosition === 'left' && (
                        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
                    )}
                    {children}
                    {Icon && iconPosition === 'right' && (
                        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
                    )}
                </>
            )}
        </motion.button>
    );
};

export default GlassButton;
