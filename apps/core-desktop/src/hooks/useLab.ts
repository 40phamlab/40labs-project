import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  LabOrder,
  LabSample,
  LabResult,
  TestCatalogEntry,
  LabOrderStatus,
  LabSampleStatus,
} from '@40labs/types';
import { labApi, usersApi, auditApi, CreateLabOrderPayload } from '../api';
import { labKeys } from './queryKeys';

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
    data: catalog = [],
    isLoading: isLoadingCatalog,
    isError: isErrorCatalog,
    error: errorCatalog,
    refetch: refetchCatalog,
  } = useQuery<TestCatalogEntry[]>({
    queryKey: labKeys.catalog(),
    queryFn: async () => labApi.listCatalog(),
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

  const isLoading = isLoadingOrders || isLoadingSamples || isLoadingResults || isLoadingCatalog;
  const isError = isErrorOrders || isErrorSamples || isErrorResults || isErrorCatalog;
  const error = errorOrders || errorSamples || errorResults || errorCatalog;

  const refetch = React.useCallback(() => {
    refetchOrders();
    refetchSamples();
    refetchResults();
    refetchCatalog();
  }, [refetchOrders, refetchSamples, refetchResults, refetchCatalog]);

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: async ({ customerId, testCatalogId }: { customerId: string; testCatalogId: string }) => {
      return labApi.createOrder(customerId, testCatalogId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labKeys.all });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LabOrderStatus }) => {
      return labApi.updateOrderStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labKeys.all });
    },
  });

  const collectSampleMutation = useMutation({
    mutationFn: async ({ orderId, sampleLabel }: { orderId: string; sampleLabel: string }) => {
      return labApi.collectSample(orderId, sampleLabel);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labKeys.all });
    },
  });

  const updateSampleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LabSampleStatus }) => {
      return labApi.updateSampleStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labKeys.all });
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
    },
  });

  // UI State
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'orders' | 'samples' | 'catalog' | string>('samples');

  return {
    orders,
    samples,
    results,
    catalog,
    users,
    auditLogs,
    isLoading,
    isError,
    error,
    refetch,

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

    isCreatingOrder: createOrderMutation.isPending,
  };
}
