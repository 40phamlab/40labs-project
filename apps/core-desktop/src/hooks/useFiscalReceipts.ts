import { useQuery } from '@tanstack/react-query';
import type { FiscalReceipt } from '@40labs/types';
import { salesApi } from '../api';
import { salesKeys } from './queryKeys';

export function useFiscalReceipts() {
  const {
    data: fiscalReceipts = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<FiscalReceipt[]>({
    queryKey: salesKeys.fiscalReceipts(),
    queryFn: async () => salesApi.listFiscalReceipts(),
  });

  return {
    fiscalReceipts,
    isLoading,
    isError,
    error,
    refetch,
  };
}
