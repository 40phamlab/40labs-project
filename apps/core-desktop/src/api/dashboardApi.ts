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
    ] = await Promise.all([
      salesApi.list(),
      inventoryApi.list(),
      inventoryApi.listMedicines(),
      purchasesApi.list(),
      labApi.listOrders(),
      customersApi.list(),
    ]);

    const salesList = salesRes;
    const inventoryList = inventoryRes;
    const medicinesList = medicinesRes;
    const purchasesList = purchasesRes;
    const labOrdersList = labOrdersRes;
    const customersList = customersRes;

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
