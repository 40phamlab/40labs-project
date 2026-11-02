'use client';

import React, { useState, useEffect } from 'react';
import { Type, Sun, Moon, BookOpen } from 'lucide-react';

interface ReaderControlsProps {
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  theme: 'dark' | 'light' | 'sepia';
  setTheme: (theme: 'dark' | 'light' | 'sepia') => void;
}

export function ReaderControls({ fontSize, setFontSize, theme, setTheme }: ReaderControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const cycleFontSize = () => {
    const next = fontSize === 'small' ? 'medium' : fontSize === 'medium' ? 'large' : 'small';
    setFontSize(next);
  };

  const cycleTheme = () => {
    const next = theme === 'dark' ? 'light' : theme === 'light' ? 'sepia' : 'dark';
    setTheme(next);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={cycleFontSize}
        title={`Font size: ${fontSize}`}
        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-mono"
      >
        <Type size={16} />
        <span className="capitalize">{fontSize[0]}</span>
      </button>

      <button
        onClick={cycleTheme}
        title={`Theme: ${theme}`}
        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-mono"
      >
        {theme === 'dark' ? <Moon size={16} /> : theme === 'light' ? <Sun size={16} /> : <BookOpen size={16} />}
        <span className="capitalize hidden sm:inline">{theme}</span>
      </button>
    </div>
  );
}
