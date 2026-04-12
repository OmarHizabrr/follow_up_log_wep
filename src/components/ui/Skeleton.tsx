'use client';

import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton = ({ className = '', ...props }: SkeletonProps) => {
  return (
    <div 
      className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md ${className}`} 
      {...props} 
    />
  );
};
