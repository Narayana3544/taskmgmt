import React from 'react';
import { motion } from 'framer-motion';
import './GlassCard.css';

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
    none: 'glass-card-p-none',
    sm: 'glass-card-p-sm',
    md: 'glass-card-p-md',
    lg: 'glass-card-p-lg',
    xl: 'glass-card-p-xl',
  };

  const variantClasses = {
    default: 'glass-card',
    dark: 'glass-card glass-card-dark',
    light: 'glass-card glass-card-light',
  };

  return (
    <motion.div
      className={`${variantClasses[variant]} ${paddingClasses[padding]} ${hoverable ? 'glass-card-hoverable' : ''} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={hoverable ? { 
        y: -4,
        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
      } : {}}
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
  <div className={`glass-card-header ${className}`}>
    <div className="glass-card-title">
      {Icon && <Icon size={20} />}
      {title}
    </div>
    {actions && <div className="glass-card-actions">{actions}</div>}
  </div>
);

/**
 * GlassCard.Body - Card body content
 */
GlassCard.Body = ({ children, className = '' }) => (
  <div className={`glass-card-body ${className}`}>
    {children}
  </div>
);

/**
 * GlassCard.Footer - Card footer for actions
 */
GlassCard.Footer = ({ children, className = '' }) => (
  <div className={`glass-card-footer ${className}`}>
    {children}
  </div>
);

export default GlassCard;
