// [phase: 8D] KPI Metadata & Color Mappings
import {
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Clock,
  Activity,
  Scale,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import type { DashboardKpi } from '@40labs/types';
import type { ScreenId } from '../../../stores/useNavStore';

export interface KpiMeta {
  id: DashboardKpi['id'];
  icon: LucideIcon;
  /**
   * Icon chip style using design token color semantics:
   * sales=green, profit=green, customers=orange, stock=blue, expiry=danger, lab=violet (fallback info), balances=orange, purchases=blue.
   * FLAG: [phase: 8D] 'violet' token is absent in @40labs/design-tokens/colors.ts; falling back to 'info' token (blue) rather than hardcoding untokenized hex.
   */
  chipClass: string;
  titleSw: string;
  titleEn: string;
  targetScreen: ScreenId;
  breakdownLabels: Record<string, string>;
}

export const KPI_META_MAP: Record<DashboardKpi['id'], KpiMeta> = {
  sales: {
    id: 'sales',
    icon: DollarSign,
    chipClass: 'bg-success/15 text-success border border-success-border/30',
    titleSw: 'Mauzo',
    titleEn: 'Sales',
    targetScreen: 'sales',
    breakdownLabels: {
      transactions: 'Miamala',
      avgBasket: 'Wastani',
    },
  },
  profit: {
    id: 'profit',
    icon: TrendingUp,
    chipClass: 'bg-success/15 text-success border border-success-border/30',
    titleSw: 'Faida',
    titleEn: 'Profit',
    targetScreen: 'reports',
    breakdownLabels: {
      today: 'Leo',
      marginPct: 'Pambizoni',
    },
  },
  customers: {
    id: 'customers',
    icon: Users,
    chipClass: 'bg-warning/15 text-warning border border-warning-border/30',
    titleSw: 'Wateja',
    titleEn: 'Customers',
    targetScreen: 'customers',
    breakdownLabels: {
      newToday: 'Wapya Leo',
      male: 'Wanaume',
      female: 'Wanawake',
      unspecified: 'Bila jinsia',
    },
  },
  stock: {
    id: 'stock',
    icon: Package,
    chipClass: 'bg-info/15 text-info border border-info-border/30',
    titleSw: 'Akiba',
    titleEn: 'Stock',
    targetScreen: 'inventory',
    breakdownLabels: {
      lowStock: 'Pungufu',
      outOfStock: 'Yamekwisha',
      stockValue: 'Thamani',
    },
  },
  expiry: {
    id: 'expiry',
    icon: Clock,
    chipClass: 'bg-danger/15 text-danger border border-danger-border/30',
    titleSw: 'Muda',
    titleEn: 'Expiry',
    targetScreen: 'inventory',
    breakdownLabels: {
      expiredValue: 'Iliyoisha',
      expiring30: '≤30d',
      expiring90: '≤90d',
    },
  },
  lab: {
    id: 'lab',
    icon: Activity,
    // FLAG: [phase: 8D] Design token for 'violet' is absent in @40labs/design-tokens/colors.ts. Falling back to 'info' token rather than hardcoding #8B5CF6.
    chipClass: 'bg-info/15 text-info border border-info-border/30',
    titleSw: 'Lab',
    titleEn: 'Lab',
    targetScreen: 'lab',
    breakdownLabels: {
      pending: 'Inasubiri',
      ready: 'Tayari',
      cancelled: 'Ahirishwa',
    },
  },
  balances: {
    id: 'balances',
    icon: Scale,
    chipClass: 'bg-warning/15 text-warning border border-warning-border/30',
    titleSw: 'Madeni',
    titleEn: 'Balances',
    targetScreen: 'reports',
    breakdownLabels: {
      receivable: 'Inayodaiwa',
      payable: 'Inayodaiwa Sup',
    },
  },
  purchases: {
    id: 'purchases',
    icon: ShoppingBag,
    chipClass: 'bg-info/15 text-info border border-info-border/30',
    titleSw: 'Ununuzi',
    titleEn: 'Purchases',
    targetScreen: 'purchases',
    breakdownLabels: {
      pendingApproval: 'Inayoidhinishwa',
      awaitingDelivery: 'Inasubiri Mzigo',
    },
  },
};
