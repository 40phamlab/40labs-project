export interface HeroCardData {
  id: string;
  tone: 'orange' | 'green' | 'white';
  title: string;
  subtitle?: string;
  lines: string[];
  ctaText: string;
}

export function getHeroCards(): HeroCardData[] {
  return [
    {
      id: 'telemed',
      tone: 'orange',
      title: 'Telemed',
      lines: [
        'meet with Your patients Easily & Remotely',
        'Deliver your most best service',
      ],
      ctaText: 'Start Free',
    },
    {
      id: 'management',
      tone: 'green',
      title: 'Manage',
      lines: [
        'Your Health Business',
        'Meet & Create Distribution Chains',
        'Do more with us!!',
      ],
      ctaText: 'Start Free',
    },
    {
      id: 'insights',
      tone: 'white',
      title: 'Generating insights',
      subtitle: 'From Your Med Data',
      lines: ['Utilize Our Best computation and AI intelligent tools'],
      ctaText: 'Explore More',
    },
  ];
}
