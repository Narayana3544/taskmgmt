import React from 'react';
import { twMerge } from 'tailwind-merge';

const GlassInput = ({ icon: Icon, className, ...props }) => {
    return (
        <div className="relative w-full">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-glass-text-muted pointer-events-none">
                    <Icon size={18} />
                </div>
            )}
            <input
                className={twMerge(
                    "glass-input w-full",
                    Icon && "pl-10",
                    className
                )}
                {...props}
            />
        </div>
    );
};

export default GlassInput;
