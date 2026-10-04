export type Language = 'sw-TZ' | 'en' | 'sw';

export const translations = {
  'sw-TZ': {
    // Navigation
    'nav.home': 'Nyumbani',
    'nav.history': 'Historia',
    'nav.notifications': 'Taarifa',
    'nav.settings': 'Mipangilio',

    // Settings
    'settings.title': 'Mipangilio',
    'settings.language': 'Lugha',
    'settings.theme': 'Mandhari',
    'settings.dark': 'Giza',
    'settings.light': 'Nuru',

    // Pairing (Verified by user)
    'pairing.title': 'unga kifaa',
    'pairing.code': 'msimbo wa kuunga kifaa',
    'pairing.scan': 'Tambaza msimbo wa Qr',
    'pairing.cameraPermissionRequired': 'Ruhusa ya kamera inahitajika kutambaza msimbo wa Qr.',
    'pairing.grantPermission': 'Ruhusa ya Kamera',
    'pairing.failed': 'Kuunganisha kumeshindwa. Tafadhali hakikisha msimbo wa QR ni sahihi na umeunganishwa kwenye Wi-Fi ya duka.',
    'pairing.inProgress': 'Inaunganisha...',
    'pairing.scanToConnect': 'Tambaza ili Kuunganisha',
    'pairing.uploadQr': 'Pakia Picha ya Msimbo wa QR',
    'pairing.uploadError': 'Imeshindikana kusoma msimbo wa QR kutoka kwenye picha iliyochaguliwa. Tafadhali jaribu nyingine.',
    'pairing.notConnected': 'Haujaunganishwa na kitovu cha duka.',
    'pairing.connectPrompt': 'Unganisha kifaa chako kuwezesha mauzo, akiba na maabara.',
    'pairing.or': 'AU',

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

    // Relative Time & Status
    'dashboard.timeJustNow': 'Sasa hivi',
    'dashboard.timeMinutesAgo': 'Dakika {n} zilizopita',
    'dashboard.timeHoursAgo': 'Saa {n} zilizopita',
    'dashboard.timeYesterday': 'Jana',
    'dashboard.timeDaysAgo': 'Siku {n} zilizopita',
    'dashboard.statusPending': 'Inasubiri',
    'dashboard.statusSampleCollected': 'Sampuli imekusanywa',
    'dashboard.statusResultEntered': 'Matokeo yameingizwa',
    'dashboard.statusReportReady': 'Ripoti iko tayari',
    'dashboard.orderOrdinal': 'Oda #{id}',
    'dashboard.labOrdinal': 'Jaribio #{id}',
  },
  sw: {
    ...{},
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.history': 'History',
    'nav.notifications': 'Notifications',
    'nav.settings': 'Settings',

    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.dark': 'Dark',
    'settings.light': 'Light',

    // Pairing
    'pairing.title': 'Pair Device',
    'pairing.code': 'Pairing Code',
    'pairing.scan': 'Scan QR Code',
    'pairing.cameraPermissionRequired': 'Camera permission is required to scan the pairing QR code.',
    'pairing.grantPermission': 'Grant Permission',
    'pairing.failed': 'Pairing failed. Please check the QR code and ensure you are connected to the pharmacy Wi-Fi.',
    'pairing.inProgress': 'Pairing in progress...',
    'pairing.scanToConnect': 'Scan to Connect',
    'pairing.uploadQr': 'Upload QR Code Image',
    'pairing.uploadError': 'Failed to read QR code from the selected image. Please try another.',
    'pairing.notConnected': 'Not connected to a pharmacy hub.',
    'pairing.connectPrompt': 'Connect your device to enable sales, stock, and lab operations.',
    'pairing.or': 'OR',

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

    // Relative Time & Status
    'dashboard.timeJustNow': 'Just now',
    'dashboard.timeMinutesAgo': '{n}m ago',
    'dashboard.timeHoursAgo': '{n}h ago',
    'dashboard.timeYesterday': 'Yesterday',
    'dashboard.timeDaysAgo': '{n}d ago',
    'dashboard.statusPending': 'Pending',
    'dashboard.statusSampleCollected': 'Sample Collected',
    'dashboard.statusResultEntered': 'Result Entered',
    'dashboard.statusReportReady': 'Report Ready',
    'dashboard.orderOrdinal': 'Order #{id}',
    'dashboard.labOrdinal': 'Test #{id}',
  },
} as const;

export type TranslationKey = keyof typeof translations['sw-TZ'];

export function t(key: TranslationKey, lang: Language = 'sw-TZ'): string {
  const effectiveLang = lang === 'sw' ? 'sw-TZ' : lang;
  const dict = translations[effectiveLang] || translations['sw-TZ'];
  const fallbackDict = translations['en'];
  return (dict as any)[key] || (fallbackDict as any)[key] || key;
}

export * from './phone';
export * from './formatters';
