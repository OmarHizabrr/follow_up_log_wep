'use client';

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = ({ className = '', hover = false, children, ...props }: CardProps) => {
  return (
    <div 
      className={`bg-white dark:bg-[#0f172a] border border-emerald-100/70 dark:border-emerald-900/35 rounded-xl ${
        hover ? 'transition-shadow duration-150 hover:shadow-md' : 'shadow-sm'
      } ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-4 sm:p-6 lg:p-8 border-b border-emerald-100/80 dark:border-emerald-900/30 ${className}`} {...props}>
    {children}
  </div>
);

export const CardContent = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-4 sm:p-6 lg:p-8 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-4 sm:p-6 bg-emerald-50/40 dark:bg-emerald-900/10 border-t border-emerald-100/80 dark:border-emerald-900/30 ${className}`} {...props}>
    {children}
  </div>
);
