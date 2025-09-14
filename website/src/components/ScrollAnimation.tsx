import React from 'react';
import { motion } from 'framer-motion';

interface ScrollAnimationProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
    duration?: number;
    distance?: number;
}

const ScrollAnimation: React.FC<ScrollAnimationProps> = ({
    children,
    className = '',
    delay = 0,
    direction = 'up',
    duration = 0.6,
    distance = 50
}) => {
    const getInitialPosition = () => {
        switch (direction) {
            case 'down':
                return { opacity: 0, y: -distance };
            case 'left':
                return { opacity: 0, x: distance };
            case 'right':
                return { opacity: 0, x: -distance };
            case 'scale':
                return { opacity: 0, scale: 0.8 };
            default:
                return { opacity: 0, y: distance };
        }
    };

    const getAnimatePosition = () => {
        switch (direction) {
            case 'scale':
                return { opacity: 1, scale: 1 };
            default:
                return { opacity: 1, x: 0, y: 0 };
        }
    };

    return (
        <motion.div
            initial={getInitialPosition()}
            whileInView={getAnimatePosition()}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
                duration,
                delay,
                ease: "easeOut"
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export default ScrollAnimation;
