import React from 'react';
import { motion } from 'framer-motion';

interface ParticleProps {
    delay: number;
    duration: number;
    size: number;
    x: number;
    y: number;
    color: string;
}

const Particle: React.FC<ParticleProps> = ({ delay, duration, size, x, y, color }) => {
    return (
        <motion.div
            className="absolute rounded-full opacity-30"
            style={{
                width: size,
                height: size,
                backgroundColor: color,
                left: `${x}%`,
                top: `${y}%`,
            }}
            animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.2, 1],
            }}
            transition={{
                duration,
                delay,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        />
    );
};

interface BackgroundParticlesProps {
    count?: number;
    colors?: string[];
}

const BackgroundParticles: React.FC<BackgroundParticlesProps> = ({
    count = 20,
    colors = ['#ffffff', '#10b981', '#3b82f6', '#f59e0b']
}) => {
    const particles = Array.from({ length: count }, (_, i) => ({
        id: i,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4,
        size: 2 + Math.random() * 4,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
    }));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle) => (
                <Particle
                    key={particle.id}
                    delay={particle.delay}
                    duration={particle.duration}
                    size={particle.size}
                    x={particle.x}
                    y={particle.y}
                    color={particle.color}
                />
            ))}
        </div>
    );
};

export default BackgroundParticles;
