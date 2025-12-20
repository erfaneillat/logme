"use client";

import React, { useState, useEffect, useRef } from 'react';

interface KitchenItemImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    fallback: React.ReactNode;
}

const KitchenItemImage: React.FC<KitchenItemImageProps> = ({ src, fallback, alt, className, ...props }) => {
    const [currentSrc, setCurrentSrc] = useState(src);
    const [hasError, setHasError] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 3;
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Reset state when src prop changes
        setCurrentSrc(src);
        setHasError(false);
        setIsRetrying(false);
        setRetryCount(0);

        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
        }
    }, [src]);

    const handleError = () => {
        if (retryCount < maxRetries) {
            // Hide the broken image immediately
            setIsRetrying(true);

            // Calculate delay: simple backoff
            const delay = 1000 + (retryCount * 1000);

            retryTimeoutRef.current = setTimeout(() => {
                setRetryCount(prev => prev + 1);
                // Append timestamp to bust cache if it's a URL
                const separator = src.includes('?') ? '&' : '?';
                setCurrentSrc(`${src}${separator}retry=${Date.now()}`);
                setIsRetrying(false); // Show image again to try loading
            }, delay);
        } else {
            setHasError(true);
        }
    };

    // Show fallback if:
    // 1. We have a permanent error
    // 2. The src is invalid
    // 3. We are currently waiting to retry (so user doesn't see broken image icon)
    if (hasError || !src || !src.startsWith('http') || isRetrying) {
        return <>{fallback}</>;
    }

    return (
        <img
            {...props}
            src={currentSrc}
            alt={alt}
            className={className}
            onError={handleError}
        />
    );
};

export default KitchenItemImage;
