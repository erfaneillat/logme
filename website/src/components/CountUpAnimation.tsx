import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';

interface CountUpAnimationProps {
    from: number;
    to: number;
    duration?: number;
    suffix?: string;
    className?: string;
}

const CountUpAnimation: React.FC<CountUpAnimationProps> = ({
    from,
    to,
    duration = 2,
    suffix = '',
    className = ''
}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const [displayValue, setDisplayValue] = useState(from);

    const spring = useSpring(from, { stiffness: 100, damping: 30 });
    const display = useTransform(spring, (current) => Math.round(current));

    useEffect(() => {
        if (isInView) {
            spring.set(to);
        }
    }, [isInView, spring, to]);

    useEffect(() => {
        const unsubscribe = display.onChange((value) => {
            setDisplayValue(value);
        });
        return unsubscribe;
    }, [display]);

    return (
        <motion.span
            ref={ref}
            className={className}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5 }}
        >
            {displayValue}{suffix}
        </motion.span>
    );
};

export default CountUpAnimation;
