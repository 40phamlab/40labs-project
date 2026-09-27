import * as React from 'react';
import { useSales } from './useSales';
import { useInventory } from './useInventory';
import { useCustomers } from './useCustomers';
import { usePurchases } from './usePurchases';
import { useFiscalReceipts } from './useFiscalReceipts';
import { useAuditLog } from './useAuditLog';
import {
  reportCategoriesConfig,
  ReportCategoryId,
  DateRange,
  ReportContextData,
} from '../features/reports/config/reportCategories';

export interface UseReportsOptions {
  categoryId: ReportCategoryId;
  dateRange?: DateRange;
}

export function useReports({ categoryId, dateRange }: UseReportsOptions) {
  const effectiveDateRange = React.useMemo<DateRange>(() => {
    if (dateRange) return dateRange;

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return { start, end };
  }, [dateRange]);

  const {
    completedSales,
    isLoading: isLoadingSales,
    isError: isSalesError,
    refetchSales,
  } = useSales();

  const {
    items: inventoryItems,
    isLoading: isLoadingInventory,
    isError: isInventoryError,
    refetch: refetchInventory,
  } = useInventory();

  const {
    customers,
    isLoading: isLoadingCustomers,
    isError: isCustomersError,
    refetch: refetchCustomers,
  } = useCustomers();

  const {
    purchaseOrders,
    suppliers,
    isLoading: isLoadingPurchases,
  } = usePurchases();

  const {
    fiscalReceipts,
    isLoading: isLoadingFiscal,
    isError: isFiscalError,
    refetch: refetchFiscal,
  } = useFiscalReceipts();

  const {
    auditLogs,
    isLoading: isLoadingAudit,
    isError: isAuditError,
    refetch: refetchAudit,
  } = useAuditLog();

  const isLoading =
    isLoadingSales ||
    isLoadingInventory ||
    isLoadingCustomers ||
    isLoadingPurchases ||
    isLoadingFiscal ||
    isLoadingAudit;

  const isError =
    isSalesError ||
    isInventoryError ||
    isCustomersError ||
    isFiscalError ||
    isAuditError;

  const refetchAll = React.useCallback(() => {
    refetchSales();
    refetchInventory();
    refetchCustomers();
    refetchFiscal();
    refetchAudit();
  }, [refetchSales, refetchInventory, refetchCustomers, refetchFiscal, refetchAudit]);

  const contextData = React.useMemo<ReportContextData>(
    () => ({
      sales: completedSales,
      inventory: inventoryItems,
      customers,
      purchases: purchaseOrders,
      suppliers,
      fiscalReceipts,
      auditLogs,
      dateRange: effectiveDateRange,
    }),
    [
      completedSales,
      inventoryItems,
      customers,
      purchaseOrders,
      suppliers,
      fiscalReceipts,
      auditLogs,
      effectiveDateRange,
    ]
  );

  const categoryConfig = reportCategoriesConfig[categoryId] || reportCategoriesConfig.sales;

  const kpis = React.useMemo(() => {
    return categoryConfig.buildKpis(contextData);
  }, [categoryConfig, contextData]);

  const { config: chartConfig, data: chartData } = React.useMemo(() => {
    return categoryConfig.buildChart(contextData);
  }, [categoryConfig, contextData]);

  const { columns: tableColumns, rows: tableRows } = React.useMemo(() => {
    return categoryConfig.buildTable(contextData);
  }, [categoryConfig, contextData]);

  return {
    categoryId,
    categoryConfig,
    dateRange: effectiveDateRange,
    kpis,
    chartConfig,
    chartData,
    tableColumns,
    tableRows,
    isLoading,
    isError,
    refetch: refetchAll,
  };
}
