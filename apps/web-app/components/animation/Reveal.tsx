"use client";

import React from "react";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
}

/**
 * Reveal component wrapper.
 */
export const Reveal: React.FC<RevealProps> = ({ children }) => {
  return <>{children}</>;
};

