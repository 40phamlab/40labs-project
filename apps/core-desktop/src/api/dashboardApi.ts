import {
  getInitialDashboardSummary,
  type DashboardSummary,
  type PatientInTrack,
} from '../devData';
import { salesApi } from './salesApi';
import { inventoryApi } from './inventoryApi';
import { purchasesApi } from './purchasesApi';
import { labApi } from './labApi';
import { customersApi } from './customersApi';

export type { DashboardSummary, PatientInTrack };

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const [
      salesRes,
      inventoryRes,
      medicinesRes,
      purchasesRes,
      labOrdersRes,
      customersRes,
    ] = await Promise.allSettled([
      salesApi.list(),
      inventoryApi.list(),
      inventoryApi.listMedicines(),
      purchasesApi.list(),
      labApi.listOrders(),
      customersApi.list(),
    ]);

    // Critical data checks: sales and inventory
    if (salesRes.status === 'rejected' && inventoryRes.status === 'rejected') {
      throw salesRes.reason || inventoryRes.reason || new Error('Failed to load core dashboard data');
    }

    if (salesRes.status === 'rejected') {
      throw salesRes.reason;
    }

    if (inventoryRes.status === 'rejected') {
      throw inventoryRes.reason;
    }

    const salesList = salesRes.status === 'fulfilled' ? salesRes.value : [];
    const inventoryList = inventoryRes.status === 'fulfilled' ? inventoryRes.value : [];
    const medicinesList = medicinesRes.status === 'fulfilled' ? medicinesRes.value : [];
    const purchasesList = purchasesRes.status === 'fulfilled' ? purchasesRes.value : [];
    const labOrdersList = labOrdersRes.status === 'fulfilled' ? labOrdersRes.value : [];
    const customersList = customersRes.status === 'fulfilled' ? customersRes.value : [];

    const inventoryItems = inventoryList.map((item) => ({
      id: item.id,
      workspace_id: item.workspace_id,
      branch_id: item.branch_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
      medicine_id: item.medicine_id,
      batch_number: item.batch_number,
      expiry_date: item.expiry_date,
      buy_price: item.buy_price,
      sell_price: item.sell_price,
      quantity: item.quantity,
      low_stock_threshold: item.low_stock_threshold,
      cold_chain_required: item.cold_chain_required,
    }));

    return getInitialDashboardSummary({
      sales: salesList,
      inventoryItems,
      medicines: medicinesList,
      purchaseOrders: purchasesList,
      labOrders: labOrdersList,
      customers: customersList,
    });
  },
};

export const dashboard = dashboardApi;
