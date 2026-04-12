'use client';

import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'slate';
}

export const Badge = ({ variant = 'info', className = '', children, ...props }: BadgeProps) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/20',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-900/10 dark:text-amber-400 border-amber-100 dark:border-amber-800/20',
    error: 'bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400 border-red-100 dark:border-red-800/20',
    info: 'bg-blue-50 text-blue-600 dark:bg-blue-900/10 dark:text-blue-400 border-blue-100 dark:border-blue-800/20',
    slate: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-100 dark:border-slate-700/20',
  };

  return (
    <div 
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl text-[11px] font-bold border ${variants[variant]} ${className}`} 
      {...props}
    >
      <div className={`w-1 h-1 rounded-full ${
        variant === 'success' ? 'bg-emerald-500' : 
        variant === 'warning' ? 'bg-amber-500' : 
        variant === 'error' ? 'bg-red-500' : 
        variant === 'info' ? 'bg-blue-500' : 'bg-slate-400'
      }`}></div>
      {children}
    </div>
  );
};
