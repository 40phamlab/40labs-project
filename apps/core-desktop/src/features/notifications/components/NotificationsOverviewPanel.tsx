import * as React from 'react';
import { KPITile, type KPITone } from '@40labs/ui-components';
import {
  Building2,
  Bell,
  Landmark,
  Users,
  Megaphone,
  Layers,
} from 'lucide-react';
import type { Notification } from '@40labs/types';

export interface NotificationsOverviewPanelProps {
  notifications: Notification[];
  activeCategory?: string | null;
  onSelectCategory?: (category: string | null) => void;
  className?: string;
}

export const NotificationsOverviewPanel: React.FC<NotificationsOverviewPanelProps> = ({
  notifications,
  activeCategory,
  onSelectCategory,
  className = '',
}) => {
  const counts = React.useMemo(() => {
    let business = 0;
    let unread = 0;
    let gov = 0;
    let customers = 0;
    let marketing = 0;
    const all = notifications.length;

    for (const n of notifications) {
      if (n.status === 'unread') {
        unread++;
      }
      switch (n.category) {
        case 'business':
          business++;
          break;
        case 'gov':
          gov++;
          break;
        case 'customers':
          customers++;
          break;
        case 'marketing':
          marketing++;
          break;
      }
    }

    return {
      business,
      unread,
      gov,
      customers,
      marketing,
      all,
    };
  }, [notifications]);

  // Cap for "All" tile per wireframe requirement (99+ if > 99)
  const displayAllValue = counts.all > 99 ? '99+' : counts.all;

  const tiles = [
    {
      id: 'business',
      title: 'Business',
      value: counts.business,
      tone: 'accent' as KPITone,
      icon: <Building2 size={16} />,
      subtext: 'B2B & system updates',
      categoryKey: 'business',
    },
    {
      id: 'unread',
      title: 'Unread',
      value: counts.unread,
      tone: (counts.unread > 0 ? 'primary' : 'default') as KPITone,
      icon: <Bell size={16} />,
      subtext: 'Requires attention',
      categoryKey: 'unread',
    },
    {
      id: 'gov',
      title: 'Gov',
      value: counts.gov,
      tone: 'accent' as KPITone,
      icon: <Landmark size={16} />,
      subtext: 'TMDA & TRA notices',
      categoryKey: 'gov',
    },
    {
      id: 'customers',
      title: 'Customers',
      value: counts.customers,
      tone: 'primary' as KPITone,
      icon: <Users size={16} />,
      subtext: 'Inquiries & orders',
      categoryKey: 'customers',
    },
    {
      id: 'marketing',
      title: 'Marketing',
      value: counts.marketing,
      tone: 'default' as KPITone,
      icon: <Megaphone size={16} />,
      subtext: 'Promos & feature news',
      categoryKey: 'marketing',
    },
    {
      id: 'all',
      title: 'All',
      value: displayAllValue,
      tone: 'default' as KPITone,
      icon: <Layers size={16} />,
      subtext: 'Total notifications',
      categoryKey: 'all',
    },
  ];

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 ${className}`}>
      {tiles.map((tile) => {
        const isSelected = activeCategory === tile.categoryKey;
        return (
          <div
            key={tile.id}
            onClick={() =>
              onSelectCategory?.(tile.categoryKey === 'all' ? null : tile.categoryKey)
            }
            className={`transition-transform duration-150 ${
              onSelectCategory ? 'cursor-pointer hover:-translate-y-0.5' : ''
            }`}
          >
            <KPITile
              title={tile.title}
              value={tile.value}
              tone={tile.tone}
              icon={tile.icon}
              subtext={tile.subtext}
              className={
                isSelected ? 'ring-2 ring-primary border-primary/50' : ''
              }
            />
          </div>
        );
      })}
    </div>
  );
};
