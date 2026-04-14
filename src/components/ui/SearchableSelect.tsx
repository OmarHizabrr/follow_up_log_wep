'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  value,
  options,
  onChange,
  placeholder = 'اختر قيمة',
  searchPlaceholder = 'ابحث...',
  emptyText = 'لا توجد نتائج مطابقة',
  className = '',
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxId = useId();

  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase())),
    [options, query]
  );
  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const closeDropdown = () => {
    setIsOpen(false);
    setQuery('');
  };

  const selectOption = (nextValue: string) => {
    onChange(nextValue);
    closeDropdown();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      const selectedIndex = filtered.findIndex((option) => option.value === value);
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
      setIsOpen(true);
      return;
    }
    if (!isOpen) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, Math.max(filtered.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const option = filtered[highlightedIndex];
      if (option) selectOption(option.value);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeDropdown();
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`} dir="rtl" onKeyDown={handleKeyDown}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          const selectedIndex = filtered.findIndex((option) => option.value === value);
          setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
          setIsOpen((prev) => !prev);
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 font-bold text-sm text-right flex items-center justify-between disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <span className={`${selected ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-lg overflow-hidden">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setHighlightedIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full h-10 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 pr-10 pl-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-colors"
                />
              </div>
            </div>

            <div id={listboxId} role="listbox" className="max-h-60 overflow-y-auto custom-scrollbar p-2">
              {filtered.length > 0 ? (
                filtered.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => selectOption(option.value)}
                    className={`w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-sm font-bold text-right transition-colors ${
                      highlightedIndex === index
                        ? 'bg-slate-100 dark:bg-slate-800'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <span>{option.label}</span>
                    {option.value === value ? <Check className="w-4 h-4 text-blue-600" /> : null}
                  </button>
                ))
              ) : (
                <div className="px-3 py-6 text-center text-xs font-bold text-slate-400">{emptyText}</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
