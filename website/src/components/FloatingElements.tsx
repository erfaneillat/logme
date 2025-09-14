import React from 'react';
import { motion } from 'framer-motion';

interface FloatingElementProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    amplitude?: number;
    className?: string;
}

const FloatingElement: React.FC<FloatingElementProps> = ({
    children,
    delay = 0,
    duration = 3,
    amplitude = 20,
    className = ''
}) => {
    return (
        <motion.div
            className={className}
            animate={{
                y: [0, -amplitude, 0],
                rotate: [0, 2, -2, 0]
            }}
            transition={{
                duration,
                delay,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        >
            {children}
        </motion.div>
    );
};

export default FloatingElement;
