"use client";

import React from 'react';
import { darkTokens } from '@40labs/design-tokens';
import { Button } from '@40labs/ui-components';

export function SiteFooter() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Newsletter subscription submitted");
  };

  return (
    <footer
      className="w-full mt-auto py-16 px-6"
      style={{ backgroundColor: darkTokens.colors.highlight }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-12">
        {/* Link Columns */}
        {[
          { title: 'Platform', links: ['Services', 'Products', 'Tools', 'Articles'] },
          { title: 'Company', links: ['About Us', 'Contact', 'Partners', 'Careers'] },
          { title: 'Resources', links: ['Help Center', 'Blog', 'Developers', 'Status'] },
          { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security'] },
        ].map((col) => (
          <div key={col.title} className="flex flex-col gap-6">
            <h4 className="font-heading font-bold text-sm uppercase tracking-wider" style={{ color: darkTokens.colors.text }}>
              {col.title}
            </h4>
            <ul className="flex flex-col gap-3">
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-xs transition-colors hover:opacity-80" style={{ color: darkTokens.colors.text }}>
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Newsletter */}
        <div className="flex flex-col gap-6">
          <h4 className="font-heading font-bold text-sm uppercase tracking-wider" style={{ color: darkTokens.colors.text }}>
            Stay Updated
          </h4>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="subscribe to our news letter"
              className="w-full h-11 px-5 text-xs focus:outline-none transition-shadow"
              style={{
                backgroundColor: darkTokens.colors.bg,
                color: darkTokens.colors.text,
                borderRadius: darkTokens.radius.pill,
                border: 'none',
              }}
              required
            />
            <Button
              type="submit"
              size="md"
              style={{
                backgroundColor: '#000000',
                color: '#ffffff',
                borderRadius: darkTokens.radius.pill,
                border: 'none',
                fontWeight: 600,
              }}
            >
              Subscribe
            </Button>
          </form>
        </div>
      </div>

      {/* Bottom info */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
         <p className="text-tiny opacity-60" style={{ color: darkTokens.colors.text }}>
           © {new Date().getFullYear()} 40Labs. All rights reserved. Built for the future of healthcare.
         </p>
         <div className="flex gap-6">
            {['Twitter', 'LinkedIn', 'Github'].map(social => (
              <a key={social} href="#" className="text-tiny opacity-60 hover:opacity-100 transition-opacity" style={{ color: darkTokens.colors.text }}>
                {social}
              </a>
            ))}
         </div>
      </div>
    </footer>
  );
}
