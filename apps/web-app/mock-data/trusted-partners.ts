export interface Partner {
  id: string;
  name: string;
  logoUrl?: string;
}

const partners: Partner[] = [
  { id: 'partner-1', name: 'Mount Meru Hospital', logoUrl: 'https://placehold.co/120x40/transparent/white?text=Mount+Meru' },
  { id: 'partner-2', name: 'Kairuki Health' }, // no logoUrl -> tests empty outlined slot
  { id: 'partner-3', name: 'Aga Khan Found.' }, // no logoUrl -> tests empty outlined slot
  { id: 'partner-4', name: 'Regency Med' }, // no logoUrl -> tests empty outlined slot
];

/**
 * Returns the list of trusted partners for the "Trusted By" section.
 */
export function getTrustedPartners(): Partner[] {
  return [...partners];
}
