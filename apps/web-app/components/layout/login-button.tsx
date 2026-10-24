import React from 'react';
import { darkTokens } from '@40labs/design-tokens';

interface LoginButtonProps {
  onClick?: () => void;
  className?: string;
  mobile?: boolean;
}

export function LoginButton({ onClick, className = '', mobile = false }: LoginButtonProps) {
  const handleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    // TODO: wire auth [no backend yet] [post-MVP]
    console.log("Log In button clicked (stub)");
    if (onClick) onClick();
  };

  if (mobile) {
    return (
      <button
        type="button"
        onClick={handleLogin}
        className={`w-full py-3 text-center text-sm font-bold rounded-full transition-transform active:scale-95 shadow-md ${className}`}
        style={{
          backgroundColor: darkTokens.colors.accent,
          color: darkTokens.colors.text,
          borderRadius: darkTokens.radius.pill,
        }}
      >
        Log In
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogin}
      className={`px-6 py-2.5 text-xs font-semibold rounded-full transition-transform active:scale-95 shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] outline-none ${className}`}
      style={{
        backgroundColor: darkTokens.colors.accent,
        color: darkTokens.colors.text,
        borderRadius: darkTokens.radius.pill,
      }}
    >
      Log In
    </button>
  );
}
