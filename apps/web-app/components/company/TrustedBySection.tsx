import React from 'react';

export function TrustedBySection() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-20 flex flex-col items-center gap-12">
      <h2 className="font-heading font-bold text-sm uppercase tracking-widest text-[#55636E]">
        Trusted By
      </h2>

      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="h-24 rounded-[16px] border border-[#B6C2CC] bg-[#FFFFFF] flex items-center justify-center shadow-sm"
            style={{ borderRadius: '16px' }}
          >
            <span className="font-mono text-xs uppercase tracking-wider text-[#55636E]/60">
              Partner Logo {idx}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
