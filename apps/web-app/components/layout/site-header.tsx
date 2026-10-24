"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { darkTokens } from '@40labs/design-tokens';
import { IconButton } from '@40labs/ui-components';
import { LogoSlot } from './logo-slot';
import { NavLinks } from './nav-links';
import { LoginButton } from './login-button';
import { MobileMenu } from './mobile-menu';

export function SiteHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-center ${
        isScrolled
          ? 'backdrop-blur-md shadow-lg border-b border-white/5'
          : 'bg-transparent'
      }`}
      style={{
        backgroundColor: isScrolled ? `${darkTokens.colors.bg}E6` : 'transparent',
      }}
    >
      <div
        className="w-full max-w-7xl h-16 px-6 sm:px-8 flex items-center justify-between"
        style={{
          backgroundColor: darkTokens.colors.surfaceSecondary,
          borderRadius: darkTokens.radius.pill,
          boxShadow: `${darkTokens.elevation.skeuOuter}, ${darkTokens.elevation.skeuInset}`,
          border: `1px solid ${darkTokens.colors.border}`,
        }}
      >
        {/* Logo Slot */}
        <LogoSlot />

        {/* Desktop Navigation Links */}
        <NavLinks />

        {/* Desktop Right Action: Log In button */}
        <div className="hidden md:flex items-center gap-3">
          <LoginButton />
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <IconButton
            icon={<Menu size={22} />}
            label="Open Menu"
            intent="ghost"
            onClick={() => setMobileMenuOpen(true)}
            className="!w-10 !h-10 text-white"
          />
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </header>
  );
}
