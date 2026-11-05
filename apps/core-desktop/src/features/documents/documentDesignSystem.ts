import type { Business } from '@40labs/types';
import { BusinessIdentity, getBusinessIdentity } from '../sales/documents/shared/documentHeader';

export type DocumentType =
  | 'sales_report'
  | 'inventory_report'
  | 'customer_report'
  | 'laboratory_report'
  | 'financial_report'
  | 'pharmacy_report'
  | 'sales_receipt';

export interface DocumentHeaderProps {
  business: BusinessIdentity;
  documentTitle: string;
  subtitle?: string;
  categoryLabel?: string;
  periodLabel?: string;
  generatedAt?: string;
  documentId?: string;
}

/**
 * Unified Document Design System helper for rendering professional business branding headers
 * across all report and receipt formats (PDF, DOCX, HTML, Print, Preview).
 */
export function renderBusinessHeaderHtml(props: DocumentHeaderProps): string {
  const { business, documentTitle, subtitle, categoryLabel, periodLabel, generatedAt, documentId } = props;

  return `
    <div class="document-header" style="border-bottom: 2px solid #cbd5e1; padding-bottom: 12px; margin-bottom: 20px; font-family: 'Segoe UI', Arial, sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          ${business.logoUrl ? `<img src="${business.logoUrl}" alt="${business.name}" style="max-height: 50px; max-width: 150px; object-fit: contain; margin-bottom: 8px;" />` : ''}
          <h1 style="font-size: 18pt; color: #0f172a; font-weight: bold; text-transform: uppercase; margin: 0 0 2px 0;">${escapeHtml(business.name)}</h1>
          <p style="font-size: 9.5pt; color: #475569; margin: 0 0 2px 0;">${escapeHtml(business.addressLine)}</p>
          <div style="font-size: 9pt; color: #64748b;">
            ${business.phone ? `<span>Tel: ${escapeHtml(business.phone)}</span>` : ''}
            ${business.email ? `<span> &bull; Email: ${escapeHtml(business.email)}</span>` : ''}
            ${business.tin ? `<span> &bull; TIN: ${escapeHtml(business.tin)}</span>` : ''}
            ${business.tmdaNumber ? `<span> &bull; TMDA: ${escapeHtml(business.tmdaNumber)}</span>` : ''}
          </div>
        </div>
        <div style="text-align: right; font-size: 9pt; color: #64748b;">
          ${documentId ? `<div style="font-family: monospace; font-weight: bold; color: #0f172a;">REF: ${escapeHtml(documentId)}</div>` : ''}
          ${generatedAt ? `<div>Generated: ${escapeHtml(generatedAt)}</div>` : ''}
        </div>
      </div>
      <div style="margin-top: 12px;">
        <h2 style="font-size: 14pt; color: #1e293b; font-weight: bold; margin: 0 0 4px 0;">${escapeHtml(documentTitle)}</h2>
        ${subtitle ? `<p style="font-size: 10pt; color: #475569; margin: 0 0 4px 0;">${escapeHtml(subtitle)}</p>` : ''}
        <div style="font-size: 9pt; color: #64748b; display: flex; gap: 16px;">
          ${categoryLabel ? `<span><b>Category:</b> ${escapeHtml(categoryLabel)}</span>` : ''}
          ${periodLabel ? `<span><b>Period:</b> ${escapeHtml(periodLabel)}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

export function renderDocumentFooterHtml(businessName: string, pageNumberStr?: string): string {
  return `
    <div class="document-footer" style="margin-top: 40px; pt: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 8.5pt; color: #94a3b8; font-family: 'Segoe UI', Arial, sans-serif;">
      <span>Confidential Official Record &mdash; ${escapeHtml(businessName)}</span>
      <span>${pageNumberStr ? pageNumberStr + ' | ' : ''}Powered by 40Labs Core POS</span>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function resolveDocumentIdentity(business?: Business | null): Promise<BusinessIdentity> {
  if (business) {
    const addressLine = [business.address?.place, business.address?.district, business.address?.region].filter(Boolean).join(', ') || 'Tanzania';
    return {
      name: business.name || 'Pharmacy POS',
      addressLine,
      phone: business.contacts?.mobile || '',
      email: business.contacts?.email || null,
      tin: business.tin || null,
      tmdaNumber: business.tmda_number || null,
      logoUrl: business.logo_url || null,
    };
  }
  return await getBusinessIdentity();
}
