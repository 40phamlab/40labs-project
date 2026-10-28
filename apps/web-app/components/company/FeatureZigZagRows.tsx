import React from 'react';
import Image from 'next/image';

interface ImageSlotProps {
  src: string;
  alt: string;
}

function ImageSlot({ src, alt }: ImageSlotProps) {
  return (
    <div
      className="w-full aspect-[16/10] rounded-[24px] overflow-hidden border border-[#B6C2CC]/60 bg-[#DCE3E7] shadow-lg relative group"
      style={{ borderRadius: '24px' }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  );
}

export function FeatureZigZagRows() {
  const placeholderText = "Streamline your entire healthcare business with Core. Connect patients, prescriptions, inventory, and analytics in one secure East African clinical ecosystem.";

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-20 flex flex-col gap-24">

      {/* Row A: Image Left + Paragraph Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
        <ImageSlot src="/media/picture/telemed_doctor.png" alt="Telemedicine consultation workflow" />
        <div className="flex flex-col gap-6 relative">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
            Clinical Workflow
          </span>
          <h3 className="text-2xl sm:text-3xl font-heading font-bold text-[#1F2A33]">
            Integrated Clinical Operations &amp; Telehealth
          </h3>
          <p className="text-base text-[#4A5568] leading-relaxed">
            {placeholderText}
          </p>

          <div
            className="absolute -bottom-8 right-0 w-24 h-12 rounded-[16px] shadow-md hidden sm:block"
            style={{
              backgroundColor: '#F97316',
              borderRadius: '16px',
            }}
          />
        </div>
      </div>

      {/* Row B: Image Left + Paragraph Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <ImageSlot src="/media/picture/medd_accounting.png" alt="Pharmacy and accounting sync" />
        <div className="flex flex-col gap-6">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
            Financial Compliance
          </span>
          <h3 className="text-2xl sm:text-3xl font-heading font-bold text-[#1F2A33]">
            Real-Time Pharmacy &amp; TRA Fiscal Sync
          </h3>
          <p className="text-base text-[#4A5568] leading-relaxed">
            Automate tax calculations, track prescriptions instantly, and maintain strict compliance with Tanzanian Revenue Authority (TRA) standards effortlessly.
          </p>
        </div>
      </div>

      {/* Row C: Paragraph Left + Image Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-6 order-2 lg:order-1">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
            Genomic &amp; Diagnostic Intelligence
          </span>
          <h3 className="text-2xl sm:text-3xl font-heading font-bold text-[#1F2A33]">
            Advanced AI &amp; Epidemiological Sequencing
          </h3>
          <p className="text-base text-[#4A5568] leading-relaxed">
            Harness high-throughput sequence analysis and predictive AI diagnostics to monitor public health trends and elevate patient care outcomes.
          </p>
        </div>
        <div className="order-1 lg:order-2">
          <ImageSlot src="/media/picture/seq.png" alt="Genomic sequencing data analytics" />
        </div>
      </div>

    </section>
  );
}

export const FeatureRows = FeatureZigZagRows;
