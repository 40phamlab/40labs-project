import type { FiscalReceipt, Sale } from '@40labs/types';
import { getBusinessIdentity } from './shared/documentHeader';

export interface ReceiptPdfOptions {
  sale: Sale;
  customerLabel: string;
  phone: string;
  servedBy: string;
  fiscalReceipt?: FiscalReceipt | null;
  language?: 'sw-TZ' | 'en' | string;
}

export async function createReceiptPdfBlob(options: ReceiptPdfOptions): Promise<Blob> {
  const biz = await getBusinessIdentity();
  const { sale, customerLabel, phone, servedBy, fiscalReceipt } = options;

  const lines: string[] = [];
  const esc = (str: string) =>
    str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  // A6 / 80mm PDF canvas (width: 300, height: 600)
  lines.push('BT');
  lines.push('/F1 12 Tf');
  lines.push('15 TL');
  lines.push('30 560 Td');

  lines.push(`(${esc(biz.name.toUpperCase())}) Tj T*`);
  lines.push('/F2 9 Tf');
  lines.push('11 TL');
  lines.push(`(${esc(biz.addressLine)}) Tj T*`);
  if (biz.phone) lines.push(`(Tel: ${esc(biz.phone)}) Tj T*`);
  if (biz.email) lines.push(`(Email: ${esc(biz.email)}) Tj T*`);
  if (biz.tin) lines.push(`(TIN: ${esc(biz.tin)}) Tj T*`);
  lines.push('(----------------------------------------) Tj T*');

  lines.push('/F1 9 Tf');
  lines.push(`(RECEIPT #: ${esc(sale.id.substring(0, 12))}) Tj T*`);
  lines.push(`(DATE: ${esc(new Date(sale.created_at).toLocaleString('en-GB', { timeZone: 'Africa/Dar_es_Salaam' }))}) Tj T*`);
  lines.push(`(SERVED BY: ${esc(servedBy)}) Tj T*`);
  lines.push(`(CUSTOMER: ${esc(customerLabel)} (${esc(phone)})) Tj T*`);
  lines.push('(----------------------------------------) Tj T*');

  lines.push('(QTY  ITEM                        TOTAL) Tj T*');
  lines.push('/F2 9 Tf');

  sale.lines.forEach((line) => {
    const qtyStr = String(line.quantity).padEnd(4, ' ');
    const itemName = line.medicine_name || 'Item';
    const nameStr = itemName.length > 20 ? itemName.substring(0, 18) + '..' : itemName.padEnd(20, ' ');
    const totalStr = `TZS ${line.subtotal.toLocaleString()}`;
    lines.push(`(${esc(qtyStr + nameStr + totalStr)}) Tj T*`);
  });

  lines.push('(----------------------------------------) Tj T*');
  lines.push(`(SUBTOTAL: TZS ${(sale.grand_total + sale.discount_amount).toLocaleString()}) Tj T*`);
  if (sale.discount_amount > 0) {
    lines.push(`(DISCOUNT: TZS ${sale.discount_amount.toLocaleString()}) Tj T*`);
  }
  lines.push(`(TAX (VAT): TZS ${sale.tax_amount.toLocaleString()}) Tj T*`);
  lines.push('/F1 10 Tf');
  lines.push(`(GRAND TOTAL: TZS ${sale.grand_total.toLocaleString()}) Tj T*`);
  lines.push('/F2 9 Tf');
  lines.push(`(Payment: ${esc(sale.payment_method.toUpperCase())}) Tj T*`);
  lines.push('(----------------------------------------) Tj T*');

  if (fiscalReceipt) {
    lines.push('/F1 9 Tf');
    lines.push('(FISCAL VERIFIED RECEIPT) Tj T*');
    lines.push('/F2 8 Tf');
    lines.push(`(Sig: ${esc(fiscalReceipt.local_signature.substring(0, 24))}...) Tj T*`);
    if (fiscalReceipt.tra_receipt_number) {
      lines.push(`(TRA No: ${esc(fiscalReceipt.tra_receipt_number)}) Tj T*`);
    }
    lines.push('(----------------------------------------) Tj T*');
  }

  lines.push('/F2 8 Tf');
  lines.push(`(Asante kwa kuchagua ${esc(biz.name)}) Tj T*`);
  lines.push('(Powered by 40Labs Core POS) Tj T*');
  lines.push('ET');

  const streamContent = lines.join('\n');
  const streamLength = streamContent.length;

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 =
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 600] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n';
  const obj4 = '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>\nendobj\n';
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n';
  const obj6 = `6 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`;

  const header = '%PDF-1.4\n';
  let currentOffset = header.length;
  const offsets = [0, currentOffset];
  currentOffset += obj1.length;
  offsets.push(currentOffset);
  currentOffset += obj2.length;
  offsets.push(currentOffset);
  currentOffset += obj3.length;
  offsets.push(currentOffset);
  currentOffset += obj4.length;
  offsets.push(currentOffset);
  currentOffset += obj5.length;
  offsets.push(currentOffset);
  currentOffset += obj6.length;

  const startXref = currentOffset;
  let xref = `xref\n0 7\n0000000000 65535 f \n`;
  for (let i = 1; i <= 6; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
  const fullPdf = header + obj1 + obj2 + obj3 + obj4 + obj5 + obj6 + xref + trailer;

  return new Blob([fullPdf], { type: 'application/pdf' });
}

export async function saveReceiptPdf(options: ReceiptPdfOptions): Promise<void> {
  try {
    const blob = await createReceiptPdfBlob(options);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const sanitizedId = options.sale.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.href = url;
    link.download = `Receipt_${sanitizedId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Failed to save receipt PDF:', err);
  }
}
