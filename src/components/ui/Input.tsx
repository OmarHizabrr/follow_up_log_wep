'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  sizeVariant?: 'sm' | 'md' | 'lg';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, sizeVariant = 'lg', className = '', ...props }, ref) => {
    const sizes = {
      sm: 'h-10 text-xs px-4',
      md: 'h-12 text-sm px-5',
      lg: 'h-14 text-sm px-5',
    };

    const iconPadding = {
      sm: Icon ? 'pr-11' : '',
      md: Icon ? 'pr-14' : '',
      lg: Icon ? 'pr-14' : '',
    };

    const iconSizes = {
      sm: 16,
      md: 18,
      lg: 20,
    };

    const iconRight = {
      sm: 'right-4',
      md: 'right-5',
      lg: 'right-5',
    };

    return (
      <div className="space-y-2.5 w-full text-right">
        {label && (
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {Icon && (
            <div className={`absolute ${iconRight[sizeVariant]} top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors`}>
              <Icon size={iconSizes[sizeVariant]} />
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-white dark:bg-slate-900 
              border border-slate-200 dark:border-slate-800 
              rounded-2xl transition-all
              ${sizes[sizeVariant]}
              ${iconPadding[sizeVariant]}
              font-bold
              focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:outline-none
              disabled:opacity-50 disabled:bg-slate-50
              ${error ? 'border-red-500 focus:ring-red-500/5 focus:border-red-500' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="text-[10px] font-bold text-red-500 px-1 uppercase tracking-tight">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
