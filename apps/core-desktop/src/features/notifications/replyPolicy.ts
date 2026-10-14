import type { CounterpartyType } from '@40labs/types';

export function canReplyToThread(counterpartyType: CounterpartyType): boolean {
  return counterpartyType === 'customer' || counterpartyType === 'business';
}
