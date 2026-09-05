import * as React from 'react';

export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  total: number;
}

export interface ReceiptPreviewProps {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  orderId: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  footerMessage?: string;
  className?: string;
}

/**
 * ReceiptPreview Component
 * Strictly monochrome for thermal printer simulation.
 * Bypasses dark theme/claymorphism by design.
 */
export const ReceiptPreview = ({
  businessName,
  businessAddress,
  businessPhone,
  orderId,
  date,
  items,
  subtotal,
  tax,
  total,
  footerMessage = "Thank you for your business!",
  className = '',
}: ReceiptPreviewProps) => {
  return (
    <div
      className={`p-6 w-[302px] mx-auto font-mono text-[12px] shadow-xl border border-gray-100 ${className}`}
      style={{
        color: '#000000',
        backgroundColor: '#FFFFFF',
        lineHeight: '1.2'
      }}
    >
      {/* Header */}
      <div className="text-center mb-6 border-b border-dashed border-black pb-4">
        <h2 className="font-bold text-sm uppercase mb-1">{businessName}</h2>
        <p className="text-[10px] leading-tight opacity-80">{businessAddress}</p>
        <p className="text-[10px]">Tel: {businessPhone}</p>
      </div>

      {/* Order Meta */}
      <div className="mb-4 text-[10px] flex flex-col gap-0.5">
        <div className="flex justify-between">
          <span className="font-bold">ORDER ID:</span>
          <span>{orderId}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">DATE:</span>
          <span>{date}</span>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="mb-6">
        <div className="flex justify-between border-b border-black mb-2 pb-1 font-bold text-[10px]">
          <span className="w-8">QTY</span>
          <span className="flex-1 text-left px-2">ITEM</span>
          <span className="w-16 text-right">PRICE</span>
        </div>
        <div className="flex flex-col gap-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start">
              <span className="w-8">{item.qty}</span>
              <div className="flex-1 text-left px-2">
                <span className="block font-bold leading-tight">{item.name}</span>
                <span className="text-[9px] block">Unit Price: {item.price.toLocaleString()}</span>
              </div>
              <span className="w-16 text-right">{item.total.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals Section */}
      <div className="border-t border-dashed border-black pt-4 mb-6 space-y-1">
        <div className="flex justify-between">
          <span>SUBTOTAL:</span>
          <span>{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>TAX (VAT 18%):</span>
          <span>{tax.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold text-sm border-t border-black pt-1 mt-1">
          <span>GRAND TOTAL:</span>
          <span>TZS {total.toLocaleString()}</span>
        </div>
      </div>

      {/* Footer / QR */}
      <div className="text-center border-t border-dashed border-black pt-6">
        <p className="mb-4 uppercase text-[9px] font-bold tracking-widest">{footerMessage}</p>

        {/* Simulating QR/Barcode Area */}
        <div className="w-32 h-32 bg-gray-50 border border-gray-200 mx-auto flex flex-col items-center justify-center p-2">
           <div className="w-full h-full border-2 border-black border-dashed flex items-center justify-center text-[10px] font-bold text-black/20">
             QR CODE
           </div>
        </div>

        <p className="mt-4 text-[8px] italic opacity-60">Verified Pharmacy Transaction</p>
        <p className="text-[7px] mt-1 font-mono tracking-tighter">TRX-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
      </div>
    </div>
  );
};
