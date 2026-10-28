import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Cpu } from 'lucide-react';
import { TrustedBySection } from '@/components/company/TrustedBySection';

export default function CompanyLandingPage() {
  return (
    <div className="flex flex-col w-full text-[#F8FAFB]">

      {/* 1. HERO SECTION */}
      <section data-scene-step className="w-full max-w-7xl mx-auto px-6 sm:px-8 pt-24 sm:pt-36 pb-20 flex flex-col items-center text-center gap-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Biomedical Science &amp; Digital Healthcare Platform
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-bold tracking-tight max-w-4xl leading-[1.08]">
          Advancing Biomedical Science &amp; Clinical Infrastructure
        </h1>

        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl leading-relaxed font-normal">
          40Labs builds foundational digital operating systems, diagnostic workflows, and genomic sequencing platforms for clinical networks and researchers across East Africa.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/products"
            className="px-8 py-4 rounded-full text-sm font-bold bg-[#16A34A] text-white hover:bg-[#12803b] transition-transform active:scale-95 shadow-lg inline-flex items-center gap-2"
            style={{ borderRadius: '9999px' }}
          >
            <span>Explore Products</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/about"
            className="px-8 py-4 rounded-full text-sm font-bold bg-white/10 text-white hover:bg-white/20 transition-transform active:scale-95 border border-white/10 backdrop-blur-md"
            style={{ borderRadius: '9999px' }}
          >
            <span>About Our Mission</span>
          </Link>
        </div>
      </section>

      {/* 2. SCIENCE AND TECHNOLOGY */}
      <section data-scene-step className="w-full max-w-7xl mx-auto px-6 sm:px-8 py-24 border-t border-white/10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
              Molecular Intelligence &amp; Systems
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold leading-tight">
              At the Intersection of Biology and Advanced Computation
            </h2>
            <p className="text-base text-gray-300 leading-relaxed">
              Modern healthcare requires seamless coordination between molecular diagnostics, electronic clinical records, and regulatory compliance. We unify these pillars into a secure, high-performance ecosystem.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <h4 className="font-heading font-bold text-lg text-white mb-1">Genomic Pipelines</h4>
                <p className="text-xs text-gray-400">High-throughput sequencing analysis and surveillance tooling.</p>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <h4 className="font-heading font-bold text-lg text-white mb-1">Clinical ERP</h4>
                <p className="text-xs text-gray-400">Integrated dispensary, inventory, and patient record management.</p>
              </div>
            </div>
          </div>

          <div className="relative aspect-[4/3] rounded-[32px] overflow-hidden border border-white/10 bg-[#141A16] shadow-2xl flex items-center justify-center p-8">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#16A34A]/20 to-transparent pointer-events-none" />
            <div className="flex flex-col gap-6 z-10 max-w-md">
              <div className="w-12 h-12 rounded-2xl bg-[#16A34A]/20 text-[#16A34A] flex items-center justify-center">
                <Cpu size={28} />
              </div>
              <h3 className="text-2xl font-heading font-bold">Standardized Clinical Workflows</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Designed alongside medical practitioners to eliminate administrative friction and ensure robust data accuracy across every healthcare touchpoint.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRODUCTS AND PLATFORMS */}
      <section data-scene-step className="w-full max-w-7xl mx-auto px-6 sm:px-8 py-24 border-t border-white/10 relative z-10 flex flex-col gap-16">
        <div className="flex flex-col gap-4 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
            Integrated Platforms
          </span>
          <h2 className="text-3xl sm:text-5xl font-heading font-bold tracking-tight">
            Built for Pharmacies, Labs &amp; Clinical Networks
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed">
            Explore our core offerings backed by real-world operational testing across East Africa.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-16">
          {/* Product 1: Telemedicine & Clinical Operations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center rounded-[32px] border border-white/10 bg-[#121814]/80 backdrop-blur-md p-8 sm:p-12 shadow-xl">
            <div className="flex flex-col gap-6">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#16A34A]/20 text-[#16A34A] w-max">
                Clinical Workflow
              </span>
              <h3 className="text-2xl sm:text-3xl font-heading font-bold">Telehealth &amp; Integrated Operations</h3>
              <p className="text-base text-gray-300 leading-relaxed">
                Connect remote patients with practitioners securely. Manage prescriptions, consultations, and medical histories within a unified, encrypted interface.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#16A34A] hover:underline w-max group"
              >
                <span>Explore 40LabsCore</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="relative aspect-[16/10] rounded-[24px] overflow-hidden border border-white/10 shadow-lg">
              <Image
                src="/media/picture/telemed_doctor.png"
                alt="Telemedicine consultation workflow"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Product 2: Pharmacy & TRA Fiscal Sync */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center rounded-[32px] border border-white/10 bg-[#121814]/80 backdrop-blur-md p-8 sm:p-12 shadow-xl">
            <div className="relative aspect-[16/10] rounded-[24px] overflow-hidden border border-white/10 shadow-lg order-2 lg:order-1">
              <Image
                src="/media/picture/medd_accounting.png"
                alt="Pharmacy and accounting sync"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-6 order-1 lg:order-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#16A34A]/20 text-[#16A34A] w-max">
                Financial Compliance
              </span>
              <h3 className="text-2xl sm:text-3xl font-heading font-bold">Pharmacy Inventory &amp; TRA Fiscal Sync</h3>
              <p className="text-base text-gray-300 leading-relaxed">
                Automate tax calculations, track pharmaceutical stock levels in real time, and maintain strict compliance with Tanzanian Revenue Authority (TRA) standards.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#16A34A] hover:underline w-max group"
              >
                <span>View Inventory Solutions</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Product 3: Genomic Sequencing & vLabs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center rounded-[32px] border border-white/10 bg-[#121814]/80 backdrop-blur-md p-8 sm:p-12 shadow-xl">
            <div className="flex flex-col gap-6">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#16A34A]/20 text-[#16A34A] w-max">
                Diagnostics &amp; Sequencing
              </span>
              <h3 className="text-2xl sm:text-3xl font-heading font-bold">Genomic Sequencing &amp; vLabs</h3>
              <p className="text-base text-gray-300 leading-relaxed">
                Manage diagnostic orders, test results, and high-throughput sequence data with vLabs. Integrate laboratory workflows directly with patient electronic health records.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#16A34A] hover:underline w-max group"
              >
                <span>Learn About vLabs</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="relative aspect-[16/10] rounded-[24px] overflow-hidden border border-white/10 shadow-lg">
              <Image
                src="/media/picture/seq.png"
                alt="Genomic sequencing data analytics"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. RESEARCH AND PUBLICATIONS */}
      <section data-scene-step className="w-full max-w-7xl mx-auto px-6 sm:px-8 py-24 border-t border-white/10 relative z-10 flex flex-col gap-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="flex flex-col gap-4 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
              Scientific Rigor
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight">
              Research &amp; Publications
            </h2>
            <p className="text-base text-gray-300 leading-relaxed">
              Read our peer-reviewed whitepapers and empirical studies on digital healthcare infrastructure and pathogen surveillance.
            </p>
          </div>
          <Link
            href="/publications"
            className="px-6 py-3 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-colors w-max"
            style={{ borderRadius: '9999px' }}
          >
            View All Publications →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Pathogen Surveillance via High-Throughput Genomic Sequencing',
              type: 'Whitepaper',
              date: 'March 2025',
            },
            {
              title: 'Automated Fiscal Compliance in Pharmaceutical Supply Chains',
              type: 'Research Article',
              date: 'January 2025',
            },
            {
              title: 'Optimizing Inventory Turnover in Resource-Constrained Dispensaries',
              type: 'Case Study',
              date: 'November 2024',
            },
          ].map((pub) => (
            <div
              key={pub.title}
              className="rounded-[24px] border border-white/10 bg-[#141A16]/90 p-8 shadow-lg flex flex-col justify-between gap-6 hover:border-[#16A34A]/50 transition-colors"
              style={{ borderRadius: '24px' }}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-gray-300">
                    {pub.type}
                  </span>
                  <span className="text-xs text-gray-400">{pub.date}</span>
                </div>
                <h3 className="text-lg font-heading font-bold text-white leading-snug">{pub.title}</h3>
              </div>
              <Link href="/publications" className="text-xs font-semibold text-[#16A34A] hover:underline inline-flex items-center gap-1">
                <span>Read Publication</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 5. INSIGHTS & BLOG */}
      <section data-scene-step className="w-full max-w-7xl mx-auto px-6 sm:px-8 py-24 border-t border-white/10 relative z-10 flex flex-col gap-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="flex flex-col gap-4 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
              Industry Perspectives
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight">
              Insights &amp; Blog
            </h2>
            <p className="text-base text-gray-300 leading-relaxed">
              Expert commentary on regulatory updates, pharmacy digitization, and biomedical technology trends.
            </p>
          </div>
          <Link
            href="/blog"
            className="px-6 py-3 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-colors w-max"
            style={{ borderRadius: '9999px' }}
          >
            Visit Blog →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Digital Transformation in Tanzanian Pharmacies: TRA Fiscal Sync',
              category: 'Medical Tech',
              time: '4 min read',
            },
            {
              title: 'Integrating Laboratory Diagnostics with Electronic Medical Records',
              category: 'Clinical Operations',
              time: '6 min read',
            },
            {
              title: 'AI-Driven Inventory Forecasting for Essential Medicines',
              category: 'AI & Research',
              time: '5 min read',
            },
          ].map((post) => (
            <div
              key={post.title}
              className="rounded-[24px] border border-white/10 bg-[#141A16]/90 p-8 shadow-lg flex flex-col justify-between gap-6 hover:border-[#16A34A]/50 transition-colors"
              style={{ borderRadius: '24px' }}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-[#16A34A]/20 text-[#16A34A]">
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-400">{post.time}</span>
                </div>
                <h3 className="text-lg font-heading font-bold text-white leading-snug">{post.title}</h3>
              </div>
              <Link href="/blog" className="text-xs font-semibold text-[#16A34A] hover:underline inline-flex items-center gap-1">
                <span>Read Article</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 6. COMPANY & TRUST */}
      <section data-scene-step className="w-full max-w-7xl mx-auto px-6 sm:px-8 py-24 border-t border-white/10 relative z-10 flex flex-col gap-16">
        <div className="flex flex-col items-center text-center gap-4 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
            Institutional Trust
          </span>
          <h2 className="text-3xl sm:text-5xl font-heading font-bold tracking-tight">
            Trusted by Leading Healthcare Providers
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed">
            Collaborating with hospitals, pharmacies, and regulatory bodies across East Africa to build resilient clinical infrastructure.
          </p>
        </div>

        <TrustedBySection />

        <div className="flex justify-center pt-4">
          <Link
            href="/about"
            className="px-8 py-3.5 rounded-full text-sm font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-colors inline-flex items-center gap-2"
            style={{ borderRadius: '9999px' }}
          >
            <span>Learn More About 40Labs</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section data-scene-step className="w-full max-w-7xl mx-auto px-6 sm:px-8 py-20 relative z-10">
        <div className="rounded-[32px] bg-gradient-to-br from-[#16A34A]/20 via-[#141A16] to-[#1F2A33] border border-white/10 p-10 sm:p-16 flex flex-col items-center text-center gap-8 shadow-2xl">
          <h2 className="text-3xl sm:text-5xl font-heading font-bold max-w-2xl tracking-tight">
            Ready to Transform Your Healthcare Facility?
          </h2>
          <p className="text-base sm:text-lg text-gray-300 max-w-xl leading-relaxed">
            Join the growing network of clinics, hospitals, and pharmacies using 40Labs to power their operations.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/products"
              className="px-8 py-4 rounded-full text-sm font-bold bg-[#F97316] text-white hover:bg-orange-600 transition-transform active:scale-95 shadow-lg"
              style={{ borderRadius: '9999px' }}
            >
              Get Started Today
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 rounded-full text-sm font-bold bg-white/10 text-white hover:bg-white/20 border border-white/10"
              style={{ borderRadius: '9999px' }}
            >
              Contact Our Team
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
