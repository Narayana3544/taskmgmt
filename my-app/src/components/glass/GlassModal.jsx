import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import './GlassModal.css';

/**
 * GlassModal - A premium glassmorphism modal component
 * with smooth animations and backdrop blur.
 */
const GlassModal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnBackdrop = true,
}) => {
    const sizeClasses = {
        sm: 'glass-modal-sm',
        md: 'glass-modal-md',
        lg: 'glass-modal-lg',
        xl: 'glass-modal-xl',
        full: 'glass-modal-full',
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && closeOnBackdrop) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="glass-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleBackdropClick}
                >
                    <motion.div
                        className={`glass-modal ${sizeClasses[size]}`}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{
                            duration: 0.3,
                            ease: [0.34, 1.56, 0.64, 1]
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="glass-modal-header">
                            <h2 className="glass-modal-title">{title}</h2>
                            {showCloseButton && (
                                <motion.button
                                    className="glass-modal-close"
                                    onClick={onClose}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <X size={20} />
                                </motion.button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="glass-modal-content">
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

/**
 * GlassModal.Footer - Modal footer for action buttons
 */
GlassModal.Footer = ({ children, className = '' }) => (
    <div className={`glass-modal-footer ${className}`}>
        {children}
    </div>
);

export default GlassModal;
