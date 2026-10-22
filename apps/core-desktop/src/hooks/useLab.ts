import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  LabOrder,
  LabSample,
  LabResult,
  TestCatalogEntry,
  LabOrderStatus,
  LabSampleStatus,
  MedicineWithInventory,
  LabQcData,
  LabReport,
} from '@40labs/types';
import { labApi, usersApi, auditApi, CreateLabOrderPayload } from '../api';
import type { CreateTestCatalogPayload, CreateLabQcEquipmentPayload, CreateLabQcRecordPayload } from '../api/labApi';
import { labKeys, dashboardKeys } from './queryKeys';

export type { CreateLabOrderPayload };

export function useLab() {
  const queryClient = useQueryClient();

  // Queries
  const {
    data: orders = [],
    isLoading: isLoadingOrders,
    isError: isErrorOrders,
    error: errorOrders,
    refetch: refetchOrders,
  } = useQuery<LabOrder[]>({
    queryKey: labKeys.orders(),
    queryFn: async () => labApi.listOrders(),
  });

  const {
    data: samples = [],
    isLoading: isLoadingSamples,
    isError: isErrorSamples,
    error: errorSamples,
    refetch: refetchSamples,
  } = useQuery<LabSample[]>({
    queryKey: labKeys.samples(),
    queryFn: async () => labApi.listSamples(),
  });

  const {
    data: results = [],
    isLoading: isLoadingResults,
    isError: isErrorResults,
    error: errorResults,
    refetch: refetchResults,
  } = useQuery<LabResult[]>({
    queryKey: labKeys.results(),
    queryFn: async () => labApi.listResults(),
  });

  const {
    data: reports = [],
    isLoading: isLoadingReports,
    isError: isErrorReports,
    error: errorReports,
    refetch: refetchReports,
  } = useQuery<LabReport[]>({
    queryKey: ['lab-reports'],
    queryFn: async () => labApi.listReports(),
  });

  const {
    data: catalog = [],
    isLoading: isLoadingCatalog,
    isError: isErrorCatalog,
    error: errorCatalog,
    refetch: refetchCatalog,
  } = useQuery<TestCatalogEntry[]>({
    queryKey: labKeys.catalog(),
    queryFn: async () => labApi.listCatalog(),
  });

  const { data: stock = [], isLoading: isLoadingStock, isError: isErrorStock, error: errorStock, refetch: refetchStock } = useQuery<MedicineWithInventory[]>({
    queryKey: labKeys.stock(), queryFn: () => labApi.listStock(),
  });
  const { data: qcData = { equipment: [], records: [] }, isLoading: isLoadingQc, isError: isErrorQc, error: errorQc, refetch: refetchQc } = useQuery<LabQcData>({
    queryKey: labKeys.qc(), queryFn: () => labApi.getQcData(),
  });

  const {
    data: users = [],
  } = useQuery({
    queryKey: labKeys.users(),
    queryFn: async () => usersApi.list(),
  });

  const {
    data: auditLogs = [],
  } = useQuery({
    queryKey: labKeys.auditLogs(),
    queryFn: async () => auditApi.list(),
  });

  const isLoading = isLoadingOrders || isLoadingSamples || isLoadingResults || isLoadingReports || isLoadingCatalog || isLoadingStock || isLoadingQc;
  const isError = isErrorOrders || isErrorSamples || isErrorResults || isErrorReports || isErrorCatalog || isErrorStock || isErrorQc;
  const error = errorOrders || errorSamples || errorResults || errorReports || errorCatalog || errorStock || errorQc;

  const refetch = React.useCallback(() => {
    refetchOrders();
    refetchSamples();
    refetchResults();
    refetchReports();
    refetchCatalog();
    refetchStock();
    refetchQc();
  }, [refetchOrders, refetchSamples, refetchResults, refetchReports, refetchCatalog, refetchStock, refetchQc]);

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: async ({ customerId, testCatalogId }: { customerId: string; testCatalogId: string }) => {
      return labApi.createOrder(customerId, testCatalogId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LabOrderStatus }) => {
      return labApi.updateOrderStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });

  const collectSampleMutation = useMutation({
    mutationFn: async ({ orderId, sampleLabel }: { orderId: string; sampleLabel: string }) => {
      return labApi.collectSample(orderId, sampleLabel);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });

  const updateSampleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LabSampleStatus }) => {
      return labApi.updateSampleStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });

  const enterResultMutation = useMutation({
    mutationFn: async ({
      orderId,
      value,
      referenceRange,
      isOutOfRange,
    }: {
      orderId: string;
      value: string;
      referenceRange: string;
      isOutOfRange: boolean;
    }) => {
      return labApi.enterResult(orderId, value, referenceRange, isOutOfRange);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });

  const createReportMutation = useMutation({
    mutationFn: (payload: { patientId: string; orderId: string; summaryNote?: string; resultIds: string[] }) =>
      labApi.createReport(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lab-reports'] }),
  });

  const finalizeReportMutation = useMutation({
    mutationFn: ({ reportId, pin, summaryNote }: { reportId: string; pin: string; summaryNote?: string }) =>
      labApi.finalizeReport(reportId, pin, summaryNote),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lab-reports'] }),
  });

  const amendReportMutation = useMutation({
    mutationFn: ({ reportId, pin, summaryNote, resultIds }: { reportId: string; pin: string; summaryNote?: string; resultIds?: string[] }) =>
      labApi.amendReport(reportId, pin, summaryNote, resultIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lab-reports'] }),
  });

  const forwardReportMutation = useMutation({
    mutationFn: ({ reportId, toUserId, note }: { reportId: string; toUserId: string; note?: string }) =>
      labApi.forwardReport(reportId, toUserId, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lab-reports'] }),
  });

  const createCatalogMutation = useMutation({
    mutationFn: (payload: CreateTestCatalogPayload) => labApi.createCatalogEntry(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: labKeys.all }),
  });
  const createQcEquipmentMutation = useMutation({
    mutationFn: (payload: CreateLabQcEquipmentPayload) => labApi.createQcEquipment(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: labKeys.qc() }),
  });
  const createQcRecordMutation = useMutation({
    mutationFn: (payload: CreateLabQcRecordPayload) => labApi.createQcRecord(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: labKeys.qc() }),
  });

  // UI State
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'orders' | 'samples' | 'catalog' | string>('samples');

  return {
    orders,
    samples,
    results,
    reports,
    catalog,
    stock,
    qcData,
    users,
    auditLogs,
    isLoading,
    isError,
    error,
    refetch,
    isLoadingOrders,
    isOrdersError: isErrorOrders,
    errorOrders,
    refetchOrders,

    // UI state
    selectedOrderId,
    setSelectedOrderId,
    activeTab,
    setActiveTab,

    // Actions via Mutations
    createOrder: (customerId: string, testCatalogId: string) =>
      createOrderMutation.mutateAsync({ customerId, testCatalogId }),
    updateOrderStatus: (id: string, status: LabOrderStatus) =>
      updateOrderStatusMutation.mutateAsync({ id, status }),
    collectSample: (orderId: string, sampleLabel: string) =>
      collectSampleMutation.mutateAsync({ orderId, sampleLabel }),
    updateSampleStatus: (id: string, status: LabSampleStatus) =>
      updateSampleStatusMutation.mutateAsync({ id, status }),
    enterResult: (
      orderId: string,
      value: string,
      referenceRange: string,
      isOutOfRange: boolean
    ) =>
      enterResultMutation.mutateAsync({
        orderId,
        value,
        referenceRange,
        isOutOfRange,
      }),
    createReport: (payload: { patientId: string; orderId: string; summaryNote?: string; resultIds: string[] }) =>
      createReportMutation.mutateAsync(payload),
    finalizeReport: (reportId: string, pin: string, summaryNote?: string) =>
      finalizeReportMutation.mutateAsync({ reportId, pin, summaryNote }),
    amendReport: (reportId: string, pin: string, summaryNote?: string, resultIds?: string[]) =>
      amendReportMutation.mutateAsync({ reportId, pin, summaryNote, resultIds }),
    forwardReport: (reportId: string, toUserId: string, note?: string) =>
      forwardReportMutation.mutateAsync({ reportId, toUserId, note }),

    createCatalogEntry: (payload: CreateTestCatalogPayload) => createCatalogMutation.mutateAsync(payload),
    createQcEquipment: (payload: CreateLabQcEquipmentPayload) => createQcEquipmentMutation.mutateAsync(payload),
    createQcRecord: (payload: CreateLabQcRecordPayload) => createQcRecordMutation.mutateAsync(payload),

    isCreatingOrder: createOrderMutation.isPending,
    isCollectingSample: collectSampleMutation.isPending,
    isEnteringResult: enterResultMutation.isPending,
    isCreatingReport: createReportMutation.isPending,
    isFinalizingReport: finalizeReportMutation.isPending,
    isAmendingReport: amendReportMutation.isPending,
    isForwardingReport: forwardReportMutation.isPending,
    isCreatingCatalogEntry: createCatalogMutation.isPending,
    isCreatingQcEquipment: createQcEquipmentMutation.isPending,
    isCreatingQcRecord: createQcRecordMutation.isPending,
  };
}
