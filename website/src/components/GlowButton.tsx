import React from 'react';
import { motion } from 'framer-motion';

interface GlowButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    glowColor?: string;
    pulseDuration?: number;
}

const GlowButton: React.FC<GlowButtonProps> = ({
    children,
    onClick,
    className = '',
    glowColor = 'rgba(255, 255, 255, 0.3)',
    pulseDuration = 2
}) => {
    return (
        <motion.button
            onClick={onClick}
            className={`relative overflow-hidden ${className}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
                boxShadow: [
                    `0 0 0px ${glowColor}`,
                    `0 0 20px ${glowColor}`,
                    `0 0 0px ${glowColor}`
                ]
            }}
            transition={{
                boxShadow: {
                    duration: pulseDuration,
                    repeat: Infinity,
                    ease: "easeInOut"
                },
                scale: { duration: 0.2 }
            }}
        >
            {children}
        </motion.button>
    );
};

export default GlowButton;
