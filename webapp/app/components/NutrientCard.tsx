"use client";

import React from 'react';
import CircularProgress from './CircularProgress';

interface NutrientCardProps {
    label: string;
    value: number;
    total: number;
    unit: string;
    color: string;
    icon: React.ReactNode;
}

const NutrientCard: React.FC<NutrientCardProps> = ({ label, value, total, unit, color, icon }) => {
    const remaining = Math.max(0, total - value);

    return (
        <div className="bg-white rounded-[24px] p-3 shadow-sm border border-gray-100 flex flex-col items-center justify-between min-h-[150px] relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 right-0 w-full h-1 opacity-20" style={{ backgroundColor: color }}></div>

            <div className="mt-3 relative">
                <CircularProgress
                    value={value}
                    max={total}
                    size={56}
                    strokeWidth={5}
                    color={color}
                    icon={icon}
                />
            </div>

            <div className="text-center w-full mb-1">
                <div className="text-xl font-black text-gray-800 flex items-center justify-center gap-1">
                    <span>{remaining}</span>
                    <span className="text-[10px] font-medium text-gray-400">{unit}</span>
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    {label}
                </div>
            </div>
        </div>
    );
};

export default NutrientCard;
