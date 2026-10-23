import React from 'react';
import { CompanyHeader } from '@/components/company/CompanyHeader';
import { CompanyFooter } from '@/components/company/CompanyFooter';

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex flex-col antialiased selection:bg-orange-500 selection:text-white"
      style={{
        backgroundColor: '#E4E9EC',
        color: '#1F2A33',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <CompanyHeader />
      <main className="flex-1 flex flex-col">{children}</main>
      <CompanyFooter />
    </div>
  );
}
