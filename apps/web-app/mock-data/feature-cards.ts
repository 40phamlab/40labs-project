export interface FeatureCard {
  id: string;
  label: string;
}

const featureCards: FeatureCard[] = [
  { id: 'suppliers', label: 'Med Product Suppliers' },
  { id: 'e-pharmacy', label: 'e-Pharmacy' },
  { id: 'blog', label: 'Health Blog' },
];

/**
 * Returns the list of feature cards for the landing page.
 */
export function getFeatureCards(): FeatureCard[] {
  return [...featureCards];
}
