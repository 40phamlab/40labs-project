import * as React from 'react';
import {
  Building2,
  Bell,
  Landmark,
  Users,
  Megaphone,
  Layers,
} from 'lucide-react';
import { Tooltip } from '@40labs/ui-components';

export interface CategoryStripProps {
  counts: {
    business: number;
    unread: number;
    gov: number;
    customers: number;
    marketing: number;
    all: number;
  };
  unreadFlags: {
    business: boolean;
    unread: boolean;
    gov: boolean;
    customers: boolean;
    marketing: boolean;
    all: boolean;
  };
  activeCategory?: string | null;
  onSelectCategory: (category: 'all' | 'unread' | 'business' | 'gov' | 'customers' | 'marketing') => void;
  className?: string;
}

export const CategoryStrip: React.FC<CategoryStripProps> = ({
  counts,
  unreadFlags,
  activeCategory = 'all',
  onSelectCategory,
  className = '',
}) => {
  const categories = [
    {
      id: 'business',
      label: 'Business',
      count: counts.business,
      hasUnread: unreadFlags.business,
      icon: <Building2 size={22} />,
      categoryKey: 'business' as const,
    },
    {
      id: 'unread',
      label: 'Unread',
      count: counts.unread,
      hasUnread: false,
      icon: <Bell size={22} />,
      categoryKey: 'unread' as const,
    },
    {
      id: 'gov',
      label: 'Gov',
      count: counts.gov,
      hasUnread: unreadFlags.gov,
      icon: <Landmark size={22} />,
      categoryKey: 'gov' as const,
    },
    {
      id: 'customers',
      label: 'Customers',
      count: counts.customers,
      hasUnread: unreadFlags.customers,
      icon: <Users size={22} />,
      categoryKey: 'customers' as const,
    },
    {
      id: 'marketing',
      label: 'Marketing',
      count: counts.marketing,
      hasUnread: unreadFlags.marketing,
      icon: <Megaphone size={22} />,
      categoryKey: 'marketing' as const,
    },
    {
      id: 'all',
      label: 'All',
      count: counts.all,
      hasUnread: unreadFlags.all,
      icon: <Layers size={22} />,
      categoryKey: 'all' as const,
    },
  ];

  return (
    <div className={`flex items-center justify-around w-full px-6 py-3 bg-panel border-t border-border/30 shrink-0 ${className}`}>
      {categories.map((cat) => {
        const isSelected = activeCategory === cat.categoryKey;
        const countIsZero = cat.count === 0;
        const displayCount = cat.count > 99 ? '99+' : cat.count;

        return (
          <Tooltip key={cat.id} content={cat.label} position="top">
            <button
              type="button"
              aria-pressed={isSelected}
              aria-label={`${cat.label} ${cat.count}`}
              onClick={() => {
                if (isSelected && cat.categoryKey !== 'all') {
                  onSelectCategory('all');
                } else {
                  onSelectCategory(cat.categoryKey);
                }
              }}
              className={`
                relative flex items-center gap-2.5 py-2 px-3 transition-colors cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded
                ${isSelected ? 'text-[#16A34A]' : 'text-text-muted hover:text-text'}
              `}
            >
              <div className="relative flex items-center justify-center">
                {cat.icon}
                {cat.hasUnread && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#F97316]" aria-label="Unread" />
                )}
              </div>
              <span className={`font-mono text-base font-semibold ${countIsZero && !isSelected ? 'opacity-50' : ''}`}>
                {displayCount}
              </span>
              {isSelected && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#16A34A]" />
              )}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
};
