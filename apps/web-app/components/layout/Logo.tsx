import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  variant?: 'dark' | 'light';
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ variant = 'dark', className = '', width = 120, height = 36 }: LogoProps) {
  const logoSrc = variant === 'light'
    ? '/media/logo/40labs-logo-on-light.svg'
    : '/media/logo/40labs-logo-on-dark.svg';

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-[#16A34A] rounded-lg ${className}`}
      aria-label="40Labs Home"
    >
      <div className="relative flex items-center transition-transform group-hover:scale-105">
        <Image
          src={logoSrc}
          alt="40Labs Logo"
          width={width}
          height={height}
          priority
          className="object-contain h-8 w-auto"
        />
      </div>
    </Link>
  );
}
