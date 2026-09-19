export interface Partner {
  id: string;
  name: string;
  logoUrl?: string;
}

const partners: Partner[] = [
  { id: 'partner-1', name: 'Mount Meru Hospital' },
  { id: 'partner-2', name: 'Kairuki Health' },
  { id: 'partner-3', name: 'Aga Khan Found.' },
  { id: 'partner-4', name: 'Regency Med' },
  { id: 'partner-5', name: 'Muhimbili Nat.' },
  { id: 'partner-6', name: 'TMDA' },
];

/**
 * Returns the list of trusted partners for the "Trusted By" section.
 */
export function getTrustedPartners(): Partner[] {
  return [...partners];
}
