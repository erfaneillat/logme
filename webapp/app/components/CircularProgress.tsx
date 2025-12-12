"use client";

import React from 'react';

interface CircularProgressProps {
    value: number;
    max: number;
    size?: number;
    strokeWidth?: number;
    color: string;
    icon?: React.ReactNode;
    showValue?: boolean;
    label?: string;
    subLabel?: string;
    reverse?: boolean;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
    value,
    max,
    size = 120,
    strokeWidth = 8,
    color,
    icon,
    showValue = false,
    label,
    subLabel,
    reverse = false,
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const safeValue = Math.min(Math.max(value, 0), max);

    const percentage = (safeValue / max) * 100;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90 transition-all duration-1000 ease-out"
            >
                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-gray-100"
                />
                {/* Progress Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>

            {/* Content Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {icon && <div className="mb-1">{icon}</div>}
                {showValue && (
                    <span className="text-3xl font-bold text-gray-800 tracking-tight">
                        {Math.round(reverse ? max - value : value)}
                    </span>
                )}
                {label && <span className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-1">{label}</span>}
            </div>

            {subLabel && (
                <div className="absolute -bottom-8 w-full text-center">
                    <span className="text-sm text-gray-500">{subLabel}</span>
                </div>
            )}
        </div>
    );
};

export default CircularProgress;
