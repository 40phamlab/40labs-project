"use client";

import React from "react";
import { Reveal } from "./Reveal";

interface RevealGroupProps {
  children: React.ReactNode[];
  staggerDelay?: number;
}

/**
 * A wrapper for a group of elements to be revealed with a stagger effect.
 */
export const RevealGroup: React.FC<RevealGroupProps> = ({
  children,
  staggerDelay = 0.08,
}) => {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <Reveal key={index} delay={index * staggerDelay}>
          {child}
        </Reveal>
      ))}
    </>
  );
};
