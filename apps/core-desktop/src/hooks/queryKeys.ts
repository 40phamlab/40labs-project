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
  messages: (notificationId: string) => [...notificationKeys.all, 'messages', notificationId] as const,
};

export const auditKeys = {
  all: ['audit'] as const,
  lists: () => [...auditKeys.all, 'list'] as const,
  list: () => [...auditKeys.lists()] as const,
  detail: (id: string) => [...auditKeys.all, 'detail', id] as const,
};

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
};

export const businessKeys = {
  all: ['business'] as const,
  detail: () => [...businessKeys.all, 'detail'] as const,
  branches: () => [...businessKeys.all, 'branches'] as const,
};

export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: () => [...usersKeys.lists()] as const,
  detail: (id: string) => [...usersKeys.all, 'detail', id] as const,
};

export const integrationsKeys = {
  all: ['integrations'] as const,
  detail: () => [...integrationsKeys.all, 'detail'] as const,
};

export const devicesKeys = {
  all: ['devices'] as const,
  lists: () => [...devicesKeys.all, 'list'] as const,
  list: () => [...devicesKeys.lists()] as const,
};

export const backupKeys = {
  all: ['backup'] as const,
  schedule: () => [...backupKeys.all, 'schedule'] as const,
  history: () => [...backupKeys.all, 'history'] as const,
};
