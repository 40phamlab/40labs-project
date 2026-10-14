import { BaseEntity, ISODateString } from './common';

export type CounterpartyType = 'customer' | 'business' | 'gov' | 'marketing' | 'system';

export interface Thread extends BaseEntity {
  workspace_id: string;
  branch_id: string;
  counterparty_type: CounterpartyType;
  counterparty_key: string;
  counterparty_id: string | null;
  display_name: string;
  last_message_at: ISODateString;
  archived: boolean;
  last_message_preview?: string | null;
  unread_count: number;
}

export type ThreadSummary = Thread;
