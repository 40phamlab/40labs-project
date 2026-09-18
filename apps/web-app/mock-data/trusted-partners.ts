export interface Partner {
  id: string;
  name: string;
  logoUrl?: string;
}

const partners: Partner[] = [
  { id: 'partner-1', name: 'Partner One' },
  { id: 'partner-2', name: 'Partner Two' },
  { id: 'partner-3', name: 'Partner Three' },
];

/**
 * Returns the list of trusted partners for the "Trusted By" section.
 */
export function getTrustedPartners(): Partner[] {
  return [...partners];
}
