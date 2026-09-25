export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: () => [...inventoryKeys.lists()] as const,
  medicines: () => [...inventoryKeys.all, 'medicines'] as const,
  detail: (id: string) => [...inventoryKeys.all, 'detail', id] as const,
};

export const salesKeys = {
  all: ['sales'] as const,
  lists: () => [...salesKeys.all, 'list'] as const,
  list: () => [...salesKeys.lists()] as const,
  fiscalReceipts: () => [...salesKeys.all, 'fiscalReceipts'] as const,
  detail: (id: string) => [...salesKeys.all, 'detail', id] as const,
};

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: () => [...customerKeys.lists()] as const,
  detail: (id: string) => [...customerKeys.all, 'detail', id] as const,
};

export const purchaseKeys = {
  all: ['purchases'] as const,
  lists: () => [...purchaseKeys.all, 'list'] as const,
  list: () => [...purchaseKeys.lists()] as const,
  suppliers: () => [...purchaseKeys.all, 'suppliers'] as const,
  detail: (id: string) => [...purchaseKeys.all, 'detail', id] as const,
};

export const labKeys = {
  all: ['lab'] as const,
  orders: () => [...labKeys.all, 'orders'] as const,
  samples: () => [...labKeys.all, 'samples'] as const,
  results: () => [...labKeys.all, 'results'] as const,
  catalog: () => [...labKeys.all, 'catalog'] as const,
  users: () => [...labKeys.all, 'users'] as const,
  auditLogs: () => [...labKeys.all, 'auditLogs'] as const,
};

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: () => [...notificationKeys.lists()] as const,
  detail: (id: string) => [...notificationKeys.all, 'detail', id] as const,
};
