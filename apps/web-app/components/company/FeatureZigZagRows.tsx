import React from 'react';

interface ImageSlotProps {
  label: string;
}

function ImageSlot({ label }: ImageSlotProps) {
  return (
    <div
      className="w-full aspect-[16/10] rounded-[20px] flex items-center justify-center border border-[#B6C2CC] bg-[#DCE3E7] shadow-inner"
      style={{ borderRadius: '20px' }}
    >
      <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#55636E]">
        Image: {label}
      </span>
    </div>
  );
}

export function FeatureZigZagRows() {
  const placeholderText = "Streamline your entire healthcare business with Core. Connect patients, prescriptions, inventory, and analytics in one secure East African clinical ecosystem.";

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-20 flex flex-col gap-24">

      {/* Row A: Image Left + Paragraph Right + Orange Accent Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
        <ImageSlot label="telemedicine-workflow" />
        <div className="flex flex-col gap-6 relative">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
          </span>
          <h3 className="text-2xl sm:text-3xl font-heading font-bold text-[#1F2A33]">
            Integrated Clinical Operations
          </h3>
          <p className="text-base text-[#4A5568] leading-relaxed">
            {placeholderText}
          </p>

          {/* Empty orange rounded accent block lower-right */}
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
        <ImageSlot label="pharmacy-dispensary-inventory" />
        <div className="flex flex-col gap-6">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
          </span>
          <h3 className="text-2xl sm:text-3xl font-heading font-bold text-[#1F2A33]">
            Real-Time Pharmacy &amp; TRA Fiscal Sync
          </h3>
          <p className="text-base text-[#4A5568] leading-relaxed">
            {placeholderText}
          </p>
        </div>
      </div>

      {/* Row C: Paragraph Left + Image Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-6 order-2 lg:order-1">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
          </span>
          <h3 className="text-2xl sm:text-3xl font-heading font-bold text-[#1F2A33]">
            Advanced AI &amp; Epidemiological Intelligence
          </h3>
          <p className="text-base text-[#4A5568] leading-relaxed">
            {placeholderText}
          </p>
        </div>
        <div className="order-1 lg:order-2">
          <ImageSlot label="ai-analytics-dashboard" />
        </div>
      </div>

    </section>
  );
}

export const FeatureRows = FeatureZigZagRows;
