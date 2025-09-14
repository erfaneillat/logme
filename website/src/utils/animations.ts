import { Variants } from 'framer-motion';

// Common animation variants
export const fadeInUp: Variants = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -60 }
};

export const fadeInDown: Variants = {
    initial: { opacity: 0, y: -60 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 60 }
};

export const fadeInLeft: Variants = {
    initial: { opacity: 0, x: -60 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 60 }
};

export const fadeInRight: Variants = {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 }
};

export const scaleIn: Variants = {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.5 }
};

export const staggerContainer: Variants = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

export const staggerItem: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
};

// Transition presets
export const smoothTransition = {
    duration: 0.6,
    ease: "easeOut"
};

export const springTransition = {
    type: "spring",
    damping: 25,
    stiffness: 200
};

export const bounceTransition = {
    type: "spring",
    damping: 10,
    stiffness: 100
};

// Hover animations
export const hoverScale = {
    scale: 1.05,
    transition: { duration: 0.2 }
};

export const hoverLift = {
    y: -5,
    transition: { duration: 0.2 }
};

export const hoverRotate = {
    rotate: 360,
    transition: { duration: 0.5 }
};

// Pulse animation
export const pulseAnimation = {
    scale: [1, 1.05, 1],
    transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
    }
};

// Floating animation
export const floatingAnimation = {
    y: [0, -20, 0],
    transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
    }
};

// Glow animation
export const glowAnimation = {
    boxShadow: [
        "0 0 0px rgba(255, 255, 255, 0.3)",
        "0 0 20px rgba(255, 255, 255, 0.6)",
        "0 0 0px rgba(255, 255, 255, 0.3)"
    ],
    transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
    }
};

// Page transition variants
export const pageVariants = {
    initial: {
        opacity: 0,
        x: -200,
        scale: 0.8
    },
    in: {
        opacity: 1,
        x: 0,
        scale: 1
    },
    out: {
        opacity: 0,
        x: 200,
        scale: 1.2
    }
};

export const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
};

// Text reveal animation
export const textReveal: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.8,
            ease: "easeOut"
        }
    }
};

// Icon animations
export const iconBounce: Variants = {
    animate: {
        y: [0, -10, 0],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};

export const iconRotate: Variants = {
    animate: {
        rotate: [0, 10, -10, 0],
        transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};

// Card animations
export const cardHover: Variants = {
    initial: { scale: 1, y: 0 },
    hover: {
        scale: 1.05,
        y: -10,
        transition: { duration: 0.3 }
    }
};

export const cardTap: Variants = {
    initial: { scale: 1 },
    tap: { scale: 0.95 }
};

// Loading animations
export const loadingSpin = {
    rotate: 360,
    transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
    }
};

export const loadingPulse = {
    scale: [1, 1.2, 1],
    opacity: [1, 0.5, 1],
    transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
    }
};

// Utility functions
export const createStaggerAnimation = (delay: number = 0.1) => ({
    animate: {
        transition: {
            staggerChildren: delay
        }
    }
});

export const createDelayAnimation = (delay: number) => ({
    transition: {
        delay
    }
});

export const createInfiniteAnimation = (keyframes: any, duration: number = 2) => ({
    animate: keyframes,
    transition: {
        duration,
        repeat: Infinity,
        ease: "easeInOut"
    }
});
