"use client";

import React from 'react';
import Link from 'next/link';

export function CompanyFooter() {
  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire auth [no backend yet] [post-MVP]
    console.log("Newsletter subscription stubbed");
  };

  return (
    <footer className="w-full pb-16 px-4 sm:px-8">
      {/* Large outlined rounded container footer shell */}
      <div
        className="max-w-7xl mx-auto rounded-[32px] border border-[#B6C2CC] bg-[#FFFFFF] p-8 sm:p-16 shadow-lg flex flex-col gap-12"
        style={{ borderRadius: '32px' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#16A34A] flex items-center justify-center text-white font-bold text-xs">
                40
              </div>
              <span className="font-heading font-bold text-lg text-[#1F2A33]">40Labs</span>
            </div>
            <p className="text-sm text-[#4A5568] max-w-sm leading-relaxed">
              The digital healthcare operating system for East Africa. Connecting patients, clinics, pharmacies, and suppliers.
            </p>
          </div>

          {/* Links Cols */}
          {[
            { title: 'Platform', links: ['Products', 'Services', 'Tools', 'Pricing'] },
            { title: 'Company', links: ['About Us', 'Publications', 'Careers', 'Contact'] },
            { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Security', 'Compliance'] },
          ].map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1F2A33]">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-xs text-[#55636E] hover:text-[#16A34A] transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter & Bottom Row */}
        <div className="pt-8 border-t border-[#B6C2CC]/40 flex flex-col lg:flex-row items-center justify-between gap-6">
          <form onSubmit={handleNewsletter} className="w-full lg:w-auto flex items-center gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              required
              className="h-11 px-5 rounded-full border border-[#B6C2CC] bg-[#E4E9EC] text-xs text-[#1F2A33] focus:outline-none focus:ring-2 focus:ring-[#16A34A] w-full sm:w-80"
              style={{ borderRadius: '9999px' }}
            />
            <button
              type="submit"
              className="px-6 h-11 rounded-full text-xs font-bold bg-[#1F2A33] text-white hover:bg-black transition-transform active:scale-95 shrink-0"
              style={{ borderRadius: '9999px' }}
            >
              Subscribe
            </button>
          </form>

          <p className="text-xs text-[#55636E]">
            © {new Date().getFullYear()} 40Labs. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
