export type Language = 'sw' | 'en';

export const translations = {
  sw: {
    // Dashboard labels
    'dashboard.title': 'Dashibodi',
    'dashboard.monthlyProfit': 'Faida ya Mwezi',
    'dashboard.profit': 'Faida',
    'dashboard.todaysSales': 'Mauzo ya Leo',
    'dashboard.transactions': 'Miamala',
    'dashboard.supplierDebt': 'Deni la Wasambazaji',
    'dashboard.customersDebt': 'Deni la Wateja',
    'dashboard.customerBalance': 'Baki ya Mteja',
    'dashboard.inventoryValue': 'Thamani ya Akiba',
    'dashboard.overview': 'Muhtasari wa Mauzo na Faida',
    'dashboard.salesTrend': 'Mwenendo wa Mauzo',
    'dashboard.profitByCategory': 'Faida kwa Kipengele',
    'dashboard.businessHealth': 'Afya ya Biashara',
    'dashboard.patientsInTrack': 'Wagonjwa Kwenye Ufuatiliaji',
    'dashboard.pendingOrders': 'Oda Zinazosubiri',
    'dashboard.pending': 'Zinazosubiri',
    'dashboard.labTests': 'Vipimo vya Lab',
    'dashboard.nothingPending': 'Hakuna kinachosubiri. Yote yamekamilika.',
    'dashboard.notAvailableForView': 'Haipatikani kwa mwonekano huu',
    'dashboard.quickActions': 'Hatua za Haraka',
    'dashboard.searchPlaceholder': 'Tafuta... (Ctrl+K)',
    'dashboard.newSale': 'Mauzo Mapya',
    'dashboard.addPatient': 'Ongeza Mgonjwa',
    'dashboard.addStock': 'Ongeza Bidhaa',
    'dashboard.viewReports': 'Angalia Ripoti',
    'dashboard.purchaseOrders': 'Oda za Ununuzi',
    'dashboard.lab40Labs': 'Lab ya 40Labs',
    'dashboard.ePharmacy': 'ePharmacy',
    'dashboard.comingSoon': 'Inakuja hivi karibuni',
    'dashboard.totalStock': 'Jumla ya Akiba',
    'dashboard.categories': 'Vipengele',
    'dashboard.emptyItems': 'Bidhaa Zilizokwisha',
    'dashboard.expiredItems': 'Bidhaa Zilizopitwa na Wakati',
    'dashboard.view': 'Angalia',
    'dashboard.noPatientsInTrack': 'Hakuna wagonjwa kwenye ufuatiliaji',
    'dashboard.dispensed': 'Imepewa',
    'dashboard.labOrdered': 'Lab Inahitajika',
    'dashboard.labReady': 'Lab Tayari',
    'dashboard.errorLoading': 'Imeshindikana kupakia data ya dashibodi',
    'dashboard.retry': 'Jaribu Tena',
    'dashboard.noData': 'Hakuna data inayopatikana',
    'dashboard.previousChart': 'Chati Iliyopita',
    'dashboard.nextChart': 'Chati Inayofuata',

    // Metric names
    'dashboard.metricSales': 'Mauzo',
    'dashboard.metricProfit': 'Faida',
    'dashboard.metricPurchases': 'Ununuzi',
    'dashboard.metricStockValue': 'Thamani ya Akiba',

    // Group By
    'dashboard.groupBy': 'Kipengele / Wakati',
    'dashboard.groupByTime': 'Wakati',
    'dashboard.groupByCategory': 'Kipengele',

    // Chart types
    'dashboard.typeLine': 'Mstari',
    'dashboard.typeArea': 'Eneo',
    'dashboard.typeBar': 'Pau',
    'dashboard.typeRing': 'Pete',
    'dashboard.typePie': 'Mduara',
    'dashboard.typeRadar': 'Rada',

    // Periods
    'dashboard.period7d': 'Siku 7',
    'dashboard.period30d': 'Siku 30',
    'dashboard.period90d': 'Siku 90',
  },
  en: {
    // Dashboard labels
    'dashboard.title': 'Dashboard',
    'dashboard.monthlyProfit': 'Monthly Profit',
    'dashboard.profit': 'Profit',
    'dashboard.todaysSales': "Today's Sales",
    'dashboard.transactions': 'Transactions',
    'dashboard.supplierDebt': 'Supplier Debt',
    'dashboard.customersDebt': 'Customers Debt',
    'dashboard.customerBalance': 'Customer Balance',
    'dashboard.inventoryValue': 'Inventory Value',
    'dashboard.overview': 'Sales & Profit Overview',
    'dashboard.salesTrend': 'Sales Trend',
    'dashboard.profitByCategory': 'Profit by Category',
    'dashboard.businessHealth': 'Business Health',
    'dashboard.patientsInTrack': 'Patients in Track',
    'dashboard.pendingOrders': 'Pending Orders',
    'dashboard.pending': 'Pending',
    'dashboard.labTests': 'Lab Tests',
    'dashboard.nothingPending': 'Nothing pending. All caught up.',
    'dashboard.notAvailableForView': 'Not available for this view',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.searchPlaceholder': 'Search... (Ctrl+K)',
    'dashboard.newSale': 'New Sale',
    'dashboard.addPatient': 'Add Patient',
    'dashboard.addStock': 'Add Stock',
    'dashboard.viewReports': 'View Reports',
    'dashboard.purchaseOrders': 'Purchase Orders',
    'dashboard.lab40Labs': '40Labs (Lab)',
    'dashboard.ePharmacy': 'ePharmacy',
    'dashboard.comingSoon': 'Coming soon',
    'dashboard.totalStock': 'Total Stock',
    'dashboard.categories': 'Categories',
    'dashboard.emptyItems': 'Empty',
    'dashboard.expiredItems': 'Expire',
    'dashboard.view': 'View',
    'dashboard.noPatientsInTrack': 'No patients in track',
    'dashboard.dispensed': 'Dispensed',
    'dashboard.labOrdered': 'Lab Ordered',
    'dashboard.labReady': 'Lab Ready',
    'dashboard.errorLoading': 'Failed to load dashboard data',
    'dashboard.retry': 'Retry',
    'dashboard.noData': 'No data available',
    'dashboard.previousChart': 'Previous Chart',
    'dashboard.nextChart': 'Next Chart',

    // Metric names
    'dashboard.metricSales': 'Sales',
    'dashboard.metricProfit': 'Profit',
    'dashboard.metricPurchases': 'Purchases',
    'dashboard.metricStockValue': 'Stock Value',

    // Group By
    'dashboard.groupBy': 'Group By',
    'dashboard.groupByTime': 'Time',
    'dashboard.groupByCategory': 'Category',

    // Chart types
    'dashboard.typeLine': 'Line',
    'dashboard.typeArea': 'Area',
    'dashboard.typeBar': 'Bar',
    'dashboard.typeRing': 'Ring',
    'dashboard.typePie': 'Pie',
    'dashboard.typeRadar': 'Radar',

    // Periods
    'dashboard.period7d': '7d',
    'dashboard.period30d': '30d',
    'dashboard.period90d': '90d',
  },
} as const;

export type TranslationKey = keyof typeof translations.sw;

export function t(key: TranslationKey, lang: Language = 'sw'): string {
  return translations[lang]?.[key] || translations['en']?.[key] || key;
}
