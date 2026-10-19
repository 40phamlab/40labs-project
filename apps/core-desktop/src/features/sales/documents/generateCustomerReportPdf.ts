import type { Sale, DispensingInstruction } from '@40labs/types';
import { getBusinessIdentity } from './shared/documentHeader';

export interface CustomerReportPdfOptions {
  sale: Sale;
  customerLabel: string;
  phone: string;
  servedBy: string;
  instructions: DispensingInstruction[];
  language?: 'sw-TZ' | 'en' | string;
}

export function formatInstructionSentence(inst?: DispensingInstruction): string {
  if (!inst) return '';
  const parts: string[] = [];
  if (inst.dose) parts.push(inst.dose);
  if (inst.frequency) {
    const freqMap: Record<string, string> = {
      once_daily: '1× daily',
      twice_daily: '2× daily',
      three_daily: '3× daily',
      four_daily: '4× daily',
      as_needed: 'As needed',
      custom: 'Custom frequency',
    };
    parts.push(freqMap[inst.frequency] || inst.frequency);
  }
  if (inst.timing) {
    const timingMap: Record<string, string> = {
      before_meal: 'before meal',
      after_meal: 'after meal',
      with_meal: 'with meal',
      morning: 'morning',
      night: 'night',
      any: 'any time',
    };
    parts.push(timingMap[inst.timing] || inst.timing);
  }
  if (inst.duration_days) {
    parts.push(`${inst.duration_days} days`);
  }
  if (inst.storage && inst.storage.length > 0) {
    const storageMap: Record<string, string> = {
      cool_dry: 'cool & dry',
      refrigerate: 'refrigerate',
      away_from_light: 'away from light',
      away_from_children: 'away from children',
      shake_well: 'shake well',
    };
    const storageStrs = inst.storage.map((s) => storageMap[s] || s).join(', ');
    parts.push(`Keep: ${storageStrs}`);
  }
  return parts.join(' · ');
}

export async function createCustomerReportPdfBlob(options: CustomerReportPdfOptions): Promise<Blob> {
  const biz = await getBusinessIdentity();
  const { sale, customerLabel, phone, servedBy, instructions } = options;

  const lines: string[] = [];
  const esc = (str: string) =>
    str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  // A4 / A5 PDF canvas (width: 420, height: 600)
  lines.push('BT');
  lines.push('/F1 14 Tf');
  lines.push('18 TL');
  lines.push('30 550 Td');

  lines.push(`(${esc(biz.name.toUpperCase())}) Tj T*`);
  lines.push('/F2 10 Tf');
  lines.push('14 TL');
  lines.push(`(${esc(biz.addressLine)}) Tj T*`);
  if (biz.phone) lines.push(`(Tel: ${esc(biz.phone)}) Tj T*`);
  if (biz.email) lines.push(`(Email: ${esc(biz.email)}) Tj T*`);
  lines.push('(==================================================) Tj T*');

  lines.push('/F1 11 Tf');
  lines.push('(PATIENT REPORT & DISPENSING INSTRUCTIONS) Tj T*');
  lines.push('/F2 10 Tf');
  lines.push(`(Sale ID: ${esc(sale.id)}) Tj T*`);
  lines.push(`(Date: ${esc(new Date(sale.created_at).toLocaleString())}) Tj T*`);
  lines.push(`(Customer: ${esc(customerLabel)} | Phone: ${esc(phone)}) Tj T*`);
  lines.push(`(Dispensed By: ${esc(servedBy)}) Tj T*`);
  lines.push('(==================================================) Tj T*');

  lines.push('/F1 10 Tf');
  lines.push('(DISPENSED MEDICATIONS & INSTRUCTIONS:) Tj T*');
  lines.push('/F2 9 Tf');

  sale.lines.forEach((line, idx) => {
    const medName = line.medicine_name || `Item #${idx + 1}`;
    lines.push(`(${idx + 1}. ${esc(medName)} - Qty: ${line.quantity}) Tj T*`);

    const inst = instructions.find((i) => i.sale_line_id === line.id);
    const instructionSentence = formatInstructionSentence(inst);
    if (instructionSentence) {
      lines.push(`   -> Instructions: ${esc(instructionSentence)} Tj T*`);
    }
    if (inst?.note) {
      lines.push(`   -> Note: ${esc(inst.note)} Tj T*`);
    }
  });

  lines.push('(==================================================) Tj T*');
  lines.push('/F2 8 Tf');
  lines.push(`(Thank you for choosing ${esc(biz.name)}. Follow instructions carefully.) Tj T*`);
  lines.push('(Powered by 40Labs Core POS) Tj T*');
  lines.push('ET');

  const streamContent = lines.join('\n');
  const streamLength = streamContent.length;

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 =
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 420 600] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n';
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

export async function saveCustomerReportPdf(options: CustomerReportPdfOptions): Promise<void> {
  try {
    const blob = await createCustomerReportPdfBlob(options);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const sanitizedId = options.sale.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.href = url;
    link.download = `CustomerReport_${sanitizedId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Failed to save customer report PDF:', err);
  }
}
