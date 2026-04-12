'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownMenuProps {
  children: React.ReactNode;
}

export const DropdownMenu = ({ children }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggle = () => setIsOpen(!isOpen);

  // Inject setIsOpen into children (Trigger and Content)
  return (
    <div className="relative inline-block text-right" ref={containerRef}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // Check if it's the trigger
          if ((child.type as any).displayName === 'DropdownMenuTrigger') {
            return React.cloneElement(child as React.ReactElement<any>, { isOpen, toggle });
          }
          // Check if it's the content
          if ((child.type as any).displayName === 'DropdownMenuContent') {
            return <AnimatePresence>{isOpen && React.cloneElement(child as React.ReactElement<any>, { setIsOpen })}</AnimatePresence>;
          }
        }
        return child;
      })}
    </div>
  );
};

export const DropdownMenuTrigger = ({ children, asChild, toggle }: any) => {
  const content = asChild && React.isValidElement(children) 
    ? React.cloneElement(children as React.ReactElement<any>, { onClick: toggle })
    : <button onClick={toggle}>{children}</button>;
    
  return content;
};
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

export const DropdownMenuContent = ({ children, align = 'end', className = '', setIsOpen }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`absolute z-[100] mt-2 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden min-w-[12rem] ${align === 'end' ? 'right-0' : 'left-0'} ${className}`}
    >
      <div className="py-1">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, { 
              onClick: (e: any) => {
                 if ((child as any).props.onClick) (child as any).props.onClick(e);
                 setIsOpen(false);
              }
            });
          }
          return child;
        })}
      </div>
    </motion.div>
  );
};
DropdownMenuContent.displayName = 'DropdownMenuContent';

export const DropdownMenuItem = ({ children, className = '', onClick, ...props }: any) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-right relative z-10 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
DropdownMenuItem.displayName = 'DropdownMenuItem';
