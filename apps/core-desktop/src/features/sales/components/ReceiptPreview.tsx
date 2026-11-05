import * as React from 'react';
import { businessApi } from '../../../api/businessApi';

export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  total: number;
}

export interface ReceiptPreviewProps {
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string | null;
  businessTin?: string | null;
  businessTmdaNumber?: string | null;
  businessLogoUrl?: string | null;
  orderId: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: string;
  servedBy?: string;
  footerMessage?: string;
  className?: string;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  businessName: propBusinessName,
  businessAddress: propBusinessAddress,
  businessPhone: propBusinessPhone,
  businessEmail: propBusinessEmail,
  businessTin: propBusinessTin,
  businessTmdaNumber: propBusinessTmdaNumber,
  businessLogoUrl: propBusinessLogoUrl,
  orderId,
  date,
  items,
  subtotal,
  tax,
  total,
  paymentMethod = 'cash',
  servedBy,
  footerMessage = 'Thank you for your business!',
  className = '',
}) => {
  const [bizInfo, setBizInfo] = React.useState({
    name: propBusinessName || 'Pharmacy POS',
    address: propBusinessAddress || 'Tanzania',
    phone: propBusinessPhone || '',
    email: propBusinessEmail || null,
    tin: propBusinessTin || null,
    tmdaNumber: propBusinessTmdaNumber || null,
    logoUrl: propBusinessLogoUrl || null,
  });

  React.useEffect(() => {
    if (!propBusinessName) {
      businessApi.get().then((biz) => {
        const addr = [biz.address?.place, biz.address?.district, biz.address?.region].filter(Boolean).join(', ') || 'Tanzania';
        setBizInfo({
          name: biz.name || 'Pharmacy POS',
          address: addr,
          phone: biz.contacts?.mobile || '',
          email: biz.contacts?.email || null,
          tin: biz.tin || null,
          tmdaNumber: biz.tmda_number || null,
          logoUrl: biz.logo_url || null,
        });
      }).catch(() => {});
    }
  }, [propBusinessName, propBusinessAddress, propBusinessPhone]);

  const name = propBusinessName || bizInfo.name;
  const address = propBusinessAddress || bizInfo.address;
  const phone = propBusinessPhone || bizInfo.phone;
  const email = propBusinessEmail !== undefined ? propBusinessEmail : bizInfo.email;
  const tin = propBusinessTin !== undefined ? propBusinessTin : bizInfo.tin;
  const tmdaNumber = propBusinessTmdaNumber !== undefined ? propBusinessTmdaNumber : bizInfo.tmdaNumber;
  const logoUrl = propBusinessLogoUrl !== undefined ? propBusinessLogoUrl : bizInfo.logoUrl;

  return (
    <div
      className={`p-6 w-[320px] mx-auto font-mono text-xs rounded-card border border-border bg-white text-black shadow-md ${className}`}
      style={{ lineHeight: '1.3' }}
    >
      <div className="text-center mb-4 border-b border-dashed border-black/40 pb-3 flex flex-col items-center">
        {logoUrl && (
          <div className="mb-2 max-w-[80px] max-h-[80px] flex items-center justify-center overflow-hidden">
            <img src={logoUrl} alt={name} className="object-contain max-h-16" />
          </div>
        )}
        <h2 className="font-bold text-sm uppercase tracking-wider text-black break-words max-w-full px-1">{name}</h2>
        <p className="text-[10px] leading-tight text-black/80 mt-0.5">{address}</p>
        {phone && <p className="text-[10px] text-black/80">Tel: {phone}</p>}
        {email && <p className="text-[10px] text-black/80">Email: {email}</p>}
        {tin && <p className="text-[10px] font-mono text-black/80">TIN: {tin}</p>}
        {tmdaNumber && <p className="text-[10px] font-mono text-black/80">TMDA: {tmdaNumber}</p>}
      </div>

      <div className="mb-3 text-[10px] flex flex-col gap-0.5 text-black">
        <div className="flex justify-between">
          <span className="font-bold">RECEIPT #:</span>
          <span className="font-mono">{orderId}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">DATE:</span>
          <span>{date}</span>
        </div>
        {servedBy && (
          <div className="flex justify-between">
            <span className="font-bold">SERVED BY:</span>
            <span>{servedBy}</span>
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="flex justify-between border-b border-black mb-2 pb-1 font-bold text-[10px] text-black">
          <span className="w-8">QTY</span>
          <span className="flex-1 text-left px-1">ITEM</span>
          <span className="w-16 text-right">PRICE</span>
        </div>
        <div className="flex flex-col gap-1.5 text-black">
          {(items || []).map((item, idx) => (
            <div key={idx} className="flex justify-between items-start text-[11px]">
              <span className="w-8 font-bold">{item.qty ?? 1}</span>
              <div className="flex-1 text-left px-1">
                <span className="block font-medium leading-tight">{item.name || 'Item'}</span>
                <span className="text-[9px] text-black/70">@{(item.price ?? 0).toLocaleString()}</span>
              </div>
              <span className="w-16 text-right font-mono font-semibold">{(item.total ?? 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-dashed border-black/40 pt-3 mb-4 space-y-1 text-black text-[11px]">
        <div className="flex justify-between">
          <span>SUBTOTAL:</span>
          <span className="font-mono">{(subtotal ?? 0).toLocaleString()}</span>
        </div>
        {tax > 0 && (
          <div className="flex justify-between">
            <span>TAX (VAT):</span>
            <span className="font-mono">{(tax ?? 0).toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-xs border-t border-black pt-1 mt-1">
          <span>GRAND TOTAL:</span>
          <span className="font-mono">TZS {(total ?? 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-[10px] text-black/80 pt-0.5">
          <span>PAYMENT:</span>
          <span className="uppercase">{paymentMethod}</span>
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
