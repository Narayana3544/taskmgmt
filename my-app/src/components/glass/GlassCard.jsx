import React from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

/**
 * GlassCard - A premium glassmorphism card component
 * with hover animations and customizable styling.
 */
const GlassCard = ({
  children,
  className = '',
  onClick,
  hoverable = true,
  variant = 'default', // 'default' | 'dark' | 'light'
  padding = 'lg',
  ...props
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const variantClasses = {
    default: 'bg-glass-bg-card',
    dark: 'bg-glass-bg-dark border-glass-border-medium',
    light: 'bg-glass-bg-light border-glass-border-light',
  };

  return (
    <motion.div
      className={twMerge(clsx(
        'backdrop-blur-glass border border-glass-border-light rounded-2xl shadow-lg transition-all duration-300',
        variantClasses[variant],
        paddingClasses[padding],
        hoverable && 'hover:shadow-2xl hover:border-white/20 hover:-translate-y-1',
        className
      ))}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * GlassCard.Header - Card header with title and optional actions
 */
GlassCard.Header = ({ title, icon: Icon, actions, className = '' }) => (
  <div className={twMerge("flex items-center justify-between mb-4 pb-4 border-b border-glass-border-medium", className)}>
    <div className="flex items-center gap-2 text-xl font-semibold text-white">
      {Icon && <Icon size={20} className="text-glass-accent-primary" />}
      {title}
    </div>
    {actions && <div className="flex gap-2">{actions}</div>}
  </div>
);

/**
 * GlassCard.Body - Card body content
 */
GlassCard.Body = ({ children, className = '' }) => (
  <div className={twMerge("text-glass-text-secondary", className)}>
    {children}
  </div>
);

/**
 * GlassCard.Footer - Card footer for actions
 */
GlassCard.Footer = ({ children, className = '' }) => (
  <div className={twMerge("mt-6 pt-4 border-t border-glass-border-medium flex justify-end gap-3", className)}>
    {children}
  </div>
);

export default GlassCard;
