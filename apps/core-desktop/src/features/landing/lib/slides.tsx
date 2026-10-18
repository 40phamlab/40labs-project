import { WifiOff, BarChart3, ShoppingCart, MessageCircle, Users, Store, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';

export interface SlideItem {
  id: string;
  icon: ReactNode;
  titleKey: 'landing.slide.offline.title' | 'landing.slide.reports.title' | 'landing.slide.buy.title' | 'landing.slide.reach.title' | 'landing.slide.team.title' | 'landing.slide.sell.title' | 'landing.slide.grow.title';
  messageKey: 'landing.slide.offline.message' | 'landing.slide.reports.message' | 'landing.slide.buy.message' | 'landing.slide.reach.message' | 'landing.slide.team.message' | 'landing.slide.sell.message' | 'landing.slide.grow.message';
  p1Key: 'landing.slide.offline.p1' | 'landing.slide.reports.p1' | 'landing.slide.buy.p1' | 'landing.slide.reach.p1' | 'landing.slide.team.p1' | 'landing.slide.sell.p1' | 'landing.slide.grow.p1';
  p2Key: 'landing.slide.offline.p2' | 'landing.slide.reports.p2' | 'landing.slide.buy.p2' | 'landing.slide.reach.p2' | 'landing.slide.team.p2' | 'landing.slide.sell.p2' | 'landing.slide.grow.p2';
  p3Key: 'landing.slide.offline.p3' | 'landing.slide.reports.p3' | 'landing.slide.buy.p3' | 'landing.slide.reach.p3' | 'landing.slide.team.p3' | 'landing.slide.sell.p3' | 'landing.slide.grow.p3';
  soon?: boolean;
}

export const LANDING_SLIDES: SlideItem[] = [
  {
    id: 'offline',
    icon: <WifiOff className="w-6 h-6 text-primary" />,
    titleKey: 'landing.slide.offline.title',
    messageKey: 'landing.slide.offline.message',
    p1Key: 'landing.slide.offline.p1',
    p2Key: 'landing.slide.offline.p2',
    p3Key: 'landing.slide.offline.p3',
  },
  {
    id: 'reports',
    icon: <BarChart3 className="w-6 h-6 text-primary" />,
    titleKey: 'landing.slide.reports.title',
    messageKey: 'landing.slide.reports.message',
    p1Key: 'landing.slide.reports.p1',
    p2Key: 'landing.slide.reports.p2',
    p3Key: 'landing.slide.reports.p3',
  },
  {
    id: 'buy',
    icon: <ShoppingCart className="w-6 h-6 text-primary" />,
    titleKey: 'landing.slide.buy.title',
    messageKey: 'landing.slide.buy.message',
    p1Key: 'landing.slide.buy.p1',
    p2Key: 'landing.slide.buy.p2',
    p3Key: 'landing.slide.buy.p3',
  },
  {
    id: 'reach',
    icon: <MessageCircle className="w-6 h-6 text-primary" />,
    titleKey: 'landing.slide.reach.title',
    messageKey: 'landing.slide.reach.message',
    p1Key: 'landing.slide.reach.p1',
    p2Key: 'landing.slide.reach.p2',
    p3Key: 'landing.slide.reach.p3',
  },
  {
    id: 'team',
    icon: <Users className="w-6 h-6 text-primary" />,
    titleKey: 'landing.slide.team.title',
    messageKey: 'landing.slide.team.message',
    p1Key: 'landing.slide.team.p1',
    p2Key: 'landing.slide.team.p2',
    p3Key: 'landing.slide.team.p3',
  },
  {
    id: 'sell',
    icon: <Store className="w-6 h-6 text-primary" />,
    titleKey: 'landing.slide.sell.title',
    messageKey: 'landing.slide.sell.message',
    p1Key: 'landing.slide.sell.p1',
    p2Key: 'landing.slide.sell.p2',
    p3Key: 'landing.slide.sell.p3',
    soon: true,
  },
  {
    id: 'grow',
    icon: <TrendingUp className="w-6 h-6 text-primary" />,
    titleKey: 'landing.slide.grow.title',
    messageKey: 'landing.slide.grow.message',
    p1Key: 'landing.slide.grow.p1',
    p2Key: 'landing.slide.grow.p2',
    p3Key: 'landing.slide.grow.p3',
    soon: true,
  },
];
