export type ProductBadgeStatus = 'Available' | 'Coming soon';

export interface ProductItem {
  title: string;
  description: string;
  href: string;
  external?: boolean;
  badge?: ProductBadgeStatus;
}

export interface ProductColumn {
  title: string;
  items: ProductItem[];
}

export const navProductColumns: ProductColumn[] = [
  {
    title: 'PLATFORM',
    items: [
      {
        title: '40LabsCore',
        description: 'Pharmacy, lab and dispensary operating system',
        href: 'https://core.40labs.com',
        external: true,
        badge: 'Available',
      },
      {
        title: 'Orbit Worker',
        description: 'Autonomous worker node and telemetry sync',
        href: '/products/orbit-worker',
        badge: 'Coming soon',
      },
      {
        title: 'aMob',
        description: 'Mobile clinical and field operations',
        href: '/products/amob',
        badge: 'Coming soon',
      },
      {
        title: 'vLabs',
        description: 'Virtual laboratory and genomic pipelines',
        href: '/products/vlabs',
        badge: 'Coming soon',
      },
    ],
  },
  {
    title: 'EXPLORE',
    items: [
      {
        title: 'Blog',
        description: 'Insights on health tech and innovation',
        href: '/blog',
      },
      {
        title: 'Publications',
        description: 'Research papers and whitepapers',
        href: '/publications',
      },
      {
        title: 'About',
        description: 'Our mission and leadership team',
        href: '/about',
      },
    ],
  },
  {
    title: 'GET STARTED',
    items: [
      {
        title: 'Download 40LabsCore',
        description: 'Access desktop operating binaries',
        href: 'https://core.40labs.com',
        external: true,
      },
      {
        title: 'Join the aMob waitlist',
        description: 'Early access for mobile field tools',
        href: '/signup',
      },
      {
        title: 'Contact',
        description: 'Reach out to our engineering team',
        href: '/about',
      },
    ],
  },
];
