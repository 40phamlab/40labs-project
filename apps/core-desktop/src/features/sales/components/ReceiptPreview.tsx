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

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  businessName,
  businessAddress,
  businessPhone,
  orderId,
  date,
  items,
  subtotal,
  tax,
  total,
  footerMessage = 'Thank you for your business!',
  className = '',
}) => {
  return (
    <div
      className={`p-6 w-[320px] mx-auto font-mono text-xs rounded-card border border-border bg-white text-black shadow-md ${className}`}
      style={{
        lineHeight: '1.3',
      }}
    >
      <div className="text-center mb-4 border-b border-dashed border-black/40 pb-3">
        <h2 className="font-bold text-sm uppercase tracking-wider text-black">{businessName}</h2>
        <p className="text-[10px] leading-tight text-black/80 mt-0.5">{businessAddress}</p>
        <p className="text-[10px] text-black/80">Tel: {businessPhone}</p>
      </div>

      <div className="mb-3 text-[10px] flex flex-col gap-0.5 text-black">
        <div className="flex justify-between">
          <span className="font-bold">RECEIPT #:</span>
          <span>{orderId}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">DATE:</span>
          <span>{date}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between border-b border-black mb-2 pb-1 font-bold text-[10px] text-black">
          <span className="w-8">QTY</span>
          <span className="flex-1 text-left px-1">ITEM</span>
          <span className="w-16 text-right">PRICE</span>
        </div>
        <div className="flex flex-col gap-1.5 text-black">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start text-[11px]">
              <span className="w-8 font-bold">{item.qty}</span>
              <div className="flex-1 text-left px-1">
                <span className="block font-medium leading-tight">{item.name}</span>
                <span className="text-[9px] text-black/70">@{item.price.toLocaleString()}</span>
              </div>
              <span className="w-16 text-right font-mono font-semibold">{item.total.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-dashed border-black/40 pt-3 mb-4 space-y-1 text-black text-[11px]">
        <div className="flex justify-between">
          <span>SUBTOTAL:</span>
          <span className="font-mono">{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>TAX (VAT):</span>
          <span className="font-mono">{tax.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold text-xs border-t border-black pt-1 mt-1">
          <span>GRAND TOTAL:</span>
          <span className="font-mono">TZS {total.toLocaleString()}</span>
        </div>
      </div>

      <div className="text-center border-t border-dashed border-black/40 pt-4 text-black">
        <p className="mb-3 uppercase text-[9px] font-bold tracking-widest">{footerMessage}</p>

        <div className="w-24 h-24 bg-black/5 border border-black/20 mx-auto flex flex-col items-center justify-center p-2 rounded">
          <div className="w-full h-full border border-black border-dashed flex items-center justify-center text-[9px] font-bold text-black/40">
            QR CODE
          </div>
        </div>

        <p className="mt-3 text-[8px] italic text-black/60">Verified Pharmacy Receipt • 40Labs Core POS</p>
      </div>
    </div>
  );
};
