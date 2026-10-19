import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '../api/salesApi';
import type { DispensingInstruction } from '@40labs/types';
import { useToast } from './useToast';

export function useDispensingInstructions(saleId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: instructions = [], isLoading } = useQuery({
    queryKey: ['dispensing-instructions', saleId],
    queryFn: () => (saleId ? salesApi.getInstructions(saleId) : Promise.resolve([])),
    enabled: !!saleId,
  });

  const mutation = useMutation({
    mutationFn: (newInstructions: DispensingInstruction[]) => {
      if (!saleId) throw new Error('No sale ID');
      return salesApi.updateInstructions(saleId, newInstructions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispensing-instructions', saleId] });
      toast.success('Instructions saved successfully');
    },
    onError: () => {
      toast.error('Failed to save instructions');
    },
  });

  return {
    instructions,
    isLoading,
    saveInstructions: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
