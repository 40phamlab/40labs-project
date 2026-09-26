export interface ReceiptPdfData {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  orderId: string;
  date: string;
  customerLabel: string;
  items: { name: string; qty: number; price: number; total: number }[];
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * Generates a valid PDF Blob in pure JavaScript without external dependencies.
 */
export function createReceiptPdfBlob(data: ReceiptPdfData): Blob {
  const lines: string[] = [];

  // Helper to escape PDF string special characters
  const esc = (str: string) =>
    str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  // Build stream content
  lines.push('BT');
  lines.push('/F1 12 Tf'); // Bold Title font
  lines.push('16 TL'); // Line height
  lines.push('30 560 Td'); // Start position near top of 300x600 page

  lines.push(`(${esc(data.businessName.toUpperCase())}) Tj T*`);
  lines.push('/F2 9 Tf'); // Regular font
  lines.push('12 TL');
  lines.push(`(${esc(data.businessAddress)}) Tj T*`);
  lines.push(`(Tel: ${esc(data.businessPhone)}) Tj T*`);
  lines.push('(----------------------------------------) Tj T*');

  lines.push('/F1 9 Tf');
  lines.push(`(RECEIPT #: ${esc(data.orderId)}) Tj T*`);
  lines.push(`(DATE: ${esc(data.date)}) Tj T*`);
  lines.push(`(CUSTOMER: ${esc(data.customerLabel)}) Tj T*`);
  lines.push('(----------------------------------------) Tj T*');

  lines.push('/F1 9 Tf');
  lines.push('(QTY  ITEM                        TOTAL) Tj T*');
  lines.push('/F2 9 Tf');

  data.items.forEach((item) => {
    const qtyStr = String(item.qty).padEnd(4, ' ');
    const nameStr = item.name.length > 20 ? item.name.substring(0, 18) + '..' : item.name.padEnd(20, ' ');
    const totalStr = `TZS ${item.total.toLocaleString()}`;
    lines.push(`(${esc(qtyStr + nameStr + totalStr)}) Tj T*`);
  });

  lines.push('(----------------------------------------) Tj T*');
  lines.push(`(SUBTOTAL: TZS ${data.subtotal.toLocaleString()}) Tj T*`);
  lines.push(`(TAX VAT: TZS ${data.tax.toLocaleString()}) Tj T*`);
  lines.push('/F1 10 Tf');
  lines.push(`(GRAND TOTAL: TZS ${data.total.toLocaleString()}) Tj T*`);
  lines.push('(----------------------------------------) Tj T*');
  lines.push('/F2 8 Tf');
  lines.push('(Thank you for your business!) Tj T*');
  lines.push('(40Labs Core POS Verified Receipt) Tj T*');
  lines.push('ET');

  const streamContent = lines.join('\n');
  const streamLength = streamContent.length;

  // Build PDF Objects
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 =
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 600] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n';
  const obj4 = '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>\nendobj\n';
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n';
  const obj6 = `6 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`;

  const header = '%PDF-1.4\n';

  // Calculate offsets for xref table
  let currentOffset = header.length;
  const offsets = [0]; // dummy 0th object

  offsets.push(currentOffset);
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

export function saveReceiptPdf(data: ReceiptPdfData): void {
  try {
    const blob = createReceiptPdfBlob(data);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const sanitizedId = data.orderId.replace(/[^a-zA-Z0-9_-]/g, '_');
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
