'use client';

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = ({ className = '', hover = false, children, ...props }: CardProps) => {
  return (
    <div 
      className={`bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] ${hover ? 'transition-all duration-150 hover:shadow-xl hover:border-blue-500/20 active:scale-[0.995] hover:-translate-y-1' : 'shadow-sm'} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-8 border-b border-slate-100 dark:border-slate-800/50 ${className}`} {...props}>
    {children}
  </div>
);

export const CardContent = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-8 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800/50 ${className}`} {...props}>
    {children}
  </div>
);
