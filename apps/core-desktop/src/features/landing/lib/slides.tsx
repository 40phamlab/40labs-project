import { Store, BarChart3, ShoppingCart, TrendingUp, MessageCircle, Users } from 'lucide-react';
import type { ReactNode } from 'react';

export interface SlideItem {
  id: string;
  icon: ReactNode;
  titleKey: 'landing.slide.sell.title' | 'landing.slide.reports.title' | 'landing.slide.buy.title' | 'landing.slide.grow.title' | 'landing.slide.reach.title' | 'landing.slide.team.title';
  descKey: 'landing.slide.sell.line' | 'landing.slide.reports.line' | 'landing.slide.buy.line' | 'landing.slide.grow.line' | 'landing.slide.reach.line' | 'landing.slide.team.line';
}

export const LANDING_SLIDES: SlideItem[] = [
  {
    id: 'sell',
    icon: <Store className="w-5 h-5 text-primary" />,
    titleKey: 'landing.slide.sell.title',
    descKey: 'landing.slide.sell.line',
  },
  {
    id: 'reports',
    icon: <BarChart3 className="w-5 h-5 text-primary" />,
    titleKey: 'landing.slide.reports.title',
    descKey: 'landing.slide.reports.line',
  },
  {
    id: 'buy',
    icon: <ShoppingCart className="w-5 h-5 text-primary" />,
    titleKey: 'landing.slide.buy.title',
    descKey: 'landing.slide.buy.line',
  },
  {
    id: 'grow',
    icon: <TrendingUp className="w-5 h-5 text-primary" />,
    titleKey: 'landing.slide.grow.title',
    descKey: 'landing.slide.grow.line',
  },
  {
    id: 'reach',
    icon: <MessageCircle className="w-5 h-5 text-primary" />,
    titleKey: 'landing.slide.reach.title',
    descKey: 'landing.slide.reach.line',
  },
  {
    id: 'team',
    icon: <Users className="w-5 h-5 text-primary" />,
    titleKey: 'landing.slide.team.title',
    descKey: 'landing.slide.team.line',
  },
];
