export interface AlertThresholds {
  stock: {
    criticalQty: number; // 0
    dangerPercentOfReorder: number; // 0.5 (50%)
  };
  expiry: {
    dangerDays: number; // 30
    warningDays: number; // 90
  };
  lab: {
    overdueHours: number; // 24
  };
  debts: {
    overdueDays: number; // 30
    dangerAmount: number; // 500000 TZS
  };
  purchases: {
    delayedDays: number; // 7
  };
  sales: {
    dodDropPct: number; // 0.5 (50%)
    checkHour: number; // 12 (noon)
  };
}

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  stock: {
    criticalQty: 0,
    dangerPercentOfReorder: 0.5,
  },
  expiry: {
    dangerDays: 30,
    warningDays: 90,
  },
  lab: {
    overdueHours: 24,
  },
  debts: {
    overdueDays: 30,
    dangerAmount: 500000,
  },
  purchases: {
    delayedDays: 7,
  },
  sales: {
    dodDropPct: 0.5,
    checkHour: 12,
  },
};
