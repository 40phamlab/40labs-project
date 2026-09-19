"use client";

import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid } from 'lucide-react';
import { darkTokens } from '@40labs/design-tokens';
import { IconButton } from '@40labs/ui-components';
import { getTools } from '@/mock-data/tools';
import Link from 'next/link';

export function AppLauncherMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const tools = getTools();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <IconButton
        icon={<LayoutGrid size={20} />}
        label="App Launcher"
        intent="ghost"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          color: darkTokens.colors.text,
          boxShadow: darkTokens.elevation.skeuInset,
          backgroundColor: isOpen ? 'rgba(255,255,255,0.05)' : 'transparent'
        }}
        className="!w-10 !h-10"
      />

      {isOpen && (
        <div
          className="absolute right-0 mt-4 w-72 p-4 z-50 overflow-hidden"
          style={{
            backgroundColor: darkTokens.colors.bg,
            borderRadius: darkTokens.radius.card,
            boxShadow: darkTokens.elevation.skeuOuter,
            border: `1px solid ${darkTokens.colors.highlight}33`,
          }}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider mb-4 opacity-50" style={{ color: darkTokens.colors.text }}>
            Our Tools
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {tools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                onClick={() => setIsOpen(false)}
                className="flex flex-col items-center justify-center p-3 transition-all rounded-lg group hover:bg-white/5"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: darkTokens.colors.highlight,
                    boxShadow: darkTokens.elevation.skeuInset
                  }}
                >
                  <span className="text-white font-bold text-sm">
                    {tool.name[0]}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-center group-hover:text-accent transition-colors" style={{ color: darkTokens.colors.text }}>
                  {tool.name}
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
             <Link
               href="#"
               className="block w-full py-2 px-3 text-center text-xs font-bold rounded-lg transition-colors hover:bg-accent hover:text-white"
               style={{
                 backgroundColor: darkTokens.colors.highlight,
                 color: darkTokens.colors.text
               }}
             >
               Download Core Desktop
             </Link>
          </div>
        </div>
      )}
    </div>
  );
}
