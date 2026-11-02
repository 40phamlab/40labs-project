'use client';

import React, { useState, useEffect } from 'react';

export function ProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        setProgress(0);
        return;
      }
      const currentScroll = window.scrollY;
      const percentage = Math.min(100, Math.max(0, (currentScroll / totalHeight) * 100));
      setProgress(percentage);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-transparent z-50">
      <div
        className="h-full bg-[#16A34A] transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
