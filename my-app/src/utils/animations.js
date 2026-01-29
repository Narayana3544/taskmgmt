import { motion } from 'framer-motion';

/**
 * Premium Animation Variants for Framer Motion
 * Reusable animation configurations for consistent UX
 */

// Stagger container for list animations
export const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

// Fade up animation for list items
export const fadeUpItem = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
        },
    },
};

// Scale in for modals/popups
export const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    show: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.3,
            ease: [0.34, 1.56, 0.64, 1], // Spring-like
        },
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        transition: { duration: 0.2 },
    },
};

// Slide from left (sidebar)
export const slideFromLeft = {
    hidden: { x: -280, opacity: 0 },
    show: {
        x: 0,
        opacity: 1,
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
        },
    },
    exit: {
        x: -280,
        opacity: 0,
        transition: { duration: 0.3 },
    },
};

// Slide from right (panels)
export const slideFromRight = {
    hidden: { x: 280, opacity: 0 },
    show: {
        x: 0,
        opacity: 1,
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
        },
    },
    exit: {
        x: 280,
        opacity: 0,
        transition: { duration: 0.3 },
    },
};

// Page transition
export const pageVariant = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
        },
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: { duration: 0.3 },
    },
};

// Hover scale effect
export const hoverScale = {
    scale: 1.02,
    transition: { duration: 0.2 },
};

// Tap press effect
export const tapScale = {
    scale: 0.98,
};

// Card hover
export const cardHover = {
    y: -4,
    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
    transition: { duration: 0.2 },
};

// Shimmer effect for loading
export const shimmer = {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
    },
};

// Number counting animation
export const countUp = (end, duration = 1) => {
    return {
        initial: { count: 0 },
        animate: {
            count: end,
            transition: { duration },
        },
    };
};

// Pulse effect
export const pulse = {
    scale: [1, 1.05, 1],
    transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
    },
};

// Notification badge pop
export const badgePop = {
    initial: { scale: 0 },
    animate: { scale: 1 },
    transition: {
        type: 'spring',
        stiffness: 500,
        damping: 15,
    },
};

/**
 * AnimatedPage wrapper component
 */
export const AnimatedPage = ({ children }) => (
    <motion.div
        variants={pageVariant}
        initial="initial"
        animate="animate"
        exit="exit"
    >
        {children}
    </motion.div>
);

/**
 * AnimatedList wrapper for staggered lists
 */
export const AnimatedList = ({ children, className = '' }) => (
    <motion.div
        className={className}
        variants={staggerContainer}
        initial="hidden"
        animate="show"
    >
        {children}
    </motion.div>
);

/**
 * AnimatedItem for list children
 */
export const AnimatedItem = ({ children, className = '' }) => (
    <motion.div className={className} variants={fadeUpItem}>
        {children}
    </motion.div>
);

export default {
    staggerContainer,
    fadeUpItem,
    scaleIn,
    slideFromLeft,
    slideFromRight,
    pageVariant,
    hoverScale,
    tapScale,
    cardHover,
    shimmer,
    countUp,
    pulse,
    badgePop,
    AnimatedPage,
    AnimatedList,
    AnimatedItem,
};
