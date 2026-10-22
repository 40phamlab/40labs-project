import type { LabResult, LabOrder, Customer, TestCatalogEntry, LabSample } from '@40labs/types';
import { getBusinessIdentity } from '../../sales/documents/shared/documentHeader';

export interface ResultPdfOptions {
  result: LabResult;
  order?: LabOrder;
  customer?: Customer;
  sample?: LabSample;
  test?: TestCatalogEntry;
}

export async function createResultPdfBlob(options: ResultPdfOptions): Promise<Blob> {
  const biz = await getBusinessIdentity();
  const { result, order, customer, sample, test } = options;

  const lines: string[] = [];
  const esc = (str: string) =>
    str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  // A4 / Letter PDF canvas format (width: 595, height: 842)
  lines.push('BT');
  lines.push('/F1 16 Tf');
  lines.push('20 TL');
  lines.push('50 780 Td');

  lines.push(`(${esc(biz.name.toUpperCase())}) Tj T*`);
  lines.push('/F2 10 Tf');
  lines.push('14 TL');
  lines.push(`(${esc(biz.addressLine)}) Tj T*`);
  if (biz.phone) lines.push(`(Tel: ${esc(biz.phone)}) Tj T*`);
  if (biz.email) lines.push(`(Email: ${esc(biz.email)}) Tj T*`);
  if (biz.tin) lines.push(`(TIN: ${esc(biz.tin)}) Tj T*`);
  lines.push('(----------------------------------------------------------------) Tj T*');

  lines.push('/F1 12 Tf');
  lines.push('(LABORATORY TEST REPORT) Tj T*');
  lines.push('/F2 10 Tf');
  lines.push(`(Report ID: ${esc(result.id)}) Tj T*`);
  lines.push(`(Generated: ${esc(new Date(result.created_at).toLocaleString('en-GB', { timeZone: 'Africa/Dar_es_Salaam' }))}) Tj T*`);
  lines.push('(----------------------------------------------------------------) Tj T*');

  lines.push('/F1 10 Tf');
  lines.push('(PATIENT & SAMPLE INFORMATION) Tj T*');
  lines.push('/F2 10 Tf');
  lines.push(`(Patient Name: ${esc(customer?.full_name || 'Not recorded')}) Tj T*`);
  lines.push(`(Phone: ${esc(customer?.phone || '—')}) Tj T*`);
  lines.push(`(Sample ID: ${esc(sample?.id || order?.id || '—')} [Label: ${esc(sample?.sample_label || '—')}]) Tj T*`);
  lines.push(`(Sample Status: ${esc(sample?.status || 'collected')} | Collected At: ${esc(sample?.collected_at ? new Date(sample.collected_at).toLocaleString() : '—')}) Tj T*`);
  lines.push('(----------------------------------------------------------------) Tj T*');

  lines.push('/F1 10 Tf');
  lines.push('(TEST RESULTS & FINDINGS) Tj T*');
  lines.push('/F2 10 Tf');
  lines.push(`(Test Name: ${esc(test?.name || 'Laboratory Test')} [Category: ${esc(test?.category || 'General')}]) Tj T*`);
  lines.push(`(Measured Value: ${esc(result.value)}) Tj T*`);
  lines.push(`(Reference Range: ${esc(result.reference_range || test?.reference_range || 'N/A')}) Tj T*`);

  const flagText = result.is_out_of_range ? 'FLAG: OUT OF RANGE (HIGH/LOW)' : 'FLAG: NORMAL';
  lines.push(`/F1 10 Tf`);
  lines.push(`(${esc(flagText)}) Tj T*`);
  lines.push('/F2 10 Tf');
  lines.push(`(Entered By: ${esc(result.entered_by_user_id)}) Tj T*`);
  lines.push('(----------------------------------------------------------------) Tj T*');

  lines.push('(REVIEWER & AUTHORIZATION) Tj T*');
  lines.push('(Reviewer Signature / Pathologist Sign-off: ________________________) Tj T*');
  lines.push(`(Asante kwa kuchagua ${esc(biz.name)}) Tj T*`);
  lines.push('(Powered by 40Labs Laboratory Information System) Tj T*');
  lines.push('ET');

  const streamContent = lines.join('\n');
  const streamLength = streamContent.length;

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 =
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n';
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

export async function saveResultPdf(options: ResultPdfOptions): Promise<void> {
  try {
    const blob = await createResultPdfBlob(options);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const sanitizedId = options.result.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.href = url;
    link.download = `Lab_Result_${sanitizedId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Failed to save result PDF:', err);
  }
}
